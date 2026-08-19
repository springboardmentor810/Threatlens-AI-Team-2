import os
import uuid
import hashlib
import re
from datetime import datetime

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.models.file import File as FileModel
from app.models.user import User


UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".exe",
    ".dll",
    ".zip",
    ".pdf",
    ".doc",
    ".docx"
}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


class UploadService:

    def sanitize_filename(self, filename: str) -> str:
        """
        Removes unsafe characters from the original filename
        before storing it on the server.
        """
        filename = os.path.basename(filename)

        filename = re.sub(
            r"[^a-zA-Z0-9._-]",
            "_",
            filename
        )

        return filename

    def validate_file(self, file: UploadFile):

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file was provided."
            )

        extension = os.path.splitext(file.filename)[1].lower()

        if extension not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))

            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed types: {allowed}"
            )

        if file.size == 0:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty."
            )

    def save_file(self, file: UploadFile):

        safe_filename = self.sanitize_filename(file.filename)

        unique_filename = f"{uuid.uuid4()}_{safe_filename}"

        file_path = os.path.join(
            UPLOAD_FOLDER,
            unique_filename
        )

        try:
            content = file.file.read()

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail="File size exceeds the maximum allowed limit of 100 MB."
                )

            with open(file_path, "wb") as buffer:
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

        # 1. Validate uploaded file
        self.validate_file(file)

        # 2. Save file temporarily
        file_path, stored_filename = self.save_file(file)

        # 3. Generate file hashes
        sha256, md5 = self.generate_hashes(file_path)

        # 4. Get file size and type
        file_size = os.path.getsize(file_path)

        file_type = os.path.splitext(
            file.filename
        )[1].lower()

        # 5. Check whether the same file was already uploaded
        existing_file = db.query(FileModel).filter(
            FileModel.sha256 == sha256
        ).first()

        if existing_file:

            # Delete newly uploaded duplicate file
            if os.path.exists(file_path):
                os.remove(file_path)

            raise HTTPException(
                status_code=400,
                detail=(
                    f"This file has already been uploaded as "
                    f"'{existing_file.original_filename}'."
                )
            )

        # 6. Create database record
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

            # 7. Save metadata to database
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

        # 8. Return successful response
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