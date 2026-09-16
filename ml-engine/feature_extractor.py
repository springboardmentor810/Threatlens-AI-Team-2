import joblib
import lief
import pandas as pd
from pathlib import Path
import math
import re
import hashlib
import lief
import numpy as np
import ipaddress
import yara
from pathlib import Path

def calculate_file_hashes(file_path):
    """
    Calculate MD5 and SHA-256 hashes for a file.
    """

    md5_hash = hashlib.md5()
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(8192)

            if not chunk:
                break

            md5_hash.update(chunk)
            sha256_hash.update(chunk)

    return {
        "md5": md5_hash.hexdigest(),
        "sha256": sha256_hash.hexdigest()
    }

def parse_pe_file(file_path):
    """
    Parse a Windows PE file using LIEF.
    """

    binary = lief.parse(file_path)

    if binary is None:
        raise ValueError("Unable to parse the file as a PE file.")

    return binary

def identify_file_type(file_path):
    """
    Identify whether the file is a Windows PE file.
    """

    try:
        binary = lief.parse(file_path)

        if binary is None:
            return "Unknown"

        if binary.format == lief.Binary.FORMATS.PE:
            return "Windows PE"

        return str(binary.format)

    except Exception:
        return "Unknown"

def extract_metadata_features(binary, raw_data):
    """
    Extract general metadata from a parsed Windows PE file.
    """

    total_imported_functions = sum(
        len(entry.entries)
        for entry in binary.imports
    )

    return {
        "file_size": len(raw_data),
        "virtual_size": binary.virtual_size,
        "sections_count": len(binary.sections),
        "imports_count": len(binary.imports),
        "imported_functions": total_imported_functions,
        "exports_count": len(binary.exported_functions),
        "has_debug": int(binary.has_debug),
        "has_signature": int(binary.has_signatures),
        "has_tls": int(binary.has_tls),
    }


def extract_general_features(binary, raw_data):
    """
    Extract EMBER-compatible general PE features.
    """

    total_imported_functions = sum(
        len(entry.entries)
        for entry in binary.imports
    )

    return {
        "general_size": len(raw_data),
        "general_vsize": binary.virtual_size,
        "general_has_debug": int(binary.has_debug),
        "general_imports": total_imported_functions,
        "general_has_signature": int(binary.has_signatures),
        "general_has_tls": int(binary.has_tls),
        "general_exports": len(binary.exported_functions),
    }

def extract_section_features(binary):
    """
    Extract PE section features.
    """

    return {
        "section_sections_count": len(binary.sections)
    }

def extract_import_features(binary):
    """
    Extract PE import-related features.
    """
    imports_count = len(binary.imports)

    total_imported_functions = sum(
        len(entry.entries)
        for entry in binary.imports
    )

    return {
        "imports_count": imports_count,
        "total_imported_functions": total_imported_functions
    }

def extract_api_indicators(binary):
    """
    Extract imported Windows APIs and identify potentially
    interesting APIs using static analysis only.
    """

    imported_apis = []

    for entry in binary.imports:
        for function in entry.entries:
            if function.name:
                imported_apis.append(function.name)

    suspicious_api_keywords = {
        "process_execution": [
            "CreateProcess",
            "WinExec",
            "ShellExecute",
            "ShellExecuteEx"
        ],
        "memory_manipulation": [
            "VirtualAlloc",
            "VirtualAllocEx",
            "VirtualProtect",
            "WriteProcessMemory",
            "ReadProcessMemory"
        ],
        "process_injection": [
            "CreateRemoteThread",
            "OpenProcess",
            "NtCreateThreadEx"
        ],
        "network_activity": [
            "InternetOpen",
            "InternetOpenUrl",
            "InternetConnect",
            "HttpOpenRequest",
            "HttpSendRequest",
            "WSAStartup",
            "connect"
        ],
        "command_execution": [
            "WinExec",
            "ShellExecute",
            "ShellExecuteEx",
            "CreateProcess",
            "CreateProcessA",
            "CreateProcessW"
        ]
    }

    suspicious_apis = {}

    for category, keywords in suspicious_api_keywords.items():
        matches = [
            api
            for api in imported_apis
            if api.lower() in {
                keyword.lower()
                for keyword in keywords
                }
        ]

        if matches:
            suspicious_apis[category] = sorted(set(matches))

    return {
        "imported_apis": sorted(set(imported_apis)),
        "suspicious_apis": suspicious_apis
    }

