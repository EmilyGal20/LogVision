import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ---------------------------------------------------------
# DATABASE PATH (SQLite)
# ---------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "logs.db")

DATABASE_URL = f"sqlite:///{DB_PATH}"


# ---------------------------------------------------------
# ENGINE (SQLite requires check_same_thread=False)
# ---------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)


# ---------------------------------------------------------
# Session Factory
# ---------------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ---------------------------------------------------------
# Base Class for ORM Models
# ---------------------------------------------------------
Base = declarative_base()


# ---------------------------------------------------------
# get_db for FastAPI Dependency Injection
# ---------------------------------------------------------
def get_db():
    """
    FastAPI dependency. Provides a DB session and
    ensures it closes after the request ends.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------
# __all__ (Debugging / Explicit Exports)
# ---------------------------------------------------------
__all__ = ["engine", "SessionLocal", "Base", "get_db", "DB_PATH"]
