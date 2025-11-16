from pydantic import BaseModel, Field
from typing import Optional


class User(BaseModel):
    """
    Model User - đại diện cho thực thể User trong database
    """
    id: str
    username: str
    password: str
    phone: Optional[str] = None
    avt_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """
    Model để tạo user mới (request body)
    """
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    phone: Optional[str] = Field(None, max_length=250)
    avt_url: Optional[str] = Field(None, max_length=255)


class UserLogin(BaseModel):
    """
    Model để đăng nhập
    """
    username: str
    password: str


class UserResponse(BaseModel):
    """
    Model response trả về cho client (không bao gồm password)
    """
    id: str
    username: str
    phone: Optional[str] = None
    avt_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """
    Model response cho token
    """
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
