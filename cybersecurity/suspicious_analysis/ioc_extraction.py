def extract_iocs(analysis_result, indicator_result):
    """
    Extract potential Indicators of Compromise (IOCs)
    from Part 1 analysis and Part 2 URL/IP analysis.

    Parameters:
        analysis_result: Result returned by Part 1.
        indicator_result: Result returned by url_ip_analysis.

    Returns:
        Dictionary containing potential IOCs.
    """

    hashes = analysis_result.get("hashes", {})

    md5 = hashes.get("md5")
    sha256 = hashes.get("sha256")

    urls = indicator_result.get("urls", [])
    ips = indicator_result.get("ips", [])

    iocs = {
        "md5": md5,
        "sha256": sha256,
        "urls": urls,
        "ips": ips,
    }

    return iocs