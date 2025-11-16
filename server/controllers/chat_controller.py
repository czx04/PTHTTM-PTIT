from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional, List
from models.chat_room import ChatRoomCreate, ChatRoomResponse
from models.chat_participant import ChatParticipantCreate
from models.message import MessageResponse
from models.alias import AliasCreate
from dao.chat_room_dao import chat_room_dao
from dao.chat_participant_dao import chat_participant_dao
from dao.message_dao import message_dao
from dao.alias_dao import alias_dao
from dao.user_dao import user_dao
from utils.security import security_utils
from utils.websocket_manager import ws_manager


class ChatController:
    """
    Controller xử lý chat operations (REST API)
    """
    
    def __init__(self):
        self.router = APIRouter(prefix="/api/chat", tags=["Chat"])
        self._register_routes()
    
    def _register_routes(self):
        """
        Đăng ký routes
        """
        self.router.add_api_route("/rooms", self.create_room, methods=["POST"])
        self.router.add_api_route("/rooms", self.get_my_rooms, methods=["GET"])
        self.router.add_api_route("/rooms/{room_id}/messages", self.get_room_messages, methods=["GET"])
        self.router.add_api_route("/alias", self.set_alias, methods=["POST"])
        self.router.add_api_route("/alias/{user_id}", self.get_alias, methods=["GET"])
        self.router.add_api_route("/users", self.get_all_users, methods=["GET"])
    
    def _verify_token(self, authorization: Optional[str]) -> str:
        """
        Xác thực token và trả về user_id
        """
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header"
            )
        
        token = authorization.replace("Bearer ", "")
        payload = security_utils.verify_token(token)
        
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        user_id = payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        return user_id
    
    async def create_room(
        self, 
        room_data: ChatRoomCreate,
        authorization: Optional[str] = Header(None)
    ) -> ChatRoomResponse:
        """
        Tạo chat room mới (direct hoặc group)
        """
        try:
            print(f"=== CREATE ROOM START ===")
            print(f"Room data: {room_data}")
            user_id = self._verify_token(authorization)
            print(f"User ID: {user_id}")
            
            # Tạo room
            print(f"Creating room in DAO...")
            new_room = chat_room_dao.create(room_data)
            print(f"New room created: {new_room}")
            if not new_room:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create room"
                )
            
            # Thêm admin vào room
            admin_participant = ChatParticipantCreate(
                user_id=room_data.admin_id,
                chat_room_id=new_room.id
            )
            chat_participant_dao.create(admin_participant)
            
            # Nếu là direct chat, tạo alias mặc định
            if room_data.type == "direct" and room_data.participant_ids and len(room_data.participant_ids) == 2:
                participant_ids = room_data.participant_ids
                user1_id, user2_id = participant_ids
                
                # Lấy usernames
                user1 = user_dao.get_by_id(user1_id)
                user2 = user_dao.get_by_id(user2_id)
                
                if user1 and user2:
                    # Tạo alias mặc định (tên của người kia)
                    alias_dao.create_or_update(user1_id, user2_id, user2.username)
                    alias_dao.create_or_update(user2_id, user1_id, user1.username)
                
                # Thêm user thứ 2 vào room
                participant2 = ChatParticipantCreate(
                    user_id=user2_id,
                    chat_room_id=new_room.id
                )
                chat_participant_dao.create(participant2)
            
            # Lấy danh sách participants để broadcast
            participant_count = 2 if room_data.type == "direct" else 1
            participants = chat_participant_dao.get_user_ids_in_room(new_room.id)
            
            # Broadcast room_created event đến tất cả participants
            room_response = ChatRoomResponse(
                id=new_room.id,
                name=new_room.name,
                type=new_room.type,
                create_at=new_room.create_at,
                admin_id=new_room.admin_id,
                participant_count=participant_count
            )
            
            for participant_id in participants:
                await ws_manager.send_personal_message({
                    "type": "room_created",
                    "room": {
                        "id": room_response.id,
                        "name": room_response.name,
                        "type": room_response.type,
                        "create_at": room_response.create_at.isoformat(),
                        "admin_id": room_response.admin_id,
                        "participant_count": room_response.participant_count
                    },
                    "creator_id": user_id
                }, participant_id)
            
            return room_response
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error creating room: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create room: {str(e)}"
            )
    
    async def get_my_rooms(
        self,
        authorization: Optional[str] = Header(None)
    ) -> List[ChatRoomResponse]:
        """
        Lấy danh sách rooms của user hiện tại
        """
        user_id = self._verify_token(authorization)
        
        rooms = chat_room_dao.get_rooms_by_user(user_id)
        
        result = []
        for room in rooms:
            # Đếm số participants
            participants = chat_participant_dao.get_by_room(room.id)
            
            result.append(ChatRoomResponse(
                id=room.id,
                name=room.name,
                type=room.type,
                create_at=room.create_at,
                admin_id=room.admin_id,
                participant_count=len(participants)
            ))
        
        return result
    
    async def get_room_messages(
        self,
        room_id: str,
        authorization: Optional[str] = Header(None)
    ) -> List[MessageResponse]:
        """
        Lấy messages trong room
        """
        user_id = self._verify_token(authorization)
        
        # Kiểm tra user có trong room không
        participants = chat_participant_dao.get_user_ids_in_room(room_id)
        if user_id not in participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant of this room"
            )
        
        messages = message_dao.get_by_room(room_id)
        
        result = []
        for msg in messages:
            # Lấy alias của sender (từ góc nhìn user hiện tại)
            sender_alias = alias_dao.get_alias(user_id, msg.sender_id)
            
            # Nếu không có alias, dùng username gốc
            if not sender_alias:
                sender = user_dao.get_by_id(msg.sender_id)
                sender_alias = sender.username if sender else "Unknown"
            
            result.append(MessageResponse(
                id=msg.id,
                content=msg.content,
                sent_at=msg.sent_at,
                sender_id=msg.sender_id,
                sender_username=sender_alias,
                chat_room_id=msg.chat_room_id,
                message_type=msg.message_type
            ))
        
        return result
    
    async def set_alias(
        self,
        alias_data: AliasCreate,
        authorization: Optional[str] = Header(None)
    ):
        """
        Đặt alias cho user khác
        """
        user_id = self._verify_token(authorization)
        
        # Verify user_set phải là current user
        if alias_data.user_set != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only set alias for yourself"
            )
        
        success = alias_dao.create_or_update(
            alias_data.user_set,
            alias_data.user_get,
            alias_data.alias_name
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to set alias"
            )
        
        return {"message": "Alias set successfully"}
    
    async def get_alias(
        self,
        user_id: str,
        authorization: Optional[str] = Header(None)
    ):
        """
        Lấy alias mà current user đặt cho user_id
        """
        current_user_id = self._verify_token(authorization)
        
        alias_name = alias_dao.get_alias(current_user_id, user_id)
        
        if not alias_name:
            # Trả về username gốc nếu không có alias
            user = user_dao.get_by_id(user_id)
            alias_name = user.username if user else "Unknown"
        
        return {"alias": alias_name}
    
    async def get_all_users(
        self,
        authorization: Optional[str] = Header(None)
    ):
        """
        Lấy danh sách tất cả users (để tạo chat)
        """
        user_id = self._verify_token(authorization)
        
        users = user_dao.get_all()
        
        return [
            {
                "id": user.id,
                "username": user.username
            }
            for user in users if user.id != user_id  # Không trả về chính mình
        ]


# Khởi tạo controller
chat_controller = ChatController()
