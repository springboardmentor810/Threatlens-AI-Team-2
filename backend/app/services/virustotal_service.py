from typing import Any

import vt

from app.config.settings import settings


class VirusTotalService:
    """Service for querying VirusTotal using a file SHA-256 hash."""

    def __init__(self):
        self.api_key = settings.VIRUSTOTAL_API_KEY

    def check_hash(self, sha256: str) -> dict[str, Any]:
        """Check a file hash against VirusTotal."""

        if not self.api_key:
            return {
                "available": False,
                "found": False,
                "error": "VirusTotal API key is not configured."
            }

        client = vt.Client(self.api_key)

        try:
            file_object = client.get_object(
                f"/files/{sha256}"
            )

            stats = file_object.last_analysis_stats or {}

            return {
                "available": True,
                "found": True,
                "sha256": sha256,
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "undetected": stats.get("undetected", 0),
                "harmless": stats.get("harmless", 0),
                "timeout": stats.get("timeout", 0),
                "total_engines": sum(stats.values())
            }

        except Exception as e:
            return {
                "available": True,
                "found": False,
                "sha256": sha256,
                "error": str(e)
            }

        finally:
            client.close()