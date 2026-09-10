from fastapi import FastAPI, UploadFile, File, HTTPException
from pathlib import Path
import tempfile
import os
from inference import generate_security_report


app = FastAPI(
    title="Malware Classification API",
    description="API for PE malware detection and malware family classification.",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "status": "API is running",
        "service": "Malware Classification System"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/predict/file")
def predict_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file was provided."
        )

    file_bytes = file.file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    suffix = Path(file.filename).suffix
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        report = generate_security_report(temp_path)

        report["file"]["filename"] = file.filename

        return report

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)