import uuid
from typing import Optional, List
from models.user import User, UserCreate
from config.database import db
from utils.security import security_utils


class UserDAO:
    """
    Data Access Object cho User - xử lý tất cả các thao tác CRUD với database
    """
    
    def __init__(self):
        self.table_name = "Users"
    
    def create(self, user_data: UserCreate) -> Optional[User]:
        """
        Tạo user mới
        """
        try:
            user_id = str(uuid.uuid4())
            hashed_password = security_utils.hash_password(user_data.password)
            
            query = f"""
            INSERT INTO {self.table_name} (id, username, password, phone, avt_url)
            VALUES (%s, %s, %s, %s, %s)
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (
                    user_id,
                    user_data.username,
                    hashed_password,
                    user_data.phone,
                    user_data.avt_url
                ))
                
                return self.get_by_id(user_id)
        except Exception as e:
            print(f"Error creating user: {e}")
            return None
    
    def get_by_id(self, user_id: str) -> Optional[User]:
        """
        Lấy user theo ID
        """
        try:
            query = f"SELECT * FROM {self.table_name} WHERE id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (user_id,))
                result = cursor.fetchone()
                
                if result:
                    return User(**result)
                return None
        except Exception as e:
            print(f"Error getting user by id: {e}")
            return None
    
    def get_by_username(self, username: str) -> Optional[User]:
        """
        Lấy user theo username
        """
        try:
            query = f"SELECT * FROM {self.table_name} WHERE username = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (username,))
                result = cursor.fetchone()
                
                if result:
                    return User(**result)
                return None
        except Exception as e:
            print(f"Error getting user by username: {e}")
            return None
    
    def get_all(self) -> List[User]:
        """
        Lấy tất cả users
        """
        try:
            query = f"SELECT * FROM {self.table_name}"
            
            with db.get_cursor() as cursor:
                cursor.execute(query)
                results = cursor.fetchall()
                
                return [User(**row) for row in results]
        except Exception as e:
            print(f"Error getting all users: {e}")
            return []
    
    def update(self, user_id: str, user_data: dict) -> Optional[User]:
        """
        Cập nhật thông tin user
        """
        try:
            # Chỉ update các field được truyền vào
            update_fields = []
            values = []
            
            for key, value in user_data.items():
                if key != 'id' and value is not None:
                    if key == 'password':
                        value = security_utils.hash_password(value)
                    update_fields.append(f"{key} = %s")
                    values.append(value)
            
            if not update_fields:
                return self.get_by_id(user_id)
            
            values.append(user_id)
            query = f"UPDATE {self.table_name} SET {', '.join(update_fields)} WHERE id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, tuple(values))
                
                return self.get_by_id(user_id)
        except Exception as e:
            print(f"Error updating user: {e}")
            return None
    
    def delete(self, user_id: str) -> bool:
        """
        Xóa user
        """
        try:
            query = f"DELETE FROM {self.table_name} WHERE id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (user_id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error deleting user: {e}")
            return False
    
    def authenticate(self, username: str, password: str) -> Optional[User]:
        """
        Xác thực user
        """
        user = self.get_by_username(username)
        
        if user and security_utils.verify_password(password, user.password):
            return user
        
        return None


# Khởi tạo instance DAO
user_dao = UserDAO()
