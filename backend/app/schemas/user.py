from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base Pydantic model for shared User attributes."""
    email: EmailStr = Field(..., description="User primary email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    full_name: Optional[str] = Field(None, max_length=100, description="User's full name")
    role: str = Field(default="analyst", description="User authorization role (e.g., analyst, admin)")


class UserCreate(UserBase):
    """Schema for user registration request payload."""
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Plaintext password, must be at least 8 characters long"
    )


class UserUpdate(BaseModel):
    """Schema for updating user profile information."""
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user responses returned by the API (omits sensitive password hashes)."""
    id: UUID = Field(..., description="Unique user identifier")
    is_active: bool = Field(default=True, description="Account active status")
    created_at: datetime = Field(..., description="Timestamp when account was created")

    model_config = ConfigDict(from_attributes=True)
