from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Message(BaseModel):
    """
    Model Message - đại diện cho tin nhắn trong database
    """
    id: str
    content: str = Field(..., max_length=255)
    sent_at: datetime
    sender_id: str
    chat_room_id: str
    message_type: str = Field(..., max_length=50)  # 'text', 'image', 'file', etc.
    
    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    """
    Model để tạo message mới
    """
    content: str = Field(..., min_length=1, max_length=255)
    sender_id: str
    chat_room_id: str
    message_type: str = Field(default="text", max_length=50)


class MessageResponse(BaseModel):
    """
    Model response trả về cho client
    """
    id: str
    content: str
    sent_at: datetime
    sender_id: str
    sender_username: Optional[str] = None
    chat_room_id: str
    message_type: str
    
    class Config:
        from_attributes = True
