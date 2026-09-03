import re


URL_PATTERN = re.compile(
    r"https?://[^\s\"'<>]+",
    re.IGNORECASE
)

IP_PATTERN = re.compile(
    r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
)


def extract_urls_and_ips(analysis_result):
    """
    Extract URLs and IPv4 addresses from Part 1 string analysis results.

    Parameters:
        analysis_result: Result returned by file_analysis_pipeline.analyze_file()

    Returns:
        Dictionary containing detected URLs and IP addresses.
    """

    strings = analysis_result.get("strings", [])

    urls = set()
    ips = set()

    for value in strings:
        if not isinstance(value, str):
            continue

        urls.update(URL_PATTERN.findall(value))
        ips.update(IP_PATTERN.findall(value))

    return {
        "urls": sorted(urls),
        "ips": sorted(ips),
    }