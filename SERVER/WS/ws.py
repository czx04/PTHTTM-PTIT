from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[(WebSocket, str)] = []

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append((websocket, user_id))
        await self.broadcast_user_list()

    def disconnect(self, websocket: WebSocket, user_id: str):
        try:
            self.active_connections.remove((websocket, user_id))
        except ValueError:
            pass

    async def broadcast_user_list(self):
        online_users = sorted(list(set([user for _, user in self.active_connections])))
        message = f"ONLINE_USERS:{','.join(online_users)}"

        for connection, _ in self.active_connections:
            await connection.send_text(message)
