from fastapi import WebSocket, WebSocketDisconnect, Query
from typing import Optional
import json
from utils.websocket_manager import ws_manager
from utils.security import security_utils
from dao.message_dao import message_dao
from dao.chat_participant_dao import chat_participant_dao
from dao.alias_dao import alias_dao
from dao.user_dao import user_dao
from models.message import MessageCreate


class WebSocketController:
    """
    Controller xử lý WebSocket connections và real-time chat
    """
    
    def __init__(self):
        pass
    
    async def websocket_endpoint(
        self,
        websocket: WebSocket,
        token: str = Query(...)
    ):
        """
        WebSocket endpoint cho chat real-time
        """
        # Verify token
        payload = security_utils.verify_token(token)
        if not payload:
            await websocket.close(code=1008)  # Policy violation
            return
        
        user_id = payload.get("id")
        if not user_id:
            await websocket.close(code=1008)
            return
        
        # Connect
        await ws_manager.connect(user_id, websocket)
        
        try:
            # Gửi thông báo kết nối thành công
            await ws_manager.send_personal_message({
                "type": "connected",
                "message": "Connected successfully"
            }, user_id)
            
            # Xử lý messages
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                await self._handle_message(user_id, message_data)
                
        except WebSocketDisconnect:
            ws_manager.disconnect(user_id)
        except Exception as e:
            print(f"WebSocket error for user {user_id}: {e}")
            ws_manager.disconnect(user_id)
    
    async def _handle_message(self, user_id: str, data: dict):
        """
        Xử lý message từ client
        """
        msg_type = data.get("type")
        
        if msg_type == "join_room":
            await self._handle_join_room(user_id, data)
        
        elif msg_type == "send_message":
            await self._handle_send_message(user_id, data)
        
        elif msg_type == "typing":
            await self._handle_typing(user_id, data)
        
        elif msg_type == "leave_room":
            await self._handle_leave_room(user_id, data)
    
    async def _handle_join_room(self, user_id: str, data: dict):
        """
        User join vào room
        """
        room_id = data.get("room_id")
        if not room_id:
            return
        
        # Kiểm tra user có trong room không
        participants = chat_participant_dao.get_user_ids_in_room(room_id)
        if user_id not in participants:
            await ws_manager.send_personal_message({
                "type": "error",
                "message": "You are not a participant of this room"
            }, user_id)
            return
        
        # Join room
        ws_manager.join_room(user_id, room_id)
        
        # Gửi xác nhận join thành công cho user
        await ws_manager.send_personal_message({
            "type": "room_joined",
            "room_id": room_id,
            "message": "Successfully joined room"
        }, user_id)
        
        # Thông báo cho user khác
        user = user_dao.get_by_id(user_id)
        await ws_manager.broadcast_to_room({
            "type": "user_joined",
            "user_id": user_id,
            "username": user.username if user else "Unknown"
        }, room_id, exclude_user=user_id)
    
    async def _handle_send_message(self, user_id: str, data: dict):
        """
        Gửi message
        """
        room_id = data.get("room_id")
        content = data.get("content")
        message_type = data.get("message_type", "text")
        
        if not room_id or not content:
            return
        
        # Kiểm tra user đã join room qua WebSocket chưa
        if not ws_manager.is_user_in_room(user_id, room_id):
            await ws_manager.send_personal_message({
                "type": "error",
                "message": "You must join the room before sending messages"
            }, user_id)
            return
        
        # Lưu message vào DB
        message_data = MessageCreate(
            content=content,
            sender_id=user_id,
            chat_room_id=room_id,
            message_type=message_type
        )
        
        new_message = message_dao.create(message_data)
        if not new_message:
            await ws_manager.send_personal_message({
                "type": "error",
                "message": "Failed to send message"
            }, user_id)
            return
        
        # Lấy danh sách participants trong room
        participants = chat_participant_dao.get_user_ids_in_room(room_id)
        
        # Broadcast message đến tất cả participants (với alias riêng cho mỗi người)
        for participant_id in participants:
            # Lấy alias của sender từ góc nhìn participant
            sender_alias = alias_dao.get_alias(participant_id, user_id)
            
            if not sender_alias:
                sender = user_dao.get_by_id(user_id)
                sender_alias = sender.username if sender else "Unknown"
            
            await ws_manager.send_personal_message({
                "type": "new_message",
                "message": {
                    "id": new_message.id,
                    "content": new_message.content,
                    "sent_at": new_message.sent_at.isoformat(),
                    "sender_id": new_message.sender_id,
                    "sender_username": sender_alias,
                    "chat_room_id": new_message.chat_room_id,
                    "message_type": new_message.message_type
                }
            }, participant_id)
    
    async def _handle_typing(self, user_id: str, data: dict):
        """
        Xử lý typing indicator
        """
        room_id = data.get("room_id")
        is_typing = data.get("is_typing", False)
        
        if not room_id:
            return
        
        user = user_dao.get_by_id(user_id)
        
        # Broadcast typing status đến room (trừ bản thân)
        await ws_manager.broadcast_to_room({
            "type": "typing",
            "user_id": user_id,
            "username": user.username if user else "Unknown",
            "is_typing": is_typing
        }, room_id, exclude_user=user_id)
    
    async def _handle_leave_room(self, user_id: str, data: dict):
        """
        User rời khỏi room
        """
        room_id = data.get("room_id")
        if not room_id:
            return
        
        ws_manager.leave_room(user_id, room_id)


# Khởi tạo controller
websocket_controller = WebSocketController()
