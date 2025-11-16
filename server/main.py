from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from controllers.auth_controller import auth_controller
from config.database import db
from config.config import settings


# Tạo ứng dụng FastAPI
app = FastAPI(
    title="FastAPI Authentication API",
    description="API xác thực với kiến trúc OOP chuẩn",
    version="1.0.0"
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (client)
app.mount("/static", StaticFiles(directory="../client"), name="static")

# Đăng ký routes
app.include_router(auth_controller.router)


@app.on_event("startup")
async def startup_event():
    """
    Khởi tạo database khi start ứng dụng
    """
    db.create_tables()
    print("✓ Database tables created successfully")


@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "FastAPI Authentication API",
        "docs": "/docs",
        "client": "/static/login.html"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
