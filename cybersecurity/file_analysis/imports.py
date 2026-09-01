import pefile


def extract_imports(file_path):
    """
    Extract imported DLLs and Windows API/function names
    from a PE file.

    This function only extracts names.
    It does NOT classify APIs as suspicious or malicious.
    """

    pe = pefile.PE(file_path)

    dlls = []
    apis = []

    if not hasattr(pe, "DIRECTORY_ENTRY_IMPORT"):
        pe.close()

        return {
            "dlls": [],
            "apis": []
        }

    for entry in pe.DIRECTORY_ENTRY_IMPORT:

        dll_name = entry.dll.decode(
            "utf-8",
            errors="ignore"
        )

        dlls.append(dll_name)

        for function in entry.imports:

            if function.name:
                function_name = function.name.decode(
                    "utf-8",
                    errors="ignore"
                )
            else:
                function_name = f"ordinal_{function.ordinal}"

            apis.append(function_name)

    pe.close()

    return {
        "dlls": dlls,
        "apis": apis
    }