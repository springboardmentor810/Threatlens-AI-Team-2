import re


SUSPICIOUS_PATTERNS = {
    "powershell": re.compile(r"\bpowershell(?:\.exe)?\b", re.IGNORECASE),
    "cmd": re.compile(r"\bcmd(?:\.exe)?\b", re.IGNORECASE),
    "wscript": re.compile(r"\bwscript(?:\.exe)?\b", re.IGNORECASE),
    "cscript": re.compile(r"\bcscript(?:\.exe)?\b", re.IGNORECASE),
    "rundll32": re.compile(r"\brundll32(?:\.exe)?\b", re.IGNORECASE),
    "regsvr32": re.compile(r"\bregsvr32(?:\.exe)?\b", re.IGNORECASE),
    "download_command": re.compile(
        r"\b(?:curl|wget|bitsadmin)\b",
        re.IGNORECASE
    ),
}


def detect_suspicious_patterns(analysis_result):
    """
    Detect potentially suspicious patterns in strings
    extracted by Part 1.

    Returns:
        Dictionary containing detected patterns and
        the strings in which they were found.
    """

    strings = analysis_result.get("strings", [])

    findings = []

    for value in strings:
        if not isinstance(value, str):
            continue

        for pattern_name, pattern in SUSPICIOUS_PATTERNS.items():
            if pattern.search(value):
                findings.append({
                    "pattern": pattern_name,
                    "string": value,
                })

    return {
        "count": len(findings),
        "findings": findings,
    }