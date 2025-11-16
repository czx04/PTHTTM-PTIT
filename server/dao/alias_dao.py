import uuid
from typing import Optional
from models.alias import Alias, AliasCreate
from config.database import db


class AliasDAO:
    """
    Data Access Object cho Alias
    """
    
    def __init__(self):
        self.table_name = "alias"
    
    def create(self, alias_data: AliasCreate) -> Optional[Alias]:
        """
        Tạo alias mới
        """
        try:
            alias_id = str(uuid.uuid4())
            
            query = f"""
            INSERT INTO {self.table_name} (id, user_set, user_get, alias_name)
            VALUES (%s, %s, %s, %s)
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (
                    alias_id,
                    alias_data.user_set,
                    alias_data.user_get,
                    alias_data.alias_name
                ))
                
                return self.get_by_id(alias_id)
        except Exception as e:
            print(f"Error creating alias: {e}")
            return None
    
    def get_by_id(self, alias_id: str) -> Optional[Alias]:
        """
        Lấy alias theo ID
        """
        try:
            query = f"SELECT * FROM {self.table_name} WHERE id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (alias_id,))
                result = cursor.fetchone()
                
                if result:
                    return Alias(**result)
                return None
        except Exception as e:
            print(f"Error getting alias by id: {e}")
            return None
    
    def get_alias(self, user_set: str, user_get: str) -> Optional[str]:
        """
        Lấy alias name mà user_set đặt cho user_get
        """
        try:
            query = f"""
            SELECT alias_name FROM {self.table_name} 
            WHERE user_set = %s AND user_get = %s
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (user_set, user_get))
                result = cursor.fetchone()
                
                if result:
                    return result['alias_name']
                return None
        except Exception as e:
            print(f"Error getting alias: {e}")
            return None
    
    def update_alias(self, user_set: str, user_get: str, new_alias: str) -> bool:
        """
        Cập nhật alias
        """
        try:
            query = f"""
            UPDATE {self.table_name} 
            SET alias_name = %s 
            WHERE user_set = %s AND user_get = %s
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (new_alias, user_set, user_get))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating alias: {e}")
            return False
    
    def create_or_update(self, user_set: str, user_get: str, alias_name: str) -> bool:
        """
        Tạo mới hoặc cập nhật alias
        """
        existing = self.get_alias(user_set, user_get)
        
        if existing:
            return self.update_alias(user_set, user_get, alias_name)
        else:
            alias_data = AliasCreate(
                user_set=user_set,
                user_get=user_get,
                alias_name=alias_name
            )
            return self.create(alias_data) is not None


# Khởi tạo instance
alias_dao = AliasDAO()
