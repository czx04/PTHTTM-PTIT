from pydantic import BaseModel

class UserRegister(BaseModel):
    username: str
    password: str
    phone: str

class UserLogin(BaseModel):
    username: str
    password: str