from cybersecurity.suspicious_analysis.api_analysis import analyze_apis
from cybersecurity.suspicious_analysis.url_ip_analysis import extract_urls_and_ips
from cybersecurity.suspicious_analysis.ioc_extraction import extract_iocs
from cybersecurity.suspicious_analysis.suspicious_patterns import detect_suspicious_patterns
from cybersecurity.suspicious_analysis.feature_extraction import build_security_features


def test_suspicious_analysis():

    analysis_result = {
        "file": {
            "name": "sample.exe"
        },
        "hashes": {
            "md5": "dummy-md5",
            "sha256": "dummy-sha256"
        },
        "strings": [
            "http://example.com/test",
            "192.168.1.10",
            "powershell.exe",
            "cmd.exe"
        ],
        "imports": {
            "dlls": ["kernel32.dll"],
            "apis": [
                "VirtualAlloc",
                "CreateRemoteThread",
                "ReadFile"
            ]
        }
    }

    indicator_result = extract_urls_and_ips(analysis_result)

    ioc_result = extract_iocs(
        analysis_result,
        indicator_result
    )

    pattern_result = detect_suspicious_patterns(
        analysis_result
    )

    api_result = analyze_apis(
        analysis_result
    )

    security_features = build_security_features(
        analysis_result,
        indicator_result,
        ioc_result,
        pattern_result,
        api_result
    )

    assert "http://example.com/test" in indicator_result["urls"]
    assert "192.168.1.10" in indicator_result["ips"]

    assert "VirtualAlloc" in api_result["suspicious_apis"]
    assert "CreateRemoteThread" in api_result["suspicious_apis"]

    assert pattern_result["count"] > 0

    assert security_features["summary"]["url_count"] == 1
    assert security_features["summary"]["ip_count"] == 1