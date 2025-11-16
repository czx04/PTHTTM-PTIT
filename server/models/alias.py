from pydantic import BaseModel, Field
from typing import Optional


class Alias(BaseModel):
    """
    Model Alias - đại diện cho biệt danh giữa các user
    """
    id: str
    user_set: str  # User đặt biệt danh
    user_get: str  # User được đặt biệt danh
    alias_name: str = Field(..., max_length=50)
    
    class Config:
        from_attributes = True


class AliasCreate(BaseModel):
    """
    Model để tạo alias mới
    """
    user_set: str
    user_get: str
    alias_name: str = Field(..., min_length=1, max_length=50)


class AliasResponse(BaseModel):
    """
    Model response trả về cho client
    """
    id: str
    user_set: str
    user_get: str
    alias_name: str
    user_get_username: Optional[str] = None  # Username gốc của user được đặt biệt danh
    
    class Config:
        from_attributes = True
