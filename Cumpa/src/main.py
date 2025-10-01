import os, threading, time, argparse, asyncio

from dotenv import load_dotenv
from .lib.microphone import pa as mic_pa

from .lib.loggable import Loggable
from .audio.player import ResponsePlayer
from .graphics.graphics import Graphics
from .message_event import MessageListener
from .async_event import AsyncListener, AsyncBroker
from .dialog_manager.llm_chatgpt import LLMChatManager
from .dialog_manager.llm_chatgpt_authored import AuthoredLLMChatManager
from .dialog_manager.faster_whisper_recognizer import FasterWhisperRecognizer

from src.graphics.frontend_bridge import FrontendBridge

# Argument Parser to check if it's using authored mode
parser = argparse.ArgumentParser()
parser.add_argument("--authored", action="store_true")
args = parser.parse_args()
use_authored = args.authored

load_dotenv()


class Core(threading.Thread, Loggable):

    def __init__(self):
        threading.Thread.__init__(self)
        Loggable.__init__(self)
        self.set_tag("core")

        self.TARGET_DEVICE = os.getenv("TARGET_DEVICE", "PC")  # RPi or PC
        self.response_player = ResponsePlayer()
        # Initialize LLM chat manager in authored or default mode
        if use_authored:
            self.log("Using authored mode")
            self.llm_chat = AuthoredLLMChatManager()
        else:
            self.log("Using free mode")
            self.llm_chat = LLMChatManager()
        self.speech_recognizer = FasterWhisperRecognizer(
            model_size="base"
        )  # Faster-Whisper로 변경
        # self.threads = (self.llm_chat, self.speech_recognizer)
        self.threads = (self.llm_chat,)

    def get_log_tags(self):
        return [self.get_tag()]
        return [self.get_tag(), *[t.get_tag() for t in self.threads]]

    def run(self):
        self.log("Core started")
        for thread in self.threads:
            thread.start()
        try:
            AsyncListener().run()
        except KeyboardInterrupt:
            self.cleanup()
        except:
            self.cleanup()
            raise

    def stop(self):
        self.cleanup()

    def cleanup(self):
        self.log("Cleaning up")
        # Producers should be stopped at last because the consumers may be blocked.
        for thread in self.threads:
            thread.stop()
        for thread in self.threads:
            thread.join()
        mic_pa.terminate()
        self.log("Cleaned up")


def _send_boot_blocking():
    time.sleep(1.0)  # 브라우저가 WS 붙을 시간
    try:
        bridge = FrontendBridge()
        print(f"[DEBUG] FrontendBridge URL = {bridge.url}")
        asyncio.run(
            bridge._send_event_async(
                {"__type__": "event", "event": "boot", "msg": "Cumpa is up!"}
            )
        )
        print("[DEBUG] boot event sent (thread)")
    except Exception as e:
        print(f"[WARN] boot event failed in thread: {e}")


def start_background_loop() -> asyncio.AbstractEventLoop:
    loop = asyncio.new_event_loop()
    t = threading.Thread(target=loop.run_forever, daemon=True)
    t.start()
    return loop

def start_bg_loop():
    loop = asyncio.new_event_loop()
    threading.Thread(target=loop.run_forever, daemon=True).start()
    return loop


if __name__ == "__main__":
    core = Core()
    core.start()
    # Display Cumpa in web
    bridge = FrontendBridge()
    bg_loop = start_bg_loop()
    asyncio.run_coroutine_threadsafe(bridge.run(), bg_loop)

    async def send_event(obj: dict):
        await bridge._send_event_async({"__type__": "event", **obj})

    def boot_once():
        time.sleep(1.0)
        asyncio.run_coroutine_threadsafe(
            send_event({"event": "boot", "msg": "Cumpa is up!"}), bg_loop
        )

    threading.Thread(target=boot_once, daemon=True).start()

    def on_chat_response(payload):
        asyncio.run_coroutine_threadsafe(
            bridge._send_event_async({"event": "chat_response", **payload}), bg_loop
        )

    AsyncBroker().subscribe("chat_response", on_chat_response)

    # Run GUI
    gui = Graphics()
    gui.run(log_tags=core.get_log_tags())
