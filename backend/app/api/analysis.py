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


# ==============================================================
# RUN ANALYSIS
# ==============================================================

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
    Run complete cybersecurity analysis on an uploaded file.
    """

    # ==========================================================
    # 1. FIND FILE IN DATABASE
    # ==========================================================

    db_file = (
        db.query(FileModel)
        .filter(
            FileModel.id == file_id
        )
        .first()
    )

    if not db_file:

        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    # ==========================================================
    # 2. BUILD PHYSICAL FILE PATH
    # ==========================================================

    file_path = os.path.join(
        "uploads",
        db_file.stored_filename
    )

    # ==========================================================
    # 3. CHECK PHYSICAL FILE
    # ==========================================================

    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found on server."
        )

    # ==========================================================
    # 4. RUN CYBERSECURITY ANALYSIS
    # ==========================================================

    try:

        analysis_result = service.analyze_file(
            file_path=file_path,

            sha256=db_file.sha256,

            md5=db_file.md5
        )

    except FileNotFoundError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc)
        )

    except Exception as exc:

        # Keep the actual exception visible during development.
        raise HTTPException(
            status_code=500,
            detail=f"Cybersecurity analysis failed: {str(exc)}"
        )

    # ==========================================================
    # 5. VERIFY FINAL FINDING
    # ==========================================================

    final_finding = analysis_result.get(
        "final_finding"
    )

    if not final_finding:

        raise HTTPException(
            status_code=500,
            detail=(
                "Cybersecurity analysis did not produce "
                "a final finding."
            )
        )

    # ==========================================================
    # 6. SAVE ANALYSIS
    # ==========================================================

    analysis_record = service.save_analysis(
        db=db,

        file_id=db_file.id,

        analysis_result=analysis_result
    )

    # ==========================================================
    # 7. CREATE ALERT
    # ==========================================================

    alert = alert_service.create_alert(
        db=db,

        file_id=db_file.id,

        final_finding=final_finding
    )

    # ==========================================================
    # 8. RETURN COMPLETE RESULT
    # ==========================================================

    return {
        "message": (
            "Cybersecurity analysis completed successfully."
        ),

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


# ==============================================================
# GET LATEST ANALYSIS
# ==============================================================

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

        .order_by(
            Analysis.id.desc()
        )

        .first()
    )

    if not analysis_record:

        raise HTTPException(
            status_code=404,

            detail=(
                "Cybersecurity analysis not found "
                "for this file."
            )
        )

    # ==========================================================
    # LOAD JSON RESULT
    # ==========================================================

    try:

        result = json.loads(
            analysis_record.result
        )

    except (TypeError, json.JSONDecodeError):

        raise HTTPException(
            status_code=500,

            detail=(
                "Stored cybersecurity analysis "
                "contains invalid JSON."
            )
        )

    # ==========================================================
    # RETURN
    # ==========================================================

    return {
        "analysis_id": analysis_record.id,

        "file_id": analysis_record.file_id,

        "analysis_type": analysis_record.analysis_type,

        "created_at": analysis_record.created_at,

        "result": result
    }