import uuid
from typing import Optional, List
from datetime import datetime
from models.chat_participant import ChatParticipant, ChatParticipantCreate
from config.database import db


class ChatParticipantDAO:
    """
    Data Access Object cho ChatParticipant
    """
    
    def __init__(self):
        self.table_name = "ChatParticipants"
    
    def create(self, participant_data: ChatParticipantCreate) -> Optional[ChatParticipant]:
        """
        Thêm participant vào chat room
        """
        try:
            participant_id = str(uuid.uuid4())
            join_at = datetime.now()
            
            query = f"""
            INSERT INTO {self.table_name} (id, join_at, user_id, chat_room_id)
            VALUES (%s, %s, %s, %s)
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (
                    participant_id,
                    join_at,
                    participant_data.user_id,
                    participant_data.chat_room_id
                ))
                
                return self.get_by_id(participant_id)
        except Exception as e:
            print(f"Error creating participant: {e}")
            return None
    
    def get_by_id(self, participant_id: str) -> Optional[ChatParticipant]:
        """
        Lấy participant theo ID
        """
        try:
            query = f"SELECT * FROM {self.table_name} WHERE id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (participant_id,))
                result = cursor.fetchone()
                
                if result:
                    return ChatParticipant(**result)
                return None
        except Exception as e:
            print(f"Error getting participant by id: {e}")
            return None
    
    def get_by_room(self, room_id: str) -> List[ChatParticipant]:
        """
        Lấy tất cả participants trong room
        """
        try:
            query = f"SELECT * FROM {self.table_name} WHERE chat_room_id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (room_id,))
                results = cursor.fetchall()
                
                return [ChatParticipant(**row) for row in results]
        except Exception as e:
            print(f"Error getting participants by room: {e}")
            return []
    
    def get_user_ids_in_room(self, room_id: str) -> List[str]:
        """
        Lấy danh sách user IDs trong room
        """
        try:
            query = f"SELECT user_id FROM {self.table_name} WHERE chat_room_id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (room_id,))
                results = cursor.fetchall()
                
                return [row['user_id'] for row in results]
        except Exception as e:
            print(f"Error getting user ids in room: {e}")
            return []
    
    def delete(self, user_id: str, room_id: str) -> bool:
        """
        Xóa participant khỏi room
        """
        try:
            query = f"DELETE FROM {self.table_name} WHERE user_id = %s AND chat_room_id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (user_id, room_id))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error deleting participant: {e}")
            return False


# Khởi tạo instance
chat_participant_dao = ChatParticipantDAO()
