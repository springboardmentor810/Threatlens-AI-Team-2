import os

from cybersecurity.file_analysis.file_validator import validate_file
from cybersecurity.file_analysis.metadata import extract_metadata
from cybersecurity.file_analysis.hashing import calculate_hashes
from cybersecurity.file_analysis.strings import extract_strings
from cybersecurity.file_analysis.pe_analysis import analyze_pe
from cybersecurity.file_analysis.imports import extract_imports


def analyze_file(file_path):
    """
    Main entry point for static file analysis.
    """

    # -------------------------
    # 1. VALIDATION
    # -------------------------

    validation = validate_file(file_path)

    extension = validation["extension"]

    # -------------------------
    # 2. COMMON INFORMATION
    # -------------------------

    metadata = extract_metadata(file_path)

    hashes = calculate_hashes(file_path)

    result = {
        "file": {
            "filename": os.path.basename(file_path),
            "extension": extension,
            "file_type": metadata["file_type"],
            "size": metadata["size"],
        },

        "validation": validation,

        "metadata": metadata,

        "hashes": hashes,
    }

    # -------------------------
    # 3. PE ANALYSIS
    # -------------------------

    if extension in {".exe", ".dll"}:

        result["pe_analysis"] = analyze_pe(
            file_path
        )

        result["imports"] = extract_imports(
            file_path
        )

        strings = extract_strings(file_path)

        result["strings"] = strings[:100]

    # -------------------------
    # 4. NON-PE FILES
    # -------------------------

    else:

        result["pe_analysis"] = {
            "headers": {},
            "sections": [],
            "suspicious_characteristics": []
        }

        result["imports"] = {
            "dlls": [],
            "apis": []
        }

        result["strings"] = []

    return result