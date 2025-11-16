import uuid
from typing import Optional, List
from datetime import datetime
from models.message import Message, MessageCreate
from config.database import db


class MessageDAO:
    """
    Data Access Object cho Message
    """
    
    def __init__(self):
        self.table_name = "Messages"
    
    def create(self, message_data: MessageCreate) -> Optional[Message]:
        """
        Tạo message mới
        """
        try:
            message_id = str(uuid.uuid4())
            sent_at = datetime.now()
            
            query = f"""
            INSERT INTO {self.table_name} (id, content, sent_at, sender_id, chat_room_id, message_type)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (
                    message_id,
                    message_data.content,
                    sent_at,
                    message_data.sender_id,
                    message_data.chat_room_id,
                    message_data.message_type
                ))
                
                return self.get_by_id(message_id)
        except Exception as e:
            print(f"Error creating message: {e}")
            return None
    
    def get_by_id(self, message_id: str) -> Optional[Message]:
        """
        Lấy message theo ID
        """
        try:
            query = f"SELECT * FROM {self.table_name} WHERE id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (message_id,))
                result = cursor.fetchone()
                
                if result:
                    return Message(**result)
                return None
        except Exception as e:
            print(f"Error getting message by id: {e}")
            return None
    
    def get_by_room(self, room_id: str, limit: int = 50) -> List[Message]:
        """
        Lấy messages trong room (mặc định 50 tin gần nhất)
        """
        try:
            query = f"""
            SELECT * FROM {self.table_name} 
            WHERE chat_room_id = %s 
            ORDER BY sent_at DESC 
            LIMIT %s
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (room_id, limit))
                results = cursor.fetchall()
                
                # Reverse để hiển thị theo thứ tự cũ -> mới
                return [Message(**row) for row in reversed(results)]
        except Exception as e:
            print(f"Error getting messages by room: {e}")
            return []
    
    def delete(self, message_id: str) -> bool:
        """
        Xóa message
        """
        try:
            query = f"DELETE FROM {self.table_name} WHERE id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (message_id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error deleting message: {e}")
            return False


# Khởi tạo instance
message_dao = MessageDAO()
