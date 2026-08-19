from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.core.roles import UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Retrieve a user by email address."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Retrieve a user by username."""
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    """Retrieve a user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, user_in: UserCreate) -> User:
    """
    Register a new user.

    The role is assigned by the backend and cannot be selected
    by the client during registration.
    """

    # Normalize email and username
    email = str(user_in.email).strip().lower()
    username = user_in.username.strip()

    # Check duplicate email
    if get_user_by_email(db, email):
        raise ValueError(
            "An account with this email address already exists."
        )

    # Check duplicate username
    if get_user_by_username(db, username):
        raise ValueError(
            "This username is already taken."
        )

    # Hash password before storing
    hashed_password = hash_password(user_in.password)

    # Create user
    db_user = User(
        email=email,
        username=username,
        hashed_password=hashed_password,
        full_name=user_in.full_name.strip()
        if user_in.full_name
        else None,

        # Role is controlled by the backend
        role=UserRole.ANALYST.value,

        is_active=True
    )

    db.add(db_user)

    try:
        db.commit()
        db.refresh(db_user)

    except Exception:
        db.rollback()
        raise

    return db_user


def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> Optional[User]:
    """Authenticate a user using email and password."""

    email = email.strip().lower()

    user = get_user_by_email(db, email)

    if not user:
        return None

    # Do not allow inactive accounts to log in
    if not user.is_active:
        return None

    # Verify the password against the stored bcrypt hash
    if not verify_password(
        password,
        user.hashed_password
    ):
        return None

    return user


def update_user_profile(
    db: Session,
    user: User,
    user_in: UserUpdate
) -> User:
    """
    Update user profile.

    Users can update their name and email.
    Role, username and password are not changed here.
    """

    if user_in.full_name is not None:
        user.full_name = user_in.full_name.strip()

    if user_in.email is not None:
        new_email = str(user_in.email).strip().lower()

        if new_email != user.email:

            existing_user = get_user_by_email(
                db,
                new_email
            )

            if existing_user:
                raise ValueError(
                    "An account with this email address already exists."
                )

            user.email = new_email

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return user