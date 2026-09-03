import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from cybersecurity.yara_scanner import YaraScanner
from cybersecurity.hashing.signature_detector import SignatureDetector

from app.models.analysis import Analysis
from app.services.virustotal_service import VirusTotalService

from cybersecurity.file_analysis.file_validator import validate_file
from cybersecurity.file_analysis.metadata import extract_metadata
from cybersecurity.file_analysis.hashing import calculate_hashes
from cybersecurity.file_analysis.strings import extract_strings
from cybersecurity.file_analysis.pe_analysis import analyze_pe
from cybersecurity.file_analysis.imports import extract_imports

from cybersecurity.suspicious_analysis.url_ip_analysis import (
    extract_urls_and_ips
)
from cybersecurity.suspicious_analysis.ioc_extraction import extract_iocs
from cybersecurity.suspicious_analysis.suspicious_patterns import (
    detect_suspicious_patterns
)
from cybersecurity.suspicious_analysis.api_analysis import analyze_apis
from cybersecurity.suspicious_analysis.feature_extraction import (
    build_security_features
)


class CybersecurityService:
    """
    Complete cybersecurity analysis service.

    Current pipeline:

        File
          |
          +-- Part 1: Static Analysis
          |
          +-- Part 2: Suspicious Activity / IOC Analysis
          |
          +-- YARA Detection
          |
          +-- Signature Detection
          |
          +-- VirusTotal
          |
          +-- Rule-Based Fallback
          |
          +-- Final Finding
          |
          +-- Database / Alert

    ML integration is intentionally left as a placeholder until
    Abhishek's ML model and feature specification are complete.
    """

    def __init__(self):
        self.yara_scanner = YaraScanner()
        self.signature_detector = SignatureDetector()
        self.virustotal_service = VirusTotalService()

    # ==============================================================
    # COMPLETE FILE ANALYSIS
    # ==============================================================

    def analyze_file(
        self,
        file_path: str,
        sha256: str,
        md5: str,
        static_analysis: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:

        # ==========================================================
        # PART 1 - STATIC FILE ANALYSIS
        # ==========================================================

        validation = validate_file(file_path)

        metadata = extract_metadata(file_path)

        hashes = calculate_hashes(file_path)

        extension = validation["extension"].lower()

        # ----------------------------------------------------------
        # PE ANALYSIS
        # ----------------------------------------------------------

        if extension in {".exe", ".dll"}:

            pe_analysis = analyze_pe(file_path)

            imports = extract_imports(file_path)

            strings = extract_strings(file_path)

        else:

            pe_analysis = {
                "headers": {},
                "sections": [],
                "suspicious_characteristics": []
            }

            imports = {
                "dlls": [],
                "apis": []
            }

            strings = []

        # ----------------------------------------------------------
        # INTERNAL STATIC ANALYSIS OBJECT
        # ----------------------------------------------------------

        static_analysis = {
            "file": {
                "filename": metadata["filename"],
                "extension": extension,
                "file_type": metadata["file_type"],
                "size": metadata["size"],
            },

            "validation": validation,

            "metadata": metadata,

            "hashes": hashes,

            "pe_analysis": pe_analysis,

            "imports": imports,

            "strings": strings,
        }

        # ==========================================================
        # PART 2 - SUSPICIOUS ACTIVITY & IOC ANALYSIS
        # ==========================================================

        indicator_result = extract_urls_and_ips(
            static_analysis
        )

        ioc_result = extract_iocs(
            static_analysis,
            indicator_result
        )

        pattern_result = detect_suspicious_patterns(
            static_analysis
        )

        api_result = analyze_apis(
            static_analysis
        )

        # ----------------------------------------------------------
        # BUILD ML-READY SECURITY FEATURES
        # ----------------------------------------------------------

        security_features = build_security_features(
            static_analysis,
            indicator_result,
            ioc_result,
            pattern_result,
            api_result
        )

        # ==========================================================
        # PART 3 - YARA DETECTION
        # ==========================================================

        yara_result = self.yara_scanner.scan_file(
            file_path
        )

        # ==========================================================
        # SIGNATURE DETECTION
        # ==========================================================

        signature_result = self.signature_detector.check_hashes(
            sha256=hashes["sha256"],
            md5=hashes["md5"]
        )

        # ==========================================================
        # VIRUSTOTAL
        # ==========================================================

        virustotal_result = self.virustotal_service.check_hash(
            hashes["sha256"]
        )

        # ==========================================================
        # TEMPORARY RULE-BASED FALLBACK
        # ==========================================================

        # This is NOT the final ML model.
        #
        # It exists only so that the backend can produce a complete
        # result while the ML module is still being developed.

        rule_based_finding = self._generate_rule_based_finding(
            yara_result=yara_result,
            signature_result=signature_result,
            virustotal_result=virustotal_result
        )

        # ==========================================================
        # ML ANALYSIS
        # ==========================================================

        # Abhishek's ML model is not integrated yet.
        #
        # Do NOT calculate another ML score here.
        #
        # When the ML model is ready, this variable will contain
        # the prediction returned by MLService.

        ml_analysis = None

        # ==========================================================
        # FINAL FINDING
        # ==========================================================

        final_finding = self._generate_final_finding(
            rule_based_finding=rule_based_finding,
            ml_analysis=ml_analysis
        )

        # ==========================================================
        # API-FRIENDLY STATIC ANALYSIS
        # ==========================================================

        display_static_analysis = {
            "file": static_analysis["file"],

            "validation": static_analysis["validation"],

            "metadata": static_analysis["metadata"],

            "hashes": static_analysis["hashes"],

            "pe_analysis": static_analysis["pe_analysis"],

            "imports": static_analysis["imports"],

            "strings": {
                "count": len(strings),
                "samples": strings[:20]
            }
        }

        # ==========================================================
        # FINAL RESPONSE
        # ==========================================================

        return {
            "sha256": hashes["sha256"],

            "md5": hashes["md5"],

            "yara": yara_result,

            "signature": signature_result,

            "virustotal": virustotal_result,

            "static_analysis": display_static_analysis,

            "suspicious_analysis": security_features,

            # Temporary fallback result.
            "rule_based_finding": rule_based_finding,

            # None until Abhishek's ML model is integrated.
            "ml_analysis": ml_analysis,

            # This is the finding used by the API and AlertService.
            "final_finding": final_finding
        }

    # ==============================================================
    # FINAL FINDING
    # ==============================================================

    def _generate_final_finding(
        self,
        rule_based_finding: dict[str, Any],
        ml_analysis: Optional[dict[str, Any]] = None
    ) -> dict[str, Any]:
        """
        Generate the final cybersecurity finding.

        CURRENT:
            ML unavailable -> use rule-based fallback.

        FUTURE:
            ML available -> use/combine ML prediction with
            supporting security evidence.
        """

        # ----------------------------------------------------------
        # ML AVAILABLE
        # ----------------------------------------------------------

        if ml_analysis:

            return {
                "verdict": ml_analysis.get(
                    "verdict",
                    rule_based_finding["verdict"]
                ),

                "threat_level": ml_analysis.get(
                    "threat_level",
                    rule_based_finding["threat_level"]
                ),

                "risk_score": ml_analysis.get(
                    "risk_score",
                    rule_based_finding["rule_based_risk_score"]
                ),

                "reasons": ml_analysis.get(
                    "reasons",
                    rule_based_finding["reasons"]
                )
            }

        # ----------------------------------------------------------
        # ML NOT AVAILABLE
        # ----------------------------------------------------------

        return {
            "verdict": rule_based_finding["verdict"],

            "threat_level": rule_based_finding["threat_level"],

            "risk_score": rule_based_finding[
                "rule_based_risk_score"
            ],

            "reasons": rule_based_finding["reasons"]
        }

    # ==============================================================
    # SAVE ANALYSIS
    # ==============================================================

    def save_analysis(
        self,
        db: Session,
        file_id: int,
        analysis_result: dict[str, Any]
    ) -> Analysis:
        """
        Save the complete cybersecurity analysis in PostgreSQL.
        """

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

    # ==============================================================
    # TEMPORARY RULE-BASED DETECTION
    # ==============================================================

    def _generate_rule_based_finding(
        self,
        yara_result: dict[str, Any],
        signature_result: dict[str, Any],
        virustotal_result: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Temporary rule-based fallback.

        This is NOT the ML prediction.

        It is used only until the ML model is integrated.
        """

        # ==========================================================
        # DETECTION FLAGS
        # ==========================================================

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

        # ==========================================================
        # TEMPORARY RULE-BASED SCORE
        # ==========================================================

        risk_score = 0

        if signature_detected:
            risk_score += 60

        if yara_detected:
            risk_score += 25

        if vt_malicious > 0:
            risk_score += 10

        if vt_suspicious > 0:
            risk_score += 5

        risk_score = min(
            risk_score,
            100
        )

        # ==========================================================
        # REASONS
        # ==========================================================

        reasons = []

        # ----------------------------------------------------------
        # SIGNATURE
        # ----------------------------------------------------------

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
                            "Known malware signature detected: "
                            f"{name} ({family})"
                        )

                    else:

                        reasons.append(
                            "Known malware signature detected: "
                            f"{name}"
                        )

            else:

                reasons.append(
                    "Known malware signature detected"
                )

        # ----------------------------------------------------------
        # YARA
        # ----------------------------------------------------------

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

        # ----------------------------------------------------------
        # VIRUSTOTAL MALICIOUS
        # ----------------------------------------------------------

        if vt_malicious > 0:

            reasons.append(
                "VirusTotal detected the file as malicious "
                f"by {vt_malicious} security engine(s)"
            )

        # ----------------------------------------------------------
        # VIRUSTOTAL SUSPICIOUS
        # ----------------------------------------------------------

        if vt_suspicious > 0:

            reasons.append(
                "VirusTotal detected the file as suspicious "
                f"by {vt_suspicious} security engine(s)"
            )

        # ==========================================================
        # VERDICT
        # ==========================================================

        if risk_score >= 50:

            verdict = "MALICIOUS"

            threat_level = "HIGH"

        elif risk_score >= 20:

            verdict = "SUSPICIOUS"

            threat_level = "MEDIUM"

        else:

            verdict = "CLEAN"

            threat_level = "LOW"

        # ==========================================================
        # DEFAULT REASON
        # ==========================================================

        if not reasons:

            reasons.append(
                "No known malware signature, YARA detection, "
                "or VirusTotal threat was identified"
            )

        # ==========================================================
        # RETURN
        # ==========================================================

        return {
            "verdict": verdict,

            "threat_level": threat_level,

            # Explicitly named as rule-based because ML will
            # eventually provide the primary risk score.
            "rule_based_risk_score": risk_score,

            "reasons": reasons,

            "yara_detected": yara_detected,

            "signature_detected": signature_detected,

            "virustotal_malicious": vt_malicious,

            "virustotal_suspicious": vt_suspicious
        }