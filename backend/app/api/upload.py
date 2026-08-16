from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.services.upload_service import UploadService
from app.schemas.upload import UploadResponse
from app.database.session import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/upload",
    tags=["File Upload"]
)

service = UploadService()


@router.post("/", response_model=UploadResponse)
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.upload_file(
        file=file,
        db=db,
        current_user=current_user
    )