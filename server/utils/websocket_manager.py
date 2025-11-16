from fastapi import WebSocket
from typing import Dict, Set, Optional
import json


class WebSocketManager:
    """
    Quản lý WebSocket connections và broadcast messages
    """
    
    def __init__(self):
        # Dict[user_id, WebSocket]
        self.active_connections: Dict[str, WebSocket] = {}
        # Dict[room_id, Set[user_id]]
        self.room_participants: Dict[str, Set[str]] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        """
        Kết nối WebSocket cho user
        """
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, user_id: str):
        """
        Ngắt kết nối WebSocket
        """
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
        
        # Xóa user khỏi tất cả rooms
        for room_id in list(self.room_participants.keys()):
            if user_id in self.room_participants[room_id]:
                self.room_participants[room_id].remove(user_id)
    
    def join_room(self, user_id: str, room_id: str):
        """
        Thêm user vào room
        """
        if room_id not in self.room_participants:
            self.room_participants[room_id] = set()
        self.room_participants[room_id].add(user_id)
    
    def leave_room(self, user_id: str, room_id: str):
        """
        Xóa user khỏi room
        """
        if room_id in self.room_participants:
            self.room_participants[room_id].discard(user_id)
    
    def is_user_in_room(self, user_id: str, room_id: str) -> bool:
        """
        Kiểm tra user đã join room qua WebSocket chưa
        """
        return room_id in self.room_participants and user_id in self.room_participants[room_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        """
        Gửi message đến 1 user cụ thể
        """
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
            except Exception as e:
                print(f"Error sending message to {user_id}: {e}")
    
    async def broadcast_to_room(self, message: dict, room_id: str, exclude_user: Optional[str] = None):
        """
        Broadcast message đến tất cả users trong room
        """
        if room_id not in self.room_participants:
            return
        
        for user_id in self.room_participants[room_id]:
            if exclude_user and user_id == exclude_user:
                continue
            await self.send_personal_message(message, user_id)
    
    async def broadcast_to_all(self, message: dict):
        """
        Broadcast message đến tất cả users đang online
        """
        for user_id in list(self.active_connections.keys()):
            await self.send_personal_message(message, user_id)
    
    def get_online_users(self) -> list:
        """
        Lấy danh sách user IDs đang online
        """
        return list(self.active_connections.keys())
    
    def is_online(self, user_id: str) -> bool:
        """
        Kiểm tra user có online không
        """
        return user_id in self.active_connections


# Khởi tạo singleton instance
ws_manager = WebSocketManager()
