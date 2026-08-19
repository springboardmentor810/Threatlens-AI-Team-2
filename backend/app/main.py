from fastapi import FastAPI

from app.config.settings import settings
from app.database.base import Base
from app.database.postgres import engine
from app import models
from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from app.api.admin import router as admin_router


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0"
)


# Authentication routes
app.include_router(
    auth_router,
    prefix=settings.API_V1_STR
)


# File upload routes
app.include_router(upload_router)

# Administration routes
app.include_router(admin_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Malware Classification System API"
    }


@app.get("/health")
def health():
    return {
        "status": "Healthy"
    }