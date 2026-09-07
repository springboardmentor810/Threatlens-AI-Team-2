import os

from file_analysis_pipeline import analyze_file


UPLOAD_FOLDER = r"E:\Malware-Classification-System\backend\uploads"

ALLOWED_EXTENSIONS = {
    ".exe",
    ".dll",
    ".zip",
    ".pdf",
    ".doc",
    ".docx",
}


def get_latest_uploaded_file():
    files = []

    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        if not os.path.isfile(file_path):
            continue

        extension = os.path.splitext(filename)[1].lower()

        if extension in ALLOWED_EXTENSIONS:
            files.append(file_path)

    if not files:
        return None

    return max(files, key=os.path.getmtime)


FILE_PATH = get_latest_uploaded_file()

if FILE_PATH is None:
    print("No supported file found in backend/uploads/")
    exit()

print(f"\nAnalyzing latest uploaded file:")
print(os.path.basename(FILE_PATH))


result = analyze_file(FILE_PATH)


print("\n==============================")
print("STATIC FILE ANALYSIS")
print("==============================")

print("\nFILE INFORMATION")
print(result["file"])

print("\nVALIDATION")
print(result["validation"])

print("\nMETADATA")
print(result["metadata"])

print("\nHASHES")
print(result["hashes"])

print("\nPE ANALYSIS")
print(result["pe_analysis"])

print("\nIMPORTS")

print("DLLs:")
print(result["imports"]["dlls"][:5])

print("APIs:")
print(result["imports"]["apis"][:20])

print("\nSTRINGS")
print(result["strings"][:20])