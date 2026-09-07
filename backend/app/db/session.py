import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database connection URL (defaults to SQLite for local development & instant testing)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./malware_system.db")

# Create SQLAlchemy engine with sqlite check_same_thread compatibility
connect_args = {"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency generator that provides a transactional database session per HTTP request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
