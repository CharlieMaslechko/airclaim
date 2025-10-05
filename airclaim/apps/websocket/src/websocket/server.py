import asyncio
import websockets


class WebSocketServer:
    """Broadcasts messages from the bridge to all connected clients."""

    def __init__(self, bridge):
        self.bridge = bridge
        self.active_clients: set[websockets.WebSocketServerProtocol] = set()

    async def _client_handler(self, ws):
        """Handle a single client's lifecycle."""
        self.active_clients.add(ws)
        print(f"[+] New subscriber connected. Total: {len(self.active_clients)}")

        try:
            async for _ in ws:
                # Extensions probably won't send messages back, but this keeps it clean.
                pass
        except Exception as e:
            print(f"[!] Client error: {e}")
        finally:
            self.active_clients.remove(ws)
            print(f"[-] Subscriber disconnected. Total: {len(self.active_clients)}")

    async def start(self, host: str = "0.0.0.0", port: int = 8765):
        """Start the WebSocket server and begin broadcasting bridge messages."""
        async with websockets.serve(self._client_handler, host, port):
            print(f"[*] WebSocket server listening on ws://{host}:{port}")

            async for message in self.bridge.subscribe():
                if not self.active_clients:
                    continue  # no one to broadcast to
                await asyncio.gather(
                    *[client.send(message) for client in self.active_clients],
                    return_exceptions=True,
                )
