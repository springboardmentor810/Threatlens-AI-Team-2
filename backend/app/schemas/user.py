from datetime import datetime
from typing import Optional
from uuid import UUID
import re

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator
)


class UserBase(BaseModel):
    """Base Pydantic model for shared User attributes."""

    email: EmailStr = Field(
        ...,
        description="Valid email address such as Gmail, Yahoo, Outlook, etc."
    )

    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Unique username"
    )

    full_name: Optional[str] = Field(
        None,
        max_length=100,
        description="User's full name"
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Username cannot be empty.")

        if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_.]*", value):
            raise ValueError(
                "Username must start with a letter and contain only "
                "letters, numbers, underscores, or dots."
            )

        if value.endswith(".") or value.endswith("_"):
            raise ValueError(
                "Username cannot end with a dot or underscore."
            )

        return value


class UserCreate(UserBase):
    """Schema for user registration request payload."""

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description=(
            "Password must contain at least 8 characters, "
            "one uppercase letter, one lowercase letter, "
            "one number, and one special character."
        )
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:

        if any(char.isspace() for char in value):
            raise ValueError(
                "Password must not contain spaces."
            )

        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "Password must contain at least one uppercase letter."
            )

        if not re.search(r"[a-z]", value):
            raise ValueError(
                "Password must contain at least one lowercase letter."
            )

        if not re.search(r"\d", value):
            raise ValueError(
                "Password must contain at least one number."
            )

        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError(
                "Password must contain at least one special character."
            )

                # Reject very common weak passwords
        weak_passwords = {
            "Password@1",
            "Password123!",
            "Admin@123",
            "Admin@1234",
            "Welcome@123",
            "Qwerty@123",
            "Qwerty123!",
        }

        if value.lower() in {
            password.lower()
            for password in weak_passwords
        }:
            raise ValueError(
                "Password is too common. Please choose a stronger password."
            )

        # Require a reasonable mix of characters
        strength_score = 0

        if len(value) >= 12:
            strength_score += 1

        if re.search(r"[A-Z]", value):
            strength_score += 1

        if re.search(r"[a-z]", value):
            strength_score += 1

        if re.search(r"\d", value):
            strength_score += 1

        if re.search(r"[^A-Za-z0-9]", value):
            strength_score += 1

        if strength_score < 4:
            raise ValueError(
                "Password is too weak. Use at least 12 characters "
                "with uppercase, lowercase, numbers, and special characters."
            )

        return value


class UserUpdate(BaseModel):
    """Schema for updating user profile information."""

    full_name: Optional[str] = Field(
        None,
        max_length=100
    )

    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    """Schema for user responses returned by the API."""

    id: UUID = Field(
        ...,
        description="Unique user identifier"
    )

    role: str = Field(
        default="analyst",
        description="User authorization role assigned by server"
    )

    is_active: bool = Field(
        default=True,
        description="Account active status"
    )

    created_at: datetime = Field(
        ...,
        description="Timestamp when account was created"
    )

    model_config = ConfigDict(
        from_attributes=True
    )