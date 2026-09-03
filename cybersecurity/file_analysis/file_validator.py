import os


ALLOWED_EXTENSIONS = {
    ".exe",
    ".dll",
    ".zip",
    ".pdf",
    ".doc",
    ".docx",
}

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB


def validate_file(file_path):
    """
    Validate that the file exists, has a supported extension,
    and does not exceed the maximum allowed size.
    """

    if not os.path.isfile(file_path):
        raise FileNotFoundError("File does not exist")

    extension = os.path.splitext(file_path)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {extension}"
        )

    file_size = os.path.getsize(file_path)

    if file_size > MAX_FILE_SIZE:
        raise ValueError(
            "File size exceeds 100 MB"
        )

    return {
        "valid": True,
        "extension": extension,
        "size": file_size,
    }