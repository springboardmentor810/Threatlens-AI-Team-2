from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    """Schema for user login authentication request payload."""
    email: EmailStr = Field(..., description="Registered user email address")
    password: str = Field(..., description="User password")


class Token(BaseModel):
    """Schema for JWT access token response payload."""
    access_token: str = Field(..., description="Cryptographically signed JWT access token string")
    token_type: str = Field(default="bearer", description="Token authentication scheme type")
    expires_in: int = Field(..., description="Token lifespan duration in seconds")

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "expires_in": 1800
        }
    })


class TokenData(BaseModel):
    """Schema for decoded JWT token claims/payload data."""
    sub: Optional[str] = Field(None, description="Subject identifier (User ID or Email)")
    email: Optional[EmailStr] = Field(None, description="Decoded user email")
    role: Optional[str] = Field(None, description="Decoded user role")
