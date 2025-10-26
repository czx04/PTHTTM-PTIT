from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker, declarative_base

MYSQL_USER = "root"
MYSQL_PASSWORD = "123456"
MYSQL_HOST = "localhost"
MYSQL_DB = "pthttm"
MYSQL_PORT = 3320

SQLALCHEMY_DATABASE_URL = (
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Import models so they are registered on SQLAlchemy's metadata before create_all runs.
# Without importing the modules that define the models, Base.metadata may be empty
# and create_all won't create the tables.
try:
    # Import here to avoid circular import issues when models import Base from this module.
    # The import registers the model classes with Base.metadata.
    from models import user  # noqa: F401
except Exception:
    # If import fails at module import time (for example in some tooling),
    # we still want the file to load; creation can be triggered elsewhere.
    user = None

# Tạo bảng từ các model (CREATE IF NOT EXISTS behaviour)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()