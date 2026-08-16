from typing import Optional
from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Retrieves a single user record from the database by email address."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Retrieves a single user record from the database by username."""
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Retrieves a single user record from the database by user ID."""
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, user_in: UserCreate) -> User:
    """Registers a new user and enforces the default 'analyst' server-side role."""
    if get_user_by_email(db, user_in.email):
        raise ValueError("An account with this email address already exists.")
        
    if get_user_by_username(db, user_in.username):
        raise ValueError("This username is already taken.")
        
    hashed_pwd = hash_password(user_in.password)
    
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role="analyst"  # Server-enforced default role; clients cannot choose their own role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticates user credentials against stored bcrypt password hashes."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_user_profile(db: Session, user: User, user_in: UserUpdate) -> User:
    """Updates user profile information (full_name and email only). Role changes are prohibited."""
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.email is not None and user_in.email != user.email:
        if get_user_by_email(db, user_in.email):
            raise ValueError("An account with this email address already exists.")
        user.email = user_in.email
        
    db.commit()
    db.refresh(user)
    return user
