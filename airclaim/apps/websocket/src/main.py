import asyncio
import threading
import uvloop
from bridge.queue import MessageBridge
from telegram.listener import TelegramListener
from websocket.server import WebSocketServer

asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())


def run_in_thread(coro):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(coro)


async def main():
    bridge = MessageBridge()
    tg_listener = TelegramListener(bridge.publish)
    ws_server = WebSocketServer(bridge)

    # run Telegram listener in its own thread / loop
    threading.Thread(
        target=lambda: run_in_thread(tg_listener.start()), daemon=True
    ).start()

    # run WebSocket server in the main loop
    await ws_server.start()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[!] Shutting down gracefully.")
