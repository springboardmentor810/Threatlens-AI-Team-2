from pydantic import BaseModel
from datetime import datetime


class UploadResponse(BaseModel):
    message: str
    file_id: int
    original_filename: str
    stored_filename: str
    file_size: int
    sha256: str
    md5: str
    upload_time: datetime