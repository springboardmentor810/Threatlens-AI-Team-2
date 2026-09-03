def build_security_features(
    analysis_result,
    indicator_result,
    ioc_result,
    pattern_result,
    api_result,
):
    """
    Combine Part 1 analysis and Part 2 findings
    into a structured security feature object.
    """

    return {
        "file": analysis_result.get("file", {}),
        "hashes": analysis_result.get("hashes", {}),
        "indicators": {
            "urls": indicator_result.get("urls", []),
            "ips": indicator_result.get("ips", []),
            "md5": ioc_result.get("md5"),
            "sha256": ioc_result.get("sha256"),
        },
        "suspicious_patterns": pattern_result.get("findings", []),
        "suspicious_apis": api_result.get("suspicious_apis", []),
        "summary": {
            "url_count": len(indicator_result.get("urls", [])),
            "ip_count": len(indicator_result.get("ips", [])),
            "suspicious_pattern_count": pattern_result.get("count", 0),
            "suspicious_api_count": api_result.get("count", 0),
        },
    }   