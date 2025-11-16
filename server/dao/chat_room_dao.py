import uuid
from typing import Optional, List
from datetime import datetime
from models.chat_room import ChatRoom, ChatRoomCreate
from config.database import db


class ChatRoomDAO:
    """
    Data Access Object cho ChatRoom - xử lý các thao tác CRUD với database
    """
    
    def __init__(self):
        self.table_name = "ChatRoom"
    
    def create(self, room_data: ChatRoomCreate) -> Optional[ChatRoom]:
        """
        Tạo chat room mới
        """
        try:
            room_id = str(uuid.uuid4())
            create_at = datetime.now()
            
            query = f"""
            INSERT INTO {self.table_name} (id, name, type, create_at, admin_id)
            VALUES (%s, %s, %s, %s, %s)
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (
                    room_id,
                    room_data.name,
                    room_data.type,
                    create_at,
                    room_data.admin_id
                ))
                
                # Trả về object mới tạo (không gọi get_by_id vì cursor chưa commit)
                return ChatRoom(
                    id=room_id,
                    name=room_data.name,
                    type=room_data.type,
                    create_at=create_at,
                    admin_id=room_data.admin_id
                )
        except Exception as e:
            print(f"Error creating chat room: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_by_id(self, room_id: str) -> Optional[ChatRoom]:
        """
        Lấy chat room theo ID
        """
        try:
            query = f"SELECT * FROM {self.table_name} WHERE id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (room_id,))
                result = cursor.fetchone()
                
                if result:
                    return ChatRoom(**result)
                return None
        except Exception as e:
            print(f"Error getting chat room by id: {e}")
            return None
    
    def get_rooms_by_user(self, user_id: str) -> List[ChatRoom]:
        """
        Lấy tất cả chat rooms mà user tham gia
        """
        try:
            query = f"""
            SELECT cr.* FROM {self.table_name} cr
            INNER JOIN ChatParticipants cp ON cr.id = cp.chat_room_id
            WHERE cp.user_id = %s
            ORDER BY cr.create_at DESC
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (user_id,))
                results = cursor.fetchall()
                
                return [ChatRoom(**row) for row in results]
        except Exception as e:
            print(f"Error getting rooms by user: {e}")
            return []
    
    def get_direct_room(self, user_id1: str, user_id2: str) -> Optional[ChatRoom]:
        """
        Tìm direct room giữa 2 users (nếu đã tồn tại)
        """
        try:
            query = f"""
            SELECT cr.* FROM {self.table_name} cr
            WHERE cr.type = 'direct'
            AND cr.id IN (
                SELECT cp1.chat_room_id FROM ChatParticipants cp1
                WHERE cp1.user_id = %s
                AND cp1.chat_room_id IN (
                    SELECT cp2.chat_room_id FROM ChatParticipants cp2
                    WHERE cp2.user_id = %s
                )
            )
            LIMIT 1
            """
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (user_id1, user_id2))
                result = cursor.fetchone()
                
                if result:
                    return ChatRoom(**result)
                return None
        except Exception as e:
            print(f"Error getting direct room: {e}")
            return None
    
    def delete(self, room_id: str) -> bool:
        """
        Xóa chat room
        """
        try:
            query = f"DELETE FROM {self.table_name} WHERE id = %s"
            
            with db.get_cursor() as cursor:
                cursor.execute(query, (room_id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error deleting chat room: {e}")
            return False


# Khởi tạo instance
chat_room_dao = ChatRoomDAO()
