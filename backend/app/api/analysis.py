import json
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.file import File as FileModel
from app.models.analysis import Analysis
from app.models.user import User

from app.services.cybersecurity_service import CybersecurityService
from app.services.alert_service import AlertService

from app.middleware.auth_middleware import require_roles
from app.core.roles import UserRole


router = APIRouter(
    prefix="/analysis",
    tags=["Cybersecurity Analysis"]
)

service = CybersecurityService()
alert_service = AlertService()


@router.post("/{file_id}")
def analyze_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ANALYST,
            UserRole.SECURITY_ANALYST,
            UserRole.ADMIN
        )
    )
):
    """
    Run Part 3 cybersecurity analysis on an uploaded file.
    """

    # 1. Find uploaded file in database
    db_file = db.query(FileModel).filter(
        FileModel.id == file_id
    ).first()

    if not db_file:
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    # 2. Build physical file path
    file_path = os.path.join(
        "uploads",
        db_file.stored_filename
    )

    # 3. Check physical file exists
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found on server."
        )

    # 4. Run cybersecurity analysis
    analysis_result = service.analyze_file(
        file_path=file_path,
        sha256=db_file.sha256,
        md5=db_file.md5
    )

    # 5. Save analysis result to PostgreSQL
    analysis_record = service.save_analysis(
        db=db,
        file_id=db_file.id,
        analysis_result=analysis_result
    )

    # 6. Create alert for suspicious/malicious files
    alert = alert_service.create_alert(
        db=db,
        file_id=db_file.id,
        final_finding=analysis_result["final_finding"]
    )

    # 7. Return complete result
    return {
        "message": "Cybersecurity analysis completed successfully.",
        "analysis_id": analysis_record.id,
        "file_id": db_file.id,
        "analysis_type": analysis_record.analysis_type,
        "result": analysis_result,
        "alert": (
            {
                "alert_id": alert.id,
                "severity": alert.severity,
                "message": alert.message
            }
            if alert
            else None
        )
    }


@router.get("/{file_id}")
def get_analysis(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ANALYST,
            UserRole.SECURITY_ANALYST,
            UserRole.ADMIN
        )
    )
):
    """
    Retrieve the latest cybersecurity analysis
    for an uploaded file.
    """

    analysis_record = (
        db.query(Analysis)
        .filter(
            Analysis.file_id == file_id,
            Analysis.analysis_type == "cybersecurity"
        )
        .order_by(Analysis.id.desc())
        .first()
    )

    if not analysis_record:
        raise HTTPException(
            status_code=404,
            detail="Cybersecurity analysis not found for this file."
        )

    return {
        "analysis_id": analysis_record.id,
        "file_id": analysis_record.file_id,
        "analysis_type": analysis_record.analysis_type,
        "created_at": analysis_record.created_at,
        "result": json.loads(analysis_record.result)
    }