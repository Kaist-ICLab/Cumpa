# This file enables to send events from Cumpa (server/main.py) to the web frontend (web/authoring-tool/src/index.js) via WebSocket.

import os, asyncio, json
import websockets
from ..async_event import AsyncBroker
from ..lib.time_stamp import get_current_timestamp


class FrontendBridge:
    def __init__(self):
        self.sid = os.getenv("CUMPA_SESSION_ID", "dev")
        base = os.getenv("CUMPA_WS_URL", "ws://localhost:8000/ws/cumpa")
        self.url = f"{base}/{self.sid}"
        print(f"[DEBUG] FrontendBridge URL = {self.url}")
        self._ws = None
        self._send_q: asyncio.Queue = asyncio.Queue()
        self._running = False
        
    async def run(self):
            # keep the connection open, reconnect on drop
            while True:
                try:
                    async with websockets.connect(self.url) as ws:
                        self._ws = ws
                        # optionally listen messages from server:
                        async for _ in ws:
                            pass  # no-op; or route to log if needed
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
        
    async def handle_message(self, msg: str):
        try:
            data = json.loads(msg)
            if data.get("__type__") == "event" and data.get("event") == "chat_user_input":
                # Send input from web to core event
                now = get_current_timestamp()
                AsyncBroker().emit(("chat_user_input", {"content": data.get("content"), "start_time": now, "end_time": now}))
        except Exception as e:
            print(f"[FrontendBridge] failed to handle message: {e}")
    