from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ChatRoom(BaseModel):
    """
    Model ChatRoom - đại diện cho phòng chat trong database
    """
    id: str
    name: str = Field(..., max_length=50)
    type: str = Field(..., max_length=50)  # 'group', 'direct', etc.
    create_at: datetime
    admin_id: str
    
    class Config:
        from_attributes = True


class ChatRoomCreate(BaseModel):
    """
    Model để tạo chat room mới
    """
    name: str = Field(..., min_length=1, max_length=50)
    type: str = Field(..., max_length=50)
    admin_id: str
    participant_ids: Optional[List[str]] = None  # Danh sách user IDs tham gia (cho direct chat)


class ChatRoomResponse(BaseModel):
    """
    Model response trả về cho client
    """
    id: str
    name: str
    type: str
    create_at: datetime
    admin_id: str
    participant_count: Optional[int] = None
    
    class Config:
        from_attributes = True
