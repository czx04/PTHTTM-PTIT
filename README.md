-- Chạy trên Linux/MacOS
-- Win hơi khác tí :v

1. Chuẩn bị MySQL

2. Server Python:

   - Tạo virtual environment và cài dependencies (`requirements.txt`):

     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     ```

   - Chạy server:

     ```bash
     python3 SERVER/main.py
     ```

3. Client (front-end):

   - Mở `CLIENT/index.html` bằng trình duyệt hoặc serve tĩnh:

     ```bash
     # Tùy chọn: server nhanh bằng Python
     cd CLIENT
     python3 -m http.server 8000
     # rồi mở http://localhost:8000
     ```
