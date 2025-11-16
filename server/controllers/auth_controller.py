from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
from models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from dao.user_dao import user_dao
from utils.security import security_utils


class AuthController:
    """
    Controller xử lý authentication (đăng ký, đăng nhập, đăng xuất)
    """
    
    def __init__(self):
        self.router = APIRouter(prefix="/api/auth", tags=["Authentication"])
        self._register_routes()
        # Lưu trữ token đã logout (trong thực tế nên dùng Redis)
        self.blacklisted_tokens = set()
    
    def _register_routes(self):
        """
        Đăng ký các routes
        """
        self.router.add_api_route("/register", self.register, methods=["POST"], response_model=TokenResponse)
        self.router.add_api_route("/login", self.login, methods=["POST"], response_model=TokenResponse)
        self.router.add_api_route("/logout", self.logout, methods=["POST"])
        self.router.add_api_route("/me", self.get_current_user, methods=["GET"], response_model=UserResponse)
    
    async def register(self, user_data: UserCreate) -> TokenResponse:
        """
        Đăng ký user mới
        """
        # Kiểm tra username đã tồn tại
        existing_user = user_dao.get_by_username(user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Tạo user mới
        new_user = user_dao.create(user_data)
        if not new_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        # Tạo access token
        access_token = security_utils.create_access_token(
            data={"sub": new_user.username, "id": new_user.id}
        )
        
        # Trả về response
        user_response = UserResponse(
            id=new_user.id,
            username=new_user.username,
            phone=new_user.phone,
            avt_url=new_user.avt_url
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    
    async def login(self, login_data: UserLogin) -> TokenResponse:
        """
        Đăng nhập
        """
        # Xác thực user
        user = user_dao.authenticate(login_data.username, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        # Tạo access token
        access_token = security_utils.create_access_token(
            data={"sub": user.username, "id": user.id}
        )
        
        # Trả về response
        user_response = UserResponse(
            id=user.id,
            username=user.username,
            phone=user.phone,
            avt_url=user.avt_url
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
    
    async def logout(self, authorization: Optional[str] = Header(None)):
        """
        Đăng xuất
        """
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header"
            )
        
        token = authorization.replace("Bearer ", "")
        
        # Thêm token vào blacklist
        self.blacklisted_tokens.add(token)
        
        return {"message": "Logout successful"}
    
    async def get_current_user(self, authorization: Optional[str] = Header(None)) -> UserResponse:
        """
        Lấy thông tin user hiện tại từ token
        """
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header"
            )
        
        token = authorization.replace("Bearer ", "")
        
        # Kiểm tra token có trong blacklist không
        if token in self.blacklisted_tokens:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked"
            )
        
        # Verify token
        payload = security_utils.verify_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Lấy user từ database
        username = payload.get("sub")
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        user = user_dao.get_by_username(username)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserResponse(
            id=user.id,
            username=user.username,
            phone=user.phone,
            avt_url=user.avt_url
        )


# Khởi tạo controller
auth_controller = AuthController()
