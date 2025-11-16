from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from controllers.auth_controller import auth_controller
from controllers.chat_controller import chat_controller
from controllers.websocket_controller import websocket_controller
from config.database import db
from config.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler
    """
    # Startup
    db.create_tables()
    print("✓ Database tables created successfully")
    yield
    # Shutdown
    print("✓ Application shutdown")


# Tạo ứng dụng FastAPI
app = FastAPI(
    title="FastAPI Chat API",
    description="API xác thực và chat với kiến trúc OOP chuẩn",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Đăng ký routes
app.include_router(auth_controller.router)
app.include_router(chat_controller.router)

# WebSocket route
@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, token: str):
    await websocket_controller.websocket_endpoint(websocket, token)

# Mount static files (client) - phải mount sau routes
app.mount("/static", StaticFiles(directory="../client"), name="static")


@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "FastAPI Chat API",
        "docs": "/docs",
        "client": "/static/index.html"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
