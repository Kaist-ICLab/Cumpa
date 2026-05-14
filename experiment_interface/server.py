#!/usr/bin/env python3
import base64
import json
import mimetypes
import os
import re
import secrets
import sys
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Optional
from urllib import error, request


ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "static"
LOG_DIR = ROOT / "logs"
SESSION_DIR = ROOT / "sessions"

DEFAULT_MODEL = os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_CHAT_MAX_COMPLETION_TOKENS = int(os.environ.get("OPENAI_CHAT_MAX_COMPLETION_TOKENS", "512"))
OPENAI_CHAT_TIMEOUT = float(os.environ.get("OPENAI_CHAT_TIMEOUT", "60"))
OPENAI_STT_MODEL = os.environ.get("OPENAI_STT_MODEL", "gpt-4o-mini-transcribe")
OPENAI_STT_LANGUAGE = os.environ.get("OPENAI_STT_LANGUAGE", "ko")
OPENAI_STT_TIMEOUT = float(os.environ.get("OPENAI_STT_TIMEOUT", "60"))
OPENAI_TTS_MODEL = os.environ.get("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
OPENAI_TTS_VOICE = os.environ.get("OPENAI_TTS_VOICE", "alloy")
OPENAI_TTS_TIMEOUT = float(os.environ.get("OPENAI_TTS_TIMEOUT", "60"))
EXPERIMENT_ACCESS_TOKEN = os.environ.get("EXPERIMENT_ACCESS_TOKEN", "")


def ensure_dirs():
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    SESSION_DIR.mkdir(parents=True, exist_ok=True)


def append_jsonl(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
        f.write("\n")


def safe_file_stem(value: Optional[str]) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "_", str(value or "unknown")).strip("._-")
    return (cleaned or "unknown")[:120]


def save_session_snapshot(payload: dict) -> Path:
    session_id = payload.get("session_id")
    if not session_id:
        raise ValueError("session_id is required.")

    saved_at = datetime.now().isoformat()
    snapshot = {
        **payload,
        "saved_at": saved_at,
    }
    path = SESSION_DIR / f"{safe_file_stem(session_id)}.json"
    write_json(path, snapshot)
    return path


def call_openai_chat(model: str, system_instruction: str, history: list[dict]) -> dict:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    messages = [{"role": "developer", "content": system_instruction}]
    for item in history:
        role = item.get("role", "user")
        if role not in {"user", "assistant", "system", "developer"}:
            role = "user"
        messages.append({"role": role, "content": item.get("content", "")})

    body = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "top_p": 0.9,
        "max_completion_tokens": OPENAI_CHAT_MAX_COMPLETION_TOKENS,
    }
    req = request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=OPENAI_CHAT_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI chat HTTP {exc.code}: {details}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"OpenAI chat request failed: {exc}") from exc

    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError(f"No OpenAI chat choices returned: {data}")

    message = choices[0].get("message") or {}
    text = (message.get("content") or "").strip()
    if not text:
        raise RuntimeError(f"OpenAI chat returned empty text: {data}")

    return {"text": text, "raw": data}


def call_openai_stt(audio_bytes: bytes, mime_type: str) -> dict:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    boundary = "----CodexExperimentBoundary"
    filename = f"audio{mimetypes.guess_extension(mime_type) or '.webm'}"

    body = bytearray()
    fields = [("model", OPENAI_STT_MODEL)]
    if OPENAI_STT_LANGUAGE:
        fields.append(("language", OPENAI_STT_LANGUAGE))
    for name, value in fields:
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"))
        body.extend(str(value).encode("utf-8"))
        body.extend(b"\r\n")

    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(
        (
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f"Content-Type: {mime_type}\r\n\r\n"
        ).encode("utf-8")
    )
    body.extend(audio_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = request.Request(
        "https://api.openai.com/v1/audio/transcriptions",
        data=bytes(body),
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=OPENAI_STT_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI STT HTTP {exc.code}: {details}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"OpenAI STT request failed: {exc}") from exc

    text = (data.get("text") or "").strip()
    if not text:
        raise RuntimeError(f"OpenAI STT returned empty text: {data}")
    return {"text": text, "raw": data}


def call_openai_tts(text: str) -> dict:
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is not set.")

    body = {
        "model": OPENAI_TTS_MODEL,
        "voice": OPENAI_TTS_VOICE,
        "input": text,
        "format": "mp3",
    }
    req = request.Request(
        "https://api.openai.com/v1/audio/speech",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=OPENAI_TTS_TIMEOUT) as resp:
            audio = resp.read()
            content_type = resp.headers.get("Content-Type", "audio/mpeg")
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI TTS HTTP {exc.code}: {details}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"OpenAI TTS request failed: {exc}") from exc

    return {
        "audio_base64": base64.b64encode(audio).decode("ascii"),
        "content_type": content_type,
    }


class ExperimentHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Permissions-Policy", "microphone=(self)")
        super().end_headers()

    def _send_json(self, payload: dict, status: int = HTTPStatus.OK):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        try:
            self.wfile.write(encoded)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _is_authorized(self) -> bool:
        if not EXPERIMENT_ACCESS_TOKEN:
            return True
        provided = self.headers.get("X-Experiment-Token", "")
        return secrets.compare_digest(provided, EXPERIMENT_ACCESS_TOKEN)

    def do_GET(self):
        if self.path == "/api/health":
            self._send_json(
                {
                    "ok": True,
                    "model": DEFAULT_MODEL,
                    "has_openai_key": bool(OPENAI_API_KEY),
                    "requires_access_token": bool(EXPERIMENT_ACCESS_TOKEN),
                }
            )
            return
        super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api/") and not self._is_authorized():
            self._send_json({"ok": False, "error": "Unauthorized"}, status=HTTPStatus.UNAUTHORIZED)
            return
        if self.path == "/api/chat":
            self.handle_chat()
            return
        if self.path == "/api/stt":
            self.handle_stt()
            return
        if self.path == "/api/tts":
            self.handle_tts()
            return
        if self.path == "/api/log":
            self.handle_log()
            return
        if self.path == "/api/session":
            self.handle_session()
            return
        self._send_json({"ok": False, "error": "Not found"}, status=HTTPStatus.NOT_FOUND)

    def parse_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def handle_chat(self):
        try:
            payload = self.parse_json()
            model = payload.get("model") or DEFAULT_MODEL
            system_instruction = payload["system_instruction"]
            history = payload["history"]
            response = call_openai_chat(model, system_instruction, history)
            self._log_event(
                payload.get("session_id"),
                "chat_completion",
                {
                    "request_meta": {
                        "participant_id": payload.get("participant_id"),
                        "condition": payload.get("condition"),
                        "round_index": payload.get("round_index"),
                        "model": model,
                    },
                    "history": history,
                    "response_text": response["text"],
                },
            )
            self._send_json({"ok": True, "text": response["text"]})
        except Exception as exc:
            self._send_json({"ok": False, "error": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def handle_stt(self):
        payload = {}
        try:
            payload = self.parse_json()
            audio_bytes = base64.b64decode(payload["audio_base64"])
            mime_type = payload.get("mime_type", "audio/webm")
            response = call_openai_stt(audio_bytes, mime_type)
            self._log_event(
                payload.get("session_id"),
                "stt_result",
                {
                    "mime_type": mime_type,
                    "byte_length": len(audio_bytes),
                    "transcript": response["text"],
                },
            )
            self._send_json({"ok": True, "text": response["text"]})
        except Exception as exc:
            self._log_event(
                payload.get("session_id"),
                "stt_error",
                {
                    "mime_type": payload.get("mime_type"),
                    "error": str(exc),
                },
            )
            self._send_json({"ok": False, "error": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def handle_tts(self):
        payload = {}
        try:
            payload = self.parse_json()
            response = call_openai_tts(payload["text"])
            self._log_event(
                payload.get("session_id"),
                "tts_result",
                {"text_length": len(payload["text"]), "content_type": response["content_type"]},
            )
            self._send_json({"ok": True, **response})
        except Exception as exc:
            self._log_event(
                payload.get("session_id"),
                "tts_error",
                {
                    "text_length": len(payload.get("text", "")),
                    "error": str(exc),
                },
            )
            self._send_json({"ok": False, "error": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def handle_log(self):
        try:
            payload = self.parse_json()
            self._log_event(payload.get("session_id"), payload.get("event", "log"), payload)
            self._send_json({"ok": True})
        except Exception as exc:
            self._send_json({"ok": False, "error": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def handle_session(self):
        try:
            payload = self.parse_json()
            path = save_session_snapshot(payload)
            self._log_event(
                payload.get("session_id"),
                "session_snapshot_saved",
                {
                    "session_id": payload.get("session_id"),
                    "status": payload.get("status"),
                    "reason": payload.get("save_reason"),
                    "filename": path.name,
                },
            )
            self._send_json({"ok": True, "filename": path.name})
        except Exception as exc:
            self._send_json({"ok": False, "error": str(exc)}, status=HTTPStatus.INTERNAL_SERVER_ERROR)

    def _log_event(self, session_id: Optional[str], event: str, payload: dict):
        log_name = f"{safe_file_stem(session_id)}.jsonl"
        append_jsonl(
            LOG_DIR / log_name,
            {
                "event": event,
                "timestamp": datetime.now().isoformat(),
                "payload": payload,
            },
        )


def main():
    ensure_dirs()
    host = os.environ.get("EXPERIMENT_HOST", "127.0.0.1")
    port = int(os.environ.get("EXPERIMENT_PORT", "8000"))
    server = ThreadingHTTPServer((host, port), ExperimentHandler)
    if host == "0.0.0.0":
        print(f"Serving experiment UI at http://0.0.0.0:{port}")
        print("External binding enabled. Clients should use this server's reachable IP or hostname.")
        print("Restrict network access to trusted clients.")
    else:
        print(f"Serving experiment UI at http://{host}:{port}")
    print(f"Static dir: {STATIC_DIR}")
    print(f"Logs dir:   {LOG_DIR}")
    print(f"Sessions dir: {SESSION_DIR}")
    if not OPENAI_API_KEY:
        print("Warning: OPENAI_API_KEY is not set. /api/chat, /api/stt and /api/tts will fail.", file=sys.stderr)
    if EXPERIMENT_ACCESS_TOKEN:
        print("Access token protection is enabled for POST /api/* routes.")
    else:
        print("Warning: EXPERIMENT_ACCESS_TOKEN is not set. POST /api/* routes are unprotected.", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")


if __name__ == "__main__":
    main()
