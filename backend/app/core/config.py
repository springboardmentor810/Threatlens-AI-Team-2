import os
from pydantic import BaseModel


class Settings(BaseModel):
    """Application security & environment settings."""
    PROJECT_NAME: str = "Malware Classification System"
    API_V1_STR: str = "/api/v1"
    
    # JWT Cryptographic Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


settings = Settings()
