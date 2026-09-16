from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    DATABASE_URL: str
    MONGODB_URL: str = ""
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    VIRUSTOTAL_API_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    PROJECT_NAME: str = "Malware Classification System API"
    API_V1_STR: str = "/api/v1"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / "backend" / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()