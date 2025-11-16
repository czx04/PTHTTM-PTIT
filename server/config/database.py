import pymysql
from pymysql.cursors import DictCursor
from contextlib import contextmanager
from typing import Generator
from .config import settings


class Database:
    """
    Class quản lý kết nối database (Singleton pattern)
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.config = {
            'host': settings.DB_HOST,
            'port': settings.DB_PORT,
            'user': settings.DB_USER,
            'password': settings.DB_PASSWORD,
            'database': settings.DB_NAME,
            'cursorclass': DictCursor,
            'autocommit': False
        }
    
    def get_connection(self):
        """
        Tạo kết nối mới đến database
        """
        return pymysql.connect(**self.config)
    
    @contextmanager
    def get_cursor(self) -> Generator:
        """
        Context manager để quản lý cursor
        """
        connection = self.get_connection()
        cursor = connection.cursor()
        try:
            yield cursor
            connection.commit()
        except Exception as e:
            connection.rollback()
            raise e
        finally:
            cursor.close()
            connection.close()
    
    def create_tables(self):
        """
        Tạo tất cả các bảng cần thiết
        """
        # Bảng Users
        create_users_table = """
        CREATE TABLE IF NOT EXISTS Users (
            id VARCHAR(50) PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(250),
            avt_url VARCHAR(255)
        )
        """
        
        # Bảng ChatRoom
        create_chatroom_table = """
        CREATE TABLE IF NOT EXISTS ChatRoom (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            type VARCHAR(50) NOT NULL,
            create_at TIMESTAMP NOT NULL,
            admin_id VARCHAR(50) NOT NULL,
            FOREIGN KEY (admin_id) REFERENCES Users(id)
        )
        """
        
        # Bảng ChatParticipants
        create_participants_table = """
        CREATE TABLE IF NOT EXISTS ChatParticipants (
            id VARCHAR(50) PRIMARY KEY,
            join_at TIMESTAMP NOT NULL,
            user_id VARCHAR(50) NOT NULL,
            chat_room_id VARCHAR(50) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users(id),
            FOREIGN KEY (chat_room_id) REFERENCES ChatRoom(id)
        )
        """
        
        # Bảng Messages
        create_messages_table = """
        CREATE TABLE IF NOT EXISTS Messages (
            id VARCHAR(50) PRIMARY KEY,
            content VARCHAR(255) NOT NULL,
            sent_at TIMESTAMP NOT NULL,
            sender_id VARCHAR(50) NOT NULL,
            chat_room_id VARCHAR(50) NOT NULL,
            message_type VARCHAR(50) NOT NULL,
            FOREIGN KEY (sender_id) REFERENCES Users(id),
            FOREIGN KEY (chat_room_id) REFERENCES ChatRoom(id)
        )
        """
        
        # Bảng alias
        create_alias_table = """
        CREATE TABLE IF NOT EXISTS alias (
            id VARCHAR(50) PRIMARY KEY,
            user_set VARCHAR(50),
            user_get VARCHAR(50),
            alias_name VARCHAR(50),
            FOREIGN KEY (user_set) REFERENCES Users(id),
            FOREIGN KEY (user_get) REFERENCES Users(id)
        )
        """
        
        with self.get_cursor() as cursor:
            cursor.execute(create_users_table)
            cursor.execute(create_chatroom_table)
            cursor.execute(create_participants_table)
            cursor.execute(create_messages_table)
            cursor.execute(create_alias_table)


# Khởi tạo instance database
db = Database()
