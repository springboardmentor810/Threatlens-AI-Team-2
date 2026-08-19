from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.core.security import create_access_token
from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    description="Registers a new analyst user account with salted bcrypt password hashing. Role is automatically assigned as 'analyst'."
)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """Registers a new user and persists account to the database with default analyst role."""
    try:
        user = auth_service.register_user(db=db, user_in=user_in)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate user and issue JWT access token",
    description="Validates user credentials and returns a signed JWT bearer access token."
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = auth_service.authenticate_user(
        db=db,
        email=login_data.email,
        password=login_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is currently inactive. Please contact an administrator."
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
@router.get(
    "/profile",
    response_model=UserResponse,
    summary="Get active user profile",
    description="Returns profile metadata for the currently authenticated user."
)
def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Protected endpoint returning the profile of the current token holder."""
    return current_user


@router.put(
    "/profile",
    response_model=UserResponse,
    summary="Update active user profile",
    description="Updates full_name and email metadata for the currently authenticated user."
)
def update_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Protected endpoint updating full_name and email of the current token holder."""
    try:
        updated_user = auth_service.update_user_profile(
            db=db,
            user=current_user,
            user_in=user_in
        )
        return updated_user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post(
    "/token",
    response_model=Token,
    include_in_schema=False
)
def token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth_service.authenticate_user(
        db=db,
        email=form_data.username,
        password=form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
