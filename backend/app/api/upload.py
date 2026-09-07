from fastapi import APIRouter, UploadFile, File

from app.services.upload_service import UploadService
from app.schemas.upload import UploadResponse

router = APIRouter(
    prefix="/upload",
    tags=["File Upload"]
)

service = UploadService()


@router.post("/", response_model=UploadResponse)
def upload_file(file: UploadFile = File(...)):
    return service.upload_file(file)