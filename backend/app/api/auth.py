from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
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
    description="Registers a new analyst or user account with salted bcrypt password hashing."
)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    """Registers a new user and persists account to the database."""
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
    description="Validates user credentials and returns a signed JWT bearer access token. Supports both JSON payloads and Swagger UI Authorize form data."
)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    """Unified login endpoint supporting both JSON body (Frontend) and OAuth2 Form Data (Swagger Authorize button)."""
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("email")
            password = body.get("password")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid JSON body format."
            )
    else:
        # Handles application/x-www-form-urlencoded and multipart/form-data from Swagger UI Authorize button
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email and password are required fields."
        )

    user = auth_service.authenticate_user(
        db=db,
        email=str(email),
        password=str(password)
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
    description="Updates metadata for the currently authenticated user."
)
def update_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Protected endpoint updating the profile of the current token holder."""
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
