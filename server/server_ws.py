# server_ws.py (새 파일로 모듈 분리만)
import os, sys, json
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# import asyncevent from Cumpa
PARENT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PARENT not in sys.path:
    sys.path.insert(0, PARENT)
from Cumpa.src.async_event import AsyncBroker

router = APIRouter()
broker = AsyncBroker()


class WSmanager:
    def __init__(self):
        self.active: Dict[str, Set[WebSocket]] = {}

    async def connect(self, sid: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(sid, set()).add(ws)
        await self.broadcast_text(
            sid, json.dumps({"__type__": "server", "event": "ws_connected"})
        )

    def disconnect(self, sid: str, ws: WebSocket):
        self.active.get(sid, set()).discard(ws)

    async def broadcast_text(self, sid: str, text: str):
        for ws in list(self.active.get(sid, set())):
            try:
                await ws.send_text(text)
            except:
                self.disconnect(sid, ws)

    async def broadcast_bytes(self, sid: str, data: bytes):
        for ws in list(self.active.get(sid, set())):
            try:
                await ws.send_bytes(data)
            except:
                self.disconnect(sid, ws)

    async def broadcast_json(self, sid: str, payload: dict):
        await self.broadcast_text(sid, json.dumps(payload, ensure_ascii=False))


ws_manager = WSmanager()


@router.websocket("/ws/cumpa/{session_id}")
async def ws_cumpa(session_id: str, websocket: WebSocket):
    await ws_manager.connect(session_id, websocket)

    try:
        while True:
            msg = await websocket.receive()
            mtype = msg.get("type")

            if mtype == "websocket.receive":
                # A. TEXT frames
                if msg.get("text") is not None:
                    raw = msg["text"]
                    try:
                        obj = json.loads(raw)
                    except Exception:
                        # Not JSON? ignore or log
                        # print("[WS] invalid json:", raw)
                        continue

                    # 1. Browser → Server: user input -> publish to Cumpa via AsyncBroker
                    if obj.get("type") == "user_message":
                        await ws_manager.broadcast_json(
                            session_id,
                            {
                                "__type__": "event",
                                "event": "user_message",
                                "text": obj.get("text", ""),
                                "sessionId": obj.get("sessionId") or session_id,
                                "ts": obj.get("ts"),
                            },
                        )
                        # (optional ACK)
                        # await ws_manager.broadcast_json(session_id, {"__type__":"server","event":"user_message_ack"})

                    # 2. Cumpa → Server: output event -> broadcast back to browsers
                    elif obj.get("__type__") == "event":
                        # e.g. {"__type__":"event","event":"chat_response","msg":"...","emotion":"중립"}
                        await ws_manager.broadcast_json(session_id, obj)

                    # 3. Anything else -> just log (or ignore)
                    else:
                        # print("[WS] unhandled:", obj)
                        pass

                # B. BYTES frames (audio etc.) — forward as-is
                elif msg.get("bytes") is not None:
                    await ws_manager.broadcast_bytes(session_id, msg["bytes"])

                else:
                    # No text/bytes — rare, ignore
                    pass

            elif mtype == "websocket.disconnect":
                # Normal close
                break

            else:
                # Unexpected type — ignore or log
                # print(f"[WS DEBUG] unexpected msg type={mtype}, payload={msg}")
                pass

    except WebSocketDisconnect:
        pass
    except Exception as e:
        import traceback

        print("[WS ERROR]", e)
        traceback.print_exc()
    finally:
        ws_manager.disconnect(session_id, websocket)
