# FastAPI Authentication Project

Dự án xác thực người dùng với FastAPI (backend) và HTML/CSS/JS (frontend) theo kiến trúc OOP chuẩn.

## Cấu trúc dự án

```
code3/
├── server/                 # Backend (FastAPI)
│   ├── config/            # Cấu hình
│   │   ├── config.py      # Settings
│   │   └── database.py    # Database connection
│   ├── models/            # Models (Pydantic)
│   │   └── user.py        # User model
│   ├── dao/               # Data Access Objects
│   │   └── user_dao.py    # User DAO
│   ├── controllers/       # Controllers
│   │   └── auth_controller.py  # Auth controller
│   ├── utils/             # Utilities
│   │   └── security.py    # Security utils (JWT, hashing)
│   ├── main.py            # Entry point
│   └── requirements.txt   # Dependencies
│
└── client/                # Frontend (HTML/CSS/JS)
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── config.js
    │   ├── services/
    │   │   ├── AuthService.js
    │   │   ├── UserService.js
    │   │   └── UIManager.js
    │   └── pages/
    │       ├── login.js
    │       ├── register.js
    │       └── dashboard.js
    ├── login.html
    ├── register.html
    └── dashboard.html
```

## Tính năng

- ✅ Đăng ký tài khoản
- ✅ Đăng nhập
- ✅ Đăng xuất
- ✅ Xem thông tin người dùng
- ✅ JWT Authentication
- ✅ Mã hóa mật khẩu (bcrypt)
- ✅ Kiến trúc OOP chuẩn (cả backend và frontend)

## Công nghệ sử dụng

### Backend

- FastAPI
- PyMySQL
- Pydantic
- python-jose (JWT)
- passlib (bcrypt)

### Frontend

- HTML5
- CSS3
- JavaScript (ES6+) - OOP
- Fetch API

## Cài đặt

### 1. Cài đặt dependencies cho server

```bash
cd server
pip install -r requirements.txt
```

### 2. Cấu hình database

Tạo database MySQL:

```sql
CREATE DATABASE fastapi_auth;
```

Copy file `.env.example` thành `.env` và cập nhật thông tin:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fastapi_auth

SECRET_KEY=your-secret-key-here
```

### 3. Chạy server

```bash
cd server
python main.py
```

Server sẽ chạy tại: `http://localhost:8000`

### 4. Truy cập ứng dụng

- Login: `http://localhost:8000/static/login.html`
- Register: `http://localhost:8000/static/register.html`
- API Docs: `http://localhost:8000/docs`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại

## Database Schema

```sql
CREATE TABLE Users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(250),
    avt_url VARCHAR(255)
);
```

## Kiến trúc

### Backend (FastAPI)

**4 lớp OOP:**

1. **Models** (`models/user.py`)

   - Định nghĩa cấu trúc dữ liệu
   - Validation với Pydantic

2. **DAO** (`dao/user_dao.py`)

   - Data Access Object
   - Xử lý CRUD với database
   - Tương tác trực tiếp với MySQL

3. **Controller** (`controllers/auth_controller.py`)

   - Business logic
   - Xử lý request/response
   - Route handlers

4. **Utils** (`utils/security.py`)
   - JWT token generation/validation
   - Password hashing/verification

### Frontend (JavaScript OOP)

**3 classes chính:**

1. **AuthService** (`js/services/AuthService.js`)

   - Quản lý authentication
   - Gọi API login/register/logout
   - Quản lý token trong localStorage

2. **UserService** (`js/services/UserService.js`)

   - Quản lý thông tin user
   - Format dữ liệu để hiển thị

3. **UIManager** (`js/services/UIManager.js`)
   - Quản lý giao diện
   - Hiển thị thông báo
   - Xử lý form và DOM

## Bảo mật

- Mật khẩu được hash bằng bcrypt
- JWT token cho authentication
- CORS được cấu hình
- Token được lưu trong localStorage
- Blacklist token khi logout

## Hướng dẫn sử dụng

1. Truy cập trang đăng ký
2. Nhập thông tin: username, password (bắt buộc), phone, avatar URL (tùy chọn)
3. Sau khi đăng ký thành công, tự động chuyển đến dashboard
4. Có thể đăng xuất và đăng nhập lại
5. Xem thông tin tài khoản tại dashboard

## License

MIT
