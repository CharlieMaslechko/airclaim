# main.py

import asyncio

from telegram_hook import TelegramListener


async def handle_test_message(message):
    print(f"[TEST] New message:\n{message.message}")
    print(f"[TEST] Parsed message:\n{message.message}")


async def main():
    listener = TelegramListener(on_message=handle_test_message)
    await listener.start()


if __name__ == "__main__":
    asyncio.run(main())
