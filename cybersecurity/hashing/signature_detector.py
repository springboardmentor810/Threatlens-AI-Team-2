import json
from pathlib import Path
from typing import Any


class SignatureDetector:
    """Detects files by matching their hashes against known signatures."""

    def __init__(self, signature_file: str | None = None):

        if signature_file:
            self.signature_file = Path(signature_file)
        else:
            self.signature_file = (
                Path(__file__).resolve().parent / "signatures.json"
            )

    def load_signatures(self) -> dict[str, Any]:
        """Load known malware signatures from JSON."""

        if not self.signature_file.exists():
            raise FileNotFoundError(
                f"Signature database not found: {self.signature_file}"
            )

        with open(self.signature_file, "r", encoding="utf-8") as file:
            return json.load(file)

    def check_hashes(
        self,
        sha256: str,
        md5: str
    ) -> dict[str, Any]:
        """Compare file hashes against known signatures."""

        signatures = self.load_signatures()

        sha256_matches = signatures.get("sha256", {})
        md5_matches = signatures.get("md5", {})

        sha256_match = sha256_matches.get(sha256.lower())
        md5_match = md5_matches.get(md5.lower())

        matches = []

        if sha256_match:
            matches.append({
                "hash_type": "SHA-256",
                "hash": sha256,
                **sha256_match
            })

        if md5_match:
            matches.append({
                "hash_type": "MD5",
                "hash": md5,
                **md5_match
            })

        return {
            "signature_matched": bool(matches),
            "matches": matches,
            "match_count": len(matches)
        }