import os
import uuid
import hashlib
import re
from pathlib import Path
from datetime import datetime

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.models.file import File as FileModel
from app.models.user import User


# ==============================================================
# UPLOAD DIRECTORY
# ==============================================================

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_FOLDER = BASE_DIR / "uploads"

UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


# ==============================================================
# FILE VALIDATION
# ==============================================================

ALLOWED_EXTENSIONS = {
    ".exe",
    ".dll",
    ".zip",
    ".pdf",
    ".doc",
    ".docx",
}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


class UploadService:

    # ==========================================================
    # SANITIZE FILENAME
    # ==========================================================

    def sanitize_filename(self, filename: str) -> str:
        """
        Removes unsafe characters from the original filename
        before storing it on the server.
        """

        filename = os.path.basename(filename)

        filename = re.sub(
            r"[^a-zA-Z0-9._-]",
            "_",
            filename,
        )

        return filename

    # ==========================================================
    # VALIDATE FILE
    # ==========================================================

    def validate_file(self, file: UploadFile):

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file was provided.",
            )

        extension = os.path.splitext(
            file.filename
        )[1].lower()

        if extension not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(
                sorted(ALLOWED_EXTENSIONS)
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported file type. "
                    f"Allowed types: {allowed}"
                ),
            )

        if file.size == 0:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

    # ==========================================================
    # SAVE FILE
    # ==========================================================

    def save_file(self, file: UploadFile):

        safe_filename = self.sanitize_filename(
            file.filename
        )

        unique_filename = (
            f"{uuid.uuid4()}_{safe_filename}"
        )

        file_path = UPLOAD_FOLDER / unique_filename

        try:
            content = file.file.read()

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "File size exceeds the maximum "
                        "allowed limit of 100 MB."
                    ),
                )

            with open(file_path, "wb") as buffer:
                buffer.write(content)

        except HTTPException:
            raise

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error saving file: {str(e)}",
            )

        return file_path, unique_filename

    # ==========================================================
    # GENERATE HASHES
    # ==========================================================

    def generate_hashes(self, file_path):

        sha256 = hashlib.sha256()
        md5 = hashlib.md5()

        with open(file_path, "rb") as f:

            while chunk := f.read(4096):
                sha256.update(chunk)
                md5.update(chunk)

        return (
            sha256.hexdigest(),
            md5.hexdigest(),
        )

    # ==========================================================
    # UPLOAD FILE
    # ==========================================================

    def upload_file(
        self,
        file: UploadFile,
        db: Session,
        current_user: User,
    ):

        # ======================================================
        # 1. Validate uploaded file
        # ======================================================

        self.validate_file(file)

        # ======================================================
        # 2. Save file temporarily
        # ======================================================

        file_path, stored_filename = self.save_file(file)

        # ======================================================
        # 3. Generate file hashes
        # ======================================================

        sha256, md5 = self.generate_hashes(file_path)

        # ======================================================
        # 4. Get file size and type
        # ======================================================

        file_size = os.path.getsize(file_path)

        file_type = os.path.splitext(
            file.filename
        )[1].lower()

        # ======================================================
        # 5. Check whether the same file was already uploaded
        # ======================================================

        existing_file = (
            db.query(FileModel)
            .filter(FileModel.sha256 == sha256)
            .first()
        )

        if existing_file:

            # ==================================================
            # Check whether the physical file still exists
            # ==================================================

            existing_path = (
                UPLOAD_FOLDER / existing_file.stored_filename
            )

            if not existing_path.exists():

                # ==================================================
                # The database record is valid, but its physical
                # file is missing. Restore the file using the
                # stored filename so existing file_id references
                # and analysis history remain valid.
                # ==================================================

                try:

                    os.replace(
                        file_path,
                        existing_path,
                    )

                    existing_file.file_size = file_size
                    existing_file.file_type = file_type
                    existing_file.md5 = md5
                    existing_file.status = "Uploaded"

                    db.commit()
                    db.refresh(existing_file)

                    return {
                        "message": (
                            "Existing file record restored "
                            "because its server copy was missing."
                        ),
                        "original_filename": (
                            existing_file.original_filename
                        ),
                        "stored_filename": (
                            existing_file.stored_filename
                        ),
                        "file_size": existing_file.file_size,
                        "sha256": existing_file.sha256,
                        "md5": existing_file.md5,
                        "upload_time": existing_file.upload_time,
                        "file_id": existing_file.id,
                    }

                except Exception as e:

                    db.rollback()

                    if os.path.exists(file_path):
                        os.remove(file_path)

                    raise HTTPException(
                        status_code=500,
                        detail=(
                            "The file was uploaded, but the "
                            "missing server copy could not be restored: "
                            f"{str(e)}"
                        ),
                    )

            # ==================================================
            # The duplicate exists both in the database and
            # physically on the server.
            # ==================================================

            if os.path.exists(file_path):
                os.remove(file_path)

            raise HTTPException(
                status_code=409,
                detail={
                    "message": (
                        "This file has already been uploaded as "
                        f"'{existing_file.original_filename}'."
                    ),
                    "file_id": existing_file.id,
                },
            )

        # ======================================================
        # 6. Create database record
        # ======================================================

        db_file = FileModel(
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_type=file_type,
            file_size=file_size,
            sha256=sha256,
            md5=md5,
            status="Uploaded",
            upload_time=datetime.utcnow(),
            uploaded_by=current_user.id,
        )

        try:

            # ==================================================
            # 7. Save metadata to database
            # ==================================================

            db.add(db_file)
            db.commit()
            db.refresh(db_file)

        except Exception as e:

            db.rollback()

            # ==================================================
            # Remove physical file if database insertion fails
            # ==================================================

            if os.path.exists(file_path):
                os.remove(file_path)

            raise HTTPException(
                status_code=500,
                detail=(
                    "Error saving file information to database: "
                    f"{str(e)}"
                ),
            )

        # ======================================================
        # 8. Return successful response
        # ======================================================

        return {
            "message": "File uploaded successfully",
            "original_filename": file.filename,
            "stored_filename": stored_filename,
            "file_size": file_size,
            "sha256": sha256,
            "md5": md5,
            "upload_time": db_file.upload_time,
            "file_id": db_file.id,
        }
