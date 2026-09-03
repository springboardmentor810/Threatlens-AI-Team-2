from typing import Any

from sqlalchemy.orm import Session

from app.models.alert import Alert


class AlertService:
    """
    Creates cybersecurity alerts from the final cybersecurity finding.
    """

    def create_alert(
        self,
        db: Session,
        file_id: int,
        final_finding: dict[str, Any]
    ) -> Alert | None:
        """
        Create an alert for suspicious or malicious files.

        Clean files do not generate alerts.
        """

        # ==========================================================
        # EXTRACT FINAL FINDING
        # ==========================================================

        verdict = final_finding.get(
            "verdict",
            "CLEAN"
        )

        threat_level = final_finding.get(
            "threat_level",
            "LOW"
        )

        risk_score = final_finding.get(
            "risk_score",
            0
        )

        reasons = final_finding.get(
            "reasons",
            []
        )

        # ==========================================================
        # CLEAN FILE
        # ==========================================================

        if verdict == "CLEAN":
            return None

        # ==========================================================
        # BUILD REASON TEXT
        # ==========================================================

        if reasons:

            reason_text = "; ".join(
                str(reason)
                for reason in reasons
            )

        else:

            reason_text = (
                "Cybersecurity threat detected."
            )

        # ==========================================================
        # BUILD ALERT MESSAGE
        # ==========================================================

        message = (
            f"{verdict} threat detected. "
            f"Risk score: {risk_score}/100. "
            f"{reason_text}"
        )

        # Database column safety.
        message = message[:500]

        # ==========================================================
        # CREATE ALERT
        # ==========================================================

        alert = Alert(
            file_id=file_id,
            severity=threat_level,
            message=message
        )

        db.add(alert)

        db.commit()

        db.refresh(alert)

        return alert