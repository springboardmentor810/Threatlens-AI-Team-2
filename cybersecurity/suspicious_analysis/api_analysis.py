SUSPICIOUS_APIS = {
    "VirtualAlloc",
    "VirtualProtect",
    "WriteProcessMemory",
    "CreateRemoteThread",
    "OpenProcess",
    "WinExec",
    "ShellExecuteA",
    "ShellExecuteW",
    "CreateProcessA",
    "CreateProcessW",
    "URLDownloadToFileA",
    "URLDownloadToFileW",
}


def analyze_apis(analysis_result):
    """
    Analyze Windows API imports extracted by Part 1
    and identify potentially suspicious APIs.
    """

    imports = analysis_result.get(
        "imports",
        {}
    )

    apis = imports.get(
        "apis",
        []
    )

    findings = []

    for api in apis:

        if not isinstance(api, str):
            continue

        if api in SUSPICIOUS_APIS:

            findings.append(api)

    return {
        "count": len(findings),

        "suspicious_apis": sorted(
            set(findings)
        )
    }