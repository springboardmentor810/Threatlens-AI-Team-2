import os
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException
from cybersecurity.file_analysis_pipeline import analyze_file

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {".exe", ".dll", ".zip", ".pdf", ".doc", ".docx"}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


class UploadService:

    def validate_file(self, file: UploadFile):

        extension = os.path.splitext(file.filename)[1].lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Unsupported file type")

    def save_file(self, file: UploadFile):

        unique_filename = f"{uuid.uuid4()}_{file.filename}"

        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

        try:
            with open(file_path, "wb") as buffer:
                content = file.file.read()

                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400, detail="File size exceeds 100MB"
                    )

                buffer.write(content)

        except HTTPException:
            raise

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

        return file_path, unique_filename



    def upload_file(self, file: UploadFile):

        self.validate_file(file)

        file_path, stored_filename = self.save_file(file)

        # Run cybersecurity static analysis automatically
        analysis_result = analyze_file(file_path)

        return {
            "message": "File uploaded and analyzed successfully",
            "original_filename": file.filename,
            "stored_filename": stored_filename,
            "file_size": os.path.getsize(file_path),
            "upload_time": datetime.now(),
            "analysis": analysis_result,
        }
