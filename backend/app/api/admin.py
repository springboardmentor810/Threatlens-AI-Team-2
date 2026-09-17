from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.roles import UserRole
from app.database.session import get_db
from app.middleware.auth_middleware import require_roles
from app.models.user import User
from app.schemas.user import AdminRoleUpdate, UserResponse


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


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Change user role",
    description="Allows an administrator to change another user's role."
)
def update_user_role(
    user_id: str,
    role_data: AdminRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    )
):
    """
    Change the authorization role of a user.

    Only administrators can perform this action.
    An administrator cannot change their own role.
    """

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own administrator role."
        )

    user.role = role_data.role

    db.commit()
    db.refresh(user)

    return user