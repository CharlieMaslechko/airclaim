import os
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.tl.types import Message
from typing import Callable, Awaitable

load_dotenv()

TELEGRAM_API_ID = int(os.getenv("TELEGRAM_API_ID"))
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TEST_CHANNEL_ID = int(
    os.getenv("TEST_TELEGRAM_CHANNEL_ID")
)  # <- Make sure this is an `int` now


class TelegramListener:
    def __init__(self, on_message: Callable[[Message], Awaitable[None]]):
        self.channel_id = TEST_CHANNEL_ID
        self.on_message = on_message
        self.client = TelegramClient(
            "sera_air_session", TELEGRAM_API_ID, TELEGRAM_API_HASH
        )

    async def start(self):
        await self.client.start()
        print(f"[*] Connected to Telegram. Fetching entity for: {self.channel_id}")

        # 🔧 Get proper entity object for the private channel
        entity = await self.client.get_entity(self.channel_id)

        @self.client.on(events.NewMessage(chats=entity))
        async def _handler(event: events.NewMessage.Event):
            await self.on_message(event.message)

        await self.client.run_until_disconnected()
