# get_channel_ids.py
import os
from telethon import TelegramClient
from dotenv import load_dotenv
import asyncio

load_dotenv()

api_id = int(os.getenv("TELEGRAM_API_ID"))
api_hash = os.getenv("TELEGRAM_API_HASH")
session_name = os.getenv("TELEGRAM_SESSION_NAME", "sera_air_session")


async def main():
    async with TelegramClient(session_name, api_id, api_hash) as client:
        dialogs = await client.get_dialogs()
        for dialog in dialogs:
            if dialog.is_channel:
                print(f"{dialog.name} — ID: {dialog.id}")


asyncio.run(main())
