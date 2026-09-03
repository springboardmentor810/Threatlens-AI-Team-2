import os
from file_analysis_pipeline import analyze_file


FILE_PATH = os.getenv("TEST_FILE_PATH")

if not FILE_PATH:
    raise RuntimeError(
        "TEST_FILE_PATH is not set. "
        "Set it to the path of a local .exe or .dll test file."
    )


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