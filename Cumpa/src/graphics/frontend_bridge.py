# This file enables to send events from Cumpa (server/main.py) to the web frontend (web/authoring-tool/src/index.js) via WebSocket.

import os, asyncio, json
import websockets
from ..async_event import AsyncBroker
from ..lib.time_stamp import get_current_timestamp


class FrontendBridge:
    def __init__(self, broker: AsyncBroker | None = None):
        self.sid = os.getenv("CUMPA_SESSION_ID", "dev")
        base = os.getenv("CUMPA_WS_URL", "ws://localhost:8000/ws/cumpa")
        self.url = f"{base}/{self.sid}"
        print(f"[DEBUG] FrontendBridge URL = {self.url}")
        self._ws = None
        self.broker = AsyncBroker()
        self._send_q: asyncio.Queue = asyncio.Queue()
        self._running = False

    async def run(self):
        # keep the connection open, reconnect on drop
        while True:
            try:
                async with websockets.connect(self.url) as ws:
                    self._ws = ws
                    # Handle messages from web
                    async for raw in ws:
                        await self.handle_message(raw)
            except Exception as e:
                print(f"[FrontendBridge] WS error: {e}. Reconnecting in 1s...")
                await asyncio.sleep(1)

    async def _send_event_async(self, obj: dict):
        async with websockets.connect(self.url, max_size=1_000_000) as ws:
            print("[DEBUG] trying to send", obj)
            payload = {"__type__": "event", **obj}
            await ws.send(json.dumps(payload))
            # TODO: this is a test so close it after a while
            await asyncio.sleep(0.1)
            print("[DEBUG] event sent:", payload)

    def send_event_once(self, obj: dict):
        asyncio.run(self._send_event_async(obj))

    async def handle_message(self, msg: str | bytes):
        if isinstance(msg, (bytes, bytearray)):
            # print("[FrontendBridge] ignore binary frame")
            return

        try:
            data = json.loads(msg)
        except Exception:
            print("[FrontendBridge] invalid json:", msg)
            return

        if data.get("__type__") == "event" and data.get("event") == "user_message":
            text = (data.get("text") or data.get("content") or "").strip()
            if not text:
                return
            now = data.get("ts") or get_current_timestamp()
            payload = {
                "content": text,
                "start_time": now,
                "end_time": now,
                "sessionId": data.get("sessionId"),
            }
            print("[FrontendBridge] -> emit chat_user_input:", payload)
            self.broker.emit(("chat_user_input", payload))
            return

        # (선택) 서버가 브라우저로만 내보내는 chat_response를 이쪽에서 굳이 재중계할 필요는 없음.
        # 필요 시 로깅만
        if data.get("__type__") == "event" and data.get("event") == "chat_response":
            # print("[FrontendBridge] chat_response (seen by app):", data)
            return

        # 그 외
        print("[FrontendBridge] unhandled msg:", data)
