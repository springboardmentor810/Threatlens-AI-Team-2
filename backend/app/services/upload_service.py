import os
import uuid
import hashlib
from datetime import datetime

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.models.file import File as FileModel
from app.models.user import User


UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {".exe", ".dll", ".zip", ".pdf", ".doc", ".docx"}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


class UploadService:

    def validate_file(self, file: UploadFile):

        extension = os.path.splitext(file.filename)[1].lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type"
            )

    def save_file(self, file: UploadFile):

        unique_filename = f"{uuid.uuid4()}_{file.filename}"

        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        try:
            with open(file_path, "wb") as buffer:
                content = file.file.read()

                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400,
                        detail="File size exceeds 100MB"
                    )

                buffer.write(content)

        except HTTPException:
            raise

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error saving file: {str(e)}"
            )

        return file_path, unique_filename

    def generate_hashes(self, file_path):

        sha256 = hashlib.sha256()
        md5 = hashlib.md5()

        with open(file_path, "rb") as f:
            while chunk := f.read(4096):
                sha256.update(chunk)
                md5.update(chunk)

        return sha256.hexdigest(), md5.hexdigest()

    def upload_file(
        self,
        file: UploadFile,
        db: Session,
        current_user: User
    ):

        self.validate_file(file)

        file_path, stored_filename = self.save_file(file)

        sha256, md5 = self.generate_hashes(file_path)

        file_size = os.path.getsize(file_path)

        file_type = os.path.splitext(file.filename)[1].lower()

        db_file = FileModel(
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_type=file_type,
            file_size=file_size,
            sha256=sha256,
            md5=md5,
            status="Uploaded",
            upload_time=datetime.utcnow(),
            uploaded_by=current_user.id
        )

        try:
            db.add(db_file)
            db.commit()
            db.refresh(db_file)

        except Exception as e:
            db.rollback()

            # Remove physical file if database insertion fails
            if os.path.exists(file_path):
                os.remove(file_path)

            raise HTTPException(
                status_code=500,
                detail=f"Error saving file information to database: {str(e)}"
            )

        return {
            "message": "File uploaded successfully",
            "original_filename": file.filename,
            "stored_filename": stored_filename,
            "file_size": file_size,
            "sha256": sha256,
            "md5": md5,
            "upload_time": db_file.upload_time,
            "file_id": db_file.id
        }