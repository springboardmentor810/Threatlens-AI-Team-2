from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.roles import UserRole
from app.database.session import get_db
from app.middleware.auth_middleware import require_roles
from app.models.user import User
from app.schemas.user import UserResponse


router = APIRouter(
    prefix="/admin",
    tags=["Administration"]
)


@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="List all users",
    description="Returns all registered users. Admin access required."
)
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):
    """
    Returns all registered users.

    Only administrators are allowed to access this endpoint.
    """

    return db.query(User).order_by(User.created_at.desc()).all()