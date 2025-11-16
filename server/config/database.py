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
        Tạo bảng Users nếu chưa tồn tại
        """
        create_table_query = """
        CREATE TABLE IF NOT EXISTS Users (
            id VARCHAR(50) PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            phone VARCHAR(250),
            avt_url VARCHAR(255)
        )
        """
        with self.get_cursor() as cursor:
            cursor.execute(create_table_query)


# Khởi tạo instance database
db = Database()
