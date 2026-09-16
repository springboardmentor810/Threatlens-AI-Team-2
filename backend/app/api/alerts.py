from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.alert import Alert
from app.models.user import User
from app.middleware.auth_middleware import get_current_user, require_roles
from app.core.roles import UserRole


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


# ==============================================================
# GET ALERTS
# ==============================================================

@router.get(
    "",
    dependencies=[
        Depends(
            require_roles(
                UserRole.ANALYST,
                UserRole.SECURITY_ANALYST,
                UserRole.ADMIN
            )
        )
    ]
)
def get_alerts(
    db: Session = Depends(get_db)
):
    """
    Return all cybersecurity alerts, newest first.
    """

    alerts = (
        db.query(Alert)
        .order_by(Alert.created_at.desc())
        .all()
    )

    result = []

    for alert in alerts:
        result.append(
            {
                "id": alert.id,
                "file_id": alert.file_id,
                "severity": alert.severity,
                "message": alert.message,
                "created_at": alert.created_at,
                "acknowledged": alert.acknowledged,
                "source": (
                    alert.file.original_filename
                    if alert.file
                    else "Unknown file"
                ),
            }
        )

    return result


# ==============================================================
# ACKNOWLEDGE ALERT
# ==============================================================

@router.patch(
    "/{alert_id}/acknowledge",
    dependencies=[
        Depends(
            require_roles(
                UserRole.ANALYST,
                UserRole.SECURITY_ANALYST,
                UserRole.ADMIN
            )
        )
    ]
)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    """
    Mark an alert as acknowledged.
    """

    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found."
        )

    alert.acknowledged = True

    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert acknowledged successfully.",
        "id": alert.id,
        "acknowledged": alert.acknowledged
    }