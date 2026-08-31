from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    MONGODB_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    VIRUSTOTAL_API_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    PROJECT_NAME: str = "Malware Classification System API"
    API_V1_STR: str = "/api/v1"

    class Config:
        env_file = ".env"


settings = Settings()