def run_yara_scan(file_path):
    """
    Scan a file using the project's YARA rules.

    The file is only read for pattern matching.
    It is never executed.
    """

    rules_path = (
        Path(__file__).resolve().parent
        / "rules"
        / "basic_rules.yar"
    )

    if not rules_path.exists():
        return []

    rules = yara.compile(
        filepath=str(rules_path)
    )

    matches = rules.match(
        filepath=str(file_path)
    )

    results = []

    for match in matches:
        results.append({
            "rule": match.rule,
            "description": match.meta.get(
                "description",
                ""
            ),
            "severity": match.meta.get(
                "severity",
                "medium"
            )
        })

    return results

def generate_yara_summary(yara_findings):
    """
    Generate a concise summary of YARA findings.
    """

    severity_order = {
        "low": 1,
        "medium": 2,
        "high": 3,
        "critical": 4
    }

    match_count = len(yara_findings)

    if match_count == 0:
        highest_severity = "None"
    else:
        highest_severity = max(
            (
                finding.get("severity", "medium").lower()
                for finding in yara_findings
            ),
            key=lambda severity: severity_order.get(
                severity, 2
            )
        ).capitalize()

    return {
        "match_count": match_count,
        "highest_severity": highest_severity
    }

def extract_strings(raw_data):
    """
    Extract printable ASCII strings using the EMBER definition.

    EMBER:
    - printable range: 0x20 through 0x7f
    - minimum length: 5 characters
    """

    pattern = re.compile(rb"[\x20-\x7f]{5,}")

    matches = pattern.findall(raw_data)

    return [
        s.decode("ascii", errors="ignore")
        for s in matches
    ]

def calculate_string_entropy(strings):
    """
    Calculate Shannon entropy of extracted strings.
    """
    if not strings:
        return 0.0

    data = "".join(strings).encode("ascii", errors="ignore")

    if not data:
        return 0.0

    counts = np.bincount(np.frombuffer(data, dtype=np.uint8), minlength=256)
    probabilities = counts[counts > 0] / len(data)

    return float(-np.sum(probabilities * np.log2(probabilities)))

def extract_string_features(raw_data):
    """
    Extract EMBER-compatible string features.
    """

    # EMBER string extraction
    strings = extract_strings(raw_data)

    if strings:
        lengths = [len(s) for s in strings]

        avlength = (
            sum(lengths) / len(lengths)
        )

        # EMBER counts printable characters
        # in all extracted strings.
        printable_bytes = b"".join(
            s.encode("ascii", errors="ignore")
            for s in strings
        )

        # Map 0x20-0x7f to 0-95
        shifted = [
            byte - 0x20
            for byte in printable_bytes
        ]

        char_histogram = np.bincount(
            shifted,
            minlength=96
        )

        printables = int(
            char_histogram.sum()
        )

        if printables > 0:
            probabilities = (
                char_histogram.astype(np.float32)
                / printables
            )

            nonzero = np.where(
                char_histogram
            )[0]

            entropy = float(
                np.sum(
                    -probabilities[nonzero]
                    * np.log2(probabilities[nonzero])
                )
            )
        else:
            entropy = 0.0

    else:
        avlength = 0.0
        char_histogram = np.zeros(
            96,
            dtype=np.float32
        )
        printables = 0
        entropy = 0.0

    # IMPORTANT:
    # These are counted directly from the raw bytes,
    # matching EMBER.
    paths = len(
        re.findall(
            rb"c:\\",
            raw_data,
            re.IGNORECASE
        )
    )

    urls = len(
        re.findall(
            rb"https?://",
            raw_data,
            re.IGNORECASE
        )
    )

    mz = len(
        re.findall(
            rb"MZ",
            raw_data
        )
    )

    return {
        "strings_avlength": float(avlength),
        "strings_entropy": float(entropy),
        "strings_MZ": mz,
        "strings_urls": urls,
        "strings_printables": printables,
        "strings_numstrings": len(strings),
        "strings_paths": paths
    }

