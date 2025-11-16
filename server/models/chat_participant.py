from pydantic import BaseModel
from datetime import datetime


class ChatParticipant(BaseModel):
    """
    Model ChatParticipant - đại diện cho người tham gia phòng chat
    """
    id: str
    join_at: datetime
    user_id: str
    chat_room_id: str
    
    class Config:
        from_attributes = True


class ChatParticipantCreate(BaseModel):
    """
    Model để thêm participant vào chat room
    """
    user_id: str
    chat_room_id: str


class ChatParticipantResponse(BaseModel):
    """
    Model response trả về cho client
    """
    id: str
    join_at: datetime
    user_id: str
    chat_room_id: str
    username: str = None  # Thông tin user join
    
    class Config:
        from_attributes = True
