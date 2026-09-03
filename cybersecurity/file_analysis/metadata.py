import os
import zipfile

from datetime import datetime

from pypdf import PdfReader
from docx import Document


def get_file_type(extension):
    """
    Convert file extension into a general file type.
    """

    file_types = {
        ".exe": "PE",
        ".dll": "PE",
        ".zip": "ZIP",
        ".pdf": "PDF",
        ".doc": "DOC",
        ".docx": "DOCX",
    }

    return file_types.get(extension, "UNKNOWN")


def extract_metadata(file_path):
    """
    Extract common metadata based on file type.
    """

    if not os.path.isfile(file_path):
        raise FileNotFoundError("File does not exist")

    filename = os.path.basename(file_path)
    extension = os.path.splitext(filename)[1].lower()
    file_size = os.path.getsize(file_path)

    metadata = {
        "filename": filename,
        "extension": extension,
        "file_type": get_file_type(extension),
        "size": file_size,
        "created_time": datetime.fromtimestamp(
            os.path.getctime(file_path)
        ).isoformat(),
        "modified_time": datetime.fromtimestamp(
            os.path.getmtime(file_path)
        ).isoformat(),
    }

    # PDF metadata
    if extension == ".pdf":
        try:
            reader = PdfReader(file_path)

            metadata["page_count"] = len(reader.pages)

            if reader.metadata:
                metadata["document_metadata"] = {
                    key: str(value)
                    for key, value in reader.metadata.items()
                }

        except Exception as error:
            metadata["metadata_error"] = str(error)

    # DOCX metadata
    elif extension == ".docx":
        try:
            document = Document(file_path)

            properties = document.core_properties

            metadata["document_metadata"] = {
                "title": properties.title,
                "author": properties.author,
                "subject": properties.subject,
                "keywords": properties.keywords,
                "paragraph_count": len(document.paragraphs),
            }

        except Exception as error:
            metadata["metadata_error"] = str(error)

    # ZIP metadata
    elif extension == ".zip":
        try:
            with zipfile.ZipFile(file_path, "r") as archive:

                members = archive.infolist()

                metadata["file_count"] = len(members)

                metadata["files"] = [
                    member.filename
                    for member in members[:100]
                ]

        except Exception as error:
            metadata["metadata_error"] = str(error)

    return metadata