def extract_suspicious_indicators(raw_data):
    """
    Extract potentially suspicious indicators from raw PE bytes.
    This is static analysis only; the file is never executed.
    """

    indicators = {
        "urls": [],
        "ip_addresses": [],
        "powershell_commands": [],
        "file_paths": [],
    }

    # Extract URLs
    url_matches = re.findall(
        rb"https?://[^\x00\s\"'<>]+",
        raw_data,
        re.IGNORECASE
    )

    # Keep URLs, but ignore common Microsoft schema/configuration URLs
    urls = [
        url.decode("ascii", errors="ignore")
        for url in url_matches
    ]

    indicators["urls"] = [
        url
        for url in urls
        if not url.lower().startswith(
            "http://schemas.microsoft.com/"
        )
        and not url.lower().startswith(
            "https://schemas.microsoft.com/"
        )
    ]

   # Extract IPv4 addresses
    ip_matches = re.findall(
        rb"(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])",
        raw_data
    )

    valid_ips = []

    for ip in ip_matches:
        ip_string = ip.decode("ascii", errors="ignore")

        try:
            ip_obj = ipaddress.ip_address(ip_string)

        # Ignore obvious version-like / placeholder addresses
            if ip_string.endswith(".0.0"):
                continue

        # Ignore non-routable/special addresses
            if (
                ip_obj.is_unspecified
                or ip_obj.is_loopback
                or ip_obj.is_multicast
                or ip_obj.is_reserved
        ):
                continue

            valid_ips.append(ip_string)

        except ValueError:
            continue

    indicators["ip_addresses"] = valid_ips

    # Look for PowerShell-related commands
    powershell_patterns = [
        rb"powershell",
        rb"pwsh",
        rb"Invoke-WebRequest",
        rb"Invoke-Expression",
        rb"DownloadString",
        rb"EncodedCommand",
    ]

    for pattern in powershell_patterns:
        matches = re.findall(
            pattern,
            raw_data,
            re.IGNORECASE
        )

        indicators["powershell_commands"].extend(
            match.decode("ascii", errors="ignore")
            for match in matches
        )

    # Extract Windows-style file paths
    path_matches = re.findall(
        rb"[A-Za-z]:\\(?:[^\\/:*?\"<>|\r\n]+\\)*[^\\/:*?\"<>|\r\n]+",
        raw_data
    )

    indicators["file_paths"] = [
        path.decode("ascii", errors="ignore")
        for path in path_matches
    ]

    return indicators

def extract_histogram_features(raw_data):
    """
    Extract byte histogram statistics from PE file bytes.
    """
    byte_values = np.frombuffer(raw_data, dtype=np.uint8)

    histogram = np.bincount(
        byte_values,
        minlength=256
    )

    return {
        "hist_min": float(np.min(histogram)),
        "hist_max": float(np.max(histogram)),
        "hist_std": float(np.std(histogram)),
        "hist_sum": float(np.sum(histogram)),
        "hist_mean": float(np.mean(histogram))
    }

def extract_byteentropy_features(raw_data):
    """
    Extract EMBER-compatible byte-entropy histogram statistics.

    EMBER uses:
    - 2048-byte windows
    - 1024-byte step
    - 16 coarse byte bins
    - 16 entropy bins
    - resulting 16 x 16 histogram
    """

    window = 2048
    step = 1024

    data = np.frombuffer(raw_data, dtype=np.uint8)

    output = np.zeros((16, 16), dtype=np.int32)

    def entropy_bin_counts(block):
        # Reduce 256 byte values into 16 bins using the high nibble.
        counts = np.bincount(
            block >> 4,
            minlength=16
        )

        # IMPORTANT:
        # EMBER uses the fixed window size as denominator.
        probabilities = counts.astype(np.float32) / window

        nonzero = np.where(counts)[0]

        entropy = np.sum(
            -probabilities[nonzero]
            * np.log2(probabilities[nonzero])
        ) * 2

        entropy_bin = int(entropy * 2)

        # Maximum entropy is 8 bits.
        if entropy_bin == 16:
            entropy_bin = 15

        return entropy_bin, counts

    # Files smaller than one window
    if data.shape[0] < window:

        entropy_bin, counts = entropy_bin_counts(data)

        output[entropy_bin, :] += counts

    else:

        # EMBER considers complete 2048-byte windows
        # at 1024-byte intervals.
        number_of_blocks = (
            data.shape[0] - window + 1
        )

        for start in range(
            0,
            number_of_blocks,
            step
        ):

            block = data[
                start:start + window
            ]

            entropy_bin, counts = entropy_bin_counts(block)

            output[entropy_bin, :] += counts

    # EMBER normalizes the histogram.
    return {
    "entropy_mean": float(output.mean()),
    "entropy_std": float(output.std()),
    "entropy_min": float(output.min()),
    "entropy_max": float(output.max())
}


