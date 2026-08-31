import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from cybersecurity.yara_scanner import YaraScanner
from cybersecurity.hashing.signature_detector import SignatureDetector

from app.models.analysis import Analysis
from app.services.virustotal_service import VirusTotalService


class CybersecurityService:
    """
    Part 3 cybersecurity analysis.

    Performs:
    - YARA detection
    - Signature-based detection
    - VirusTotal threat intelligence
    - Risk scoring
    - Final threat classification
    - Detection reason generation
    - PostgreSQL result storage

    Static-analysis extraction is handled by Part 1/2.
    """

    def __init__(self):
        self.yara_scanner = YaraScanner()
        self.signature_detector = SignatureDetector()
        self.virustotal_service = VirusTotalService()

    def analyze_file(
        self,
        file_path: str,
        sha256: str,
        md5: str,
        static_analysis: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:

        # 1. YARA detection
        yara_result = self.yara_scanner.scan_file(file_path)

        # 2. Signature detection
        signature_result = self.signature_detector.check_hashes(
            sha256=sha256,
            md5=md5
        )

        # 3. VirusTotal intelligence
        virustotal_result = self.virustotal_service.check_hash(
            sha256
        )

        # 4. Generate final finding
        final_finding = self._generate_final_finding(
            yara_result=yara_result,
            signature_result=signature_result,
            virustotal_result=virustotal_result
        )

        # 5. Combined result
        return {
            "sha256": sha256,
            "md5": md5,
            "yara": yara_result,
            "signature": signature_result,
            "virustotal": virustotal_result,
            "static_analysis": static_analysis,
            "final_finding": final_finding
        }

    def save_analysis(
        self,
        db: Session,
        file_id: int,
        analysis_result: dict[str, Any]
    ) -> Analysis:

        analysis_record = Analysis(
            file_id=file_id,
            analysis_type="cybersecurity",
            result=json.dumps(
                analysis_result,
                default=str
            )
        )

        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)

        return analysis_record

    def _generate_final_finding(
        self,
        yara_result: dict[str, Any],
        signature_result: dict[str, Any],
        virustotal_result: dict[str, Any]
    ) -> dict[str, Any]:

        yara_detected = yara_result.get(
            "yara_matched",
            False
        )

        signature_detected = signature_result.get(
            "signature_matched",
            False
        )

        vt_malicious = virustotal_result.get(
            "malicious",
            0
        )

        vt_suspicious = virustotal_result.get(
            "suspicious",
            0
        )

        # --------------------------------
        # Risk score
        # --------------------------------

        risk_score = 0

        if signature_detected:
            risk_score += 60

        if yara_detected:
            risk_score += 25

        if vt_malicious > 0:
            risk_score += 10

        if vt_suspicious > 0:
            risk_score += 5

        # Never allow score above 100
        risk_score = min(risk_score, 100)

        # --------------------------------
        # Detection reasons
        # --------------------------------

        reasons = []

        if signature_detected:

            matches = signature_result.get(
                "matches",
                []
            )

            if matches:

                for match in matches:

                    name = match.get(
                        "name",
                        "Known malware signature"
                    )

                    family = match.get(
                        "family"
                    )

                    if family:
                        reasons.append(
                            f"Known malware signature detected: "
                            f"{name} ({family})"
                        )
                    else:
                        reasons.append(
                            f"Known malware signature detected: "
                            f"{name}"
                        )

            else:
                reasons.append(
                    "Known malware signature detected"
                )

        if yara_detected:

            matched_rules = yara_result.get(
                "matched_rules",
                []
            )

            if matched_rules:

                for rule in matched_rules:

                    rule_name = rule.get(
                        "rule",
                        "Unknown YARA rule"
                    )

                    reasons.append(
                        f"YARA rule matched: {rule_name}"
                    )

            else:
                reasons.append(
                    "YARA rule detected suspicious characteristics"
                )

        if vt_malicious > 0:

            reasons.append(
                f"VirusTotal detected the file as malicious "
                f"by {vt_malicious} security engine(s)"
            )

        if vt_suspicious > 0:

            reasons.append(
                f"VirusTotal detected the file as suspicious "
                f"by {vt_suspicious} security engine(s)"
            )

        # --------------------------------
        # Verdict based on risk score
        # --------------------------------

        if risk_score >= 50:

            verdict = "MALICIOUS"
            threat_level = "HIGH"

        elif risk_score >= 20:

            verdict = "SUSPICIOUS"
            threat_level = "MEDIUM"

        else:

            verdict = "CLEAN"
            threat_level = "LOW"

        # --------------------------------
        # Clean-file explanation
        # --------------------------------

        if not reasons:

            reasons.append(
                "No known malware signature, YARA detection, "
                "or VirusTotal threat was identified"
            )

        return {
            "verdict": verdict,
            "threat_level": threat_level,
            "risk_score": risk_score,
            "reasons": reasons,
            "yara_detected": yara_detected,
            "signature_detected": signature_detected,
            "virustotal_malicious": vt_malicious,
            "virustotal_suspicious": vt_suspicious
        }