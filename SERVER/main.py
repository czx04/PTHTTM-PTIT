from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time

from utils.JWT import hash_password, verify_password, create_access_token, decode_access_token
from core.database import SessionLocal, get_db
from models.user import User
from WS.ws import ConnectionManager
from models.req import UserRegister, UserLogin

app = FastAPI()

FE_DOMAIN = "https://www.myproject.com"

LOCAL_FE = "http://localhost:3000"

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FE_DOMAIN, LOCAL_FE, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()


@app.post("/api/register")
async def register(user_data: UserRegister, db: SessionLocal = Depends(get_db)):  # ⬅️ Thay đổi ở đây

    # Dữ liệu được lấy từ user_data.username và user_data.password
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username đã tồn tại")

    hashed_password = hash_password(user_data.password)

    db_user = User(username=user_data.username, hashed_password=hashed_password, phone=user_data.phone)

    db.add(db_user)
    db.commit()
    return {"message": "Đăng ký thành công", "username": user_data.username}


@app.post("/api/login")
async def login_api(user_data: UserLogin, db: SessionLocal = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Sai username hoặc mật khẩu")

    access_token = create_access_token(data={"sub": user.username})

    return {"message": "Login successful", "username": user.username, "token": access_token}


# --- Endpoint WebSocket (Sử dụng Token để Xác thực) ---
@app.websocket("/ws/connect")
async def websocket_endpoint(websocket: WebSocket, token: str):
    username = decode_access_token(token)

    if username is None:
        await websocket.close(code=1008, reason="Unauthorized/Invalid token")
        return

    await manager.connect(websocket, username)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket, username)
        await manager.broadcast_user_list()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)