def extract_model_features(file_path):
    """
    Extract exactly the 25 features required by
    final_malware_rf.pkl.
    """

    # Read raw file bytes
    with open(file_path, "rb") as f:
        raw_data = f.read()

    # Parse PE
    binary = parse_pe_file(file_path)

    # Extract all feature groups
    general_features = extract_general_features(
        binary,
        raw_data
    )

    section_features = extract_section_features(
        binary
    )

    import_features = extract_import_features(
        binary
    )

    string_features = extract_string_features(
        raw_data
    )

    histogram_features = extract_histogram_features(
        raw_data
    )

    byteentropy_features = extract_byteentropy_features(
        raw_data
    )

    # Combine all extracted features
    all_features = {}

    all_features.update(general_features)
    all_features.update(section_features)
    all_features.update(import_features)
    all_features.update(string_features)
    all_features.update(histogram_features)
    all_features.update(byteentropy_features)

    # Exact feature list used by the trained model
    model_features = [
        "imports_count",
        "strings_avlength",
        "total_imported_functions",
        "strings_entropy",
        "hist_min",
        "general_imports",
        "entropy_max",
        "general_vsize",
        "general_has_tls",
        "strings_MZ",
        "entropy_std",
        "strings_urls",
        "hist_std",
        "strings_printables",
        "hist_max",
        "strings_numstrings",
        "general_size",
        "hist_sum",
        "hist_mean",
        "entropy_mean",
        "general_has_debug",
        "section_sections_count",
        "strings_paths",
        "general_has_signature",
        "general_exports"
    ]

    # Check that every required feature exists
    missing_features = [
        feature
        for feature in model_features
        if feature not in all_features
    ]

    if missing_features:
        raise ValueError(
            f"Missing required features: {missing_features}"
        )

    # Keep ONLY the 25 model features
    model_feature_values = {
        feature: all_features[feature]
        for feature in model_features
    }

    return model_feature_values

def check_authenticode_signature(file_path):
    """
    Check Windows Authenticode signature status.

    Uses PowerShell on Windows and falls back to LIEF
    on other operating systems.
    """
    import platform
    import subprocess

    if platform.system() == "Windows":
        result = subprocess.run(
            [
                "powershell",
                "-Command",
                (
                    f"(Get-AuthenticodeSignature "
                    f"'{file_path}').Status"
                )
            ],
            capture_output=True,
            text=True
        )

        status = result.stdout.strip()

        return {
            "status": status if status else "Unknown",
            "is_valid": status == "Valid"
        }

    # Fallback for non-Windows systems
    try:
        binary = lief.parse(file_path)

        if binary is not None and binary.has_signatures:
            return {
                "status": "Signed",
                "is_valid": True
            }

        return {
            "status": "NotSigned",
            "is_valid": False
        }

    except Exception:
        return {
            "status": "Unknown",
            "is_valid": False
        }

def run_static_analysis(file_path):
    """
    Run the complete static analysis pipeline on a Windows PE file.

    The file is only read and parsed. It is never executed.
    """

    # File identification
    file_type = identify_file_type(file_path)

    if file_type != "Windows PE":
        raise ValueError("The uploaded file is not a Windows PE file.")

    # Hashes
    hashes = calculate_file_hashes(file_path)

    # Read raw file bytes
    with open(file_path, "rb") as f:
        raw_data = f.read()

    # Parse PE
    binary = parse_pe_file(file_path)

    # Metadata
    metadata = extract_metadata_features(
        binary,
        raw_data
    )
    signature = check_authenticode_signature(file_path)
    # Strings and suspicious indicators
    string_features = extract_string_features(
        raw_data
    )

    suspicious_indicators = extract_suspicious_indicators(
        raw_data
    )

    # Import/API analysis
    api_analysis = extract_api_indicators(
        binary
    )

    yara_matches = run_yara_scan(file_path)

    return {
        "file_type": file_type,
        "hashes": hashes,
        "metadata": metadata,
        "signature": signature,
        "string_features": string_features,
        "suspicious_indicators": suspicious_indicators,
        "api_analysis": api_analysis,
        "yara_matches": yara_matches,
    }

def generate_static_report(file_path):
    """
    Generate a structured static-analysis security report.

    The file is only read and analyzed statically.
    It is never executed.
    """
    analysis = run_static_analysis(file_path)

    yara_summary = generate_yara_summary(
    analysis["yara_matches"]
)

    return {
        "file": {
            "type": analysis["file_type"],
            "hashes": analysis["hashes"],
            "signature": analysis["signature"]
        },
        "metadata": analysis["metadata"],
        "strings": analysis["string_features"],
        "suspicious_indicators": analysis["suspicious_indicators"],
        "api_analysis": analysis["api_analysis"],
        "yara_findings": analysis["yara_matches"],
        "yara_summary": yara_summary
}
