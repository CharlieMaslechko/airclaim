import janus


class MessageBridge:
    """Async-safe bridge between producers (TG) and consumers (WS)."""

    def __init__(self, maxsize: int = 10000):
        self._queue = janus.Queue(maxsize=maxsize)

    async def publish(self, message: str) -> None:
        """Publish a message into the bridge."""
        await self._queue.async_q.put(message)

    async def subscribe(self):
        """Async generator yielding new messages."""
        while True:
            msg = await self._queue.async_q.get()
            yield msg
