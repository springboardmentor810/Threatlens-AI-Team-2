from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.database.base import Base
from app.database.postgres import engine
from app import models
from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from app.api.admin import router as admin_router
from app.api.analysis import router as analysis_router
from app.api.alerts import router as alerts_router


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0"
)


# ==============================================================
# CORS
# ==============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================
# AUTHENTICATION ROUTES
# ==============================================================

app.include_router(
    auth_router,
    prefix=settings.API_V1_STR
)


# ==============================================================
# FILE UPLOAD ROUTES
# ==============================================================

app.include_router(upload_router)


# ==============================================================
# ADMINISTRATION ROUTES
# ==============================================================

app.include_router(admin_router)


# ==============================================================
# CYBERSECURITY ANALYSIS ROUTES
# ==============================================================

app.include_router(analysis_router)

# ==============================================================
# ALERT ROUTES
# ==============================================================

app.include_router(alerts_router)

# ==============================================================
# ROOT
# ==============================================================

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