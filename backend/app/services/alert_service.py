from typing import Any

from sqlalchemy.orm import Session

from app.models.alert import Alert


class AlertService:
    """
    Creates cybersecurity alerts from final analysis findings.
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

        # --------------------------------
        # Do not create alerts for clean files
        # --------------------------------

        if verdict == "CLEAN":
            return None

        # --------------------------------
        # Build alert message
        # --------------------------------

        if reasons:
            reason_text = "; ".join(reasons)
        else:
            reason_text = (
                "Cybersecurity threat detected."
            )

        message = (
            f"{verdict} threat detected. "
            f"Risk score: {risk_score}/100. "
            f"{reason_text}"
        )

        # Keep message within database column limit
        message = message[:500]

        # --------------------------------
        # Create alert
        # --------------------------------

        alert = Alert(
            file_id=file_id,
            severity=threat_level,
            message=message
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        return alert