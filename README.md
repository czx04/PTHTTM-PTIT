--

1. Chuẩn bị MySQL (Docker):

   - Vào thư mục `MySQL/` và khởi động docker-compose:

     ```bash
     cd MySQL
     docker-compose up -d
     ```

   - Kiểm tra container và logs nếu cần.

2. Server Python:

   - Tạo virtual environment và cài dependencies (nếu có `requirements.txt`):

     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt  # nếu file tồn tại
     ```

   - Chạy server:

     ```bash
     python3 SERVER/main.py
     ```

   - Nếu project dùng Uvicorn/ASGI, thay bằng `uvicorn main:app --reload` tùy cấu hình.

3. Client (front-end):

   - Mở `CLIENT/index.html` bằng trình duyệt hoặc serve tĩnh:

     ```bash
     # Tùy chọn: server nhanh bằng Python
     cd CLIENT
     python3 -m http.server 8000
     # rồi mở http://localhost:8000
     ```

4. WebSocket và JWT:

   - WebSocket server nằm ở `WS/ws.py` (chạy cùng server nếu cần).
   - Các cấu hình JWT nằm ở `SERVER/utils/JWT.py` — đảm bảo đặt biến môi trường hoặc file cấu hình phù hợp.

5. Lưu ý môi trường:

   - Tạo file `.env` hoặc export biến môi trường cho DB credentials, SECRET_KEY, v.v.
   - Nếu cần import dữ liệu init, xem `MySQL/init/01-init.sql`.

6. Gỡ lỗi:

   - Kiểm tra `__pycache__`/logs và container logs: `docker-compose logs -f`.

--
Nếu bạn muốn, mình có thể thêm file `requirements.txt`, script khởi động (Makefile) hoặc hướng dẫn cấu hình `.env` chi tiết.
