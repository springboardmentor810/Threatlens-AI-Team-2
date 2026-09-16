import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.file import File
from app.models.user import User
from app.models.analysis import Analysis
from app.services.alert_service import AlertService
from app.services.cybersecurity_service import CybersecurityService
from app.middleware.auth_middleware import get_current_user, require_roles
from app.core.roles import UserRole


router = APIRouter(
    prefix="/analysis",
    tags=["Analysis"]
)

service = CybersecurityService()
alert_service = AlertService()


# ==============================================================
# UPLOAD DIRECTORY
# ==============================================================

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_FOLDER = BASE_DIR / "uploads"


# ==============================================================
# RUN CYBERSECURITY ANALYSIS
# ==============================================================

@router.post(
    "/{file_id}",
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
def analyze_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run complete cybersecurity analysis for an uploaded file.

    Pipeline:
        Static Analysis
        -> Suspicious Analysis
        -> YARA
        -> Signature Detection
        -> VirusTotal
        -> ML Prediction
        -> Final Finding
        -> Database
        -> Alert
    """

    # ==========================================================
    # GET FILE
    # ==========================================================

    db_file = (
        db.query(File)
        .filter(File.id == file_id)
        .first()
    )

    if not db_file:
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    # ==========================================================
    # BUILD PHYSICAL FILE PATH
    # ==========================================================

    file_path = UPLOAD_FOLDER / db_file.stored_filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Uploaded file does not exist on the server."
        )

    # ==========================================================
    # RUN CYBERSECURITY ANALYSIS
    # ==========================================================

    try:
        analysis_result = service.analyze_file(
            str(file_path),
            db_file.sha256,
            db_file.md5
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cybersecurity analysis failed: {str(exc)}"
        )

    # ==========================================================
    # VALIDATE FINAL FINDING
    # ==========================================================

    final_finding = analysis_result.get(
        "final_finding"
    )

    if not final_finding:
        raise HTTPException(
            status_code=500,
            detail="Analysis completed without a final finding."
        )

    # ==========================================================
    # SAVE COMPLETE ANALYSIS
    # ==========================================================

    try:
        analysis_record = service.save_analysis(
            db,
            file_id,
            analysis_result
        )

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save analysis: {str(exc)}"
        )

    # ==========================================================
    # SAVE ML PREDICTION
    # ==========================================================

    ml_analysis = analysis_result.get(
        "ml_analysis"
    )

    if (
        ml_analysis
        and ml_analysis.get("prediction") is not None
        and ml_analysis.get("malware_probability") is not None
    ):
        try:
            service.prediction_service.save_prediction(
                db,
                file_id,
                ml_analysis
            )

        except Exception as exc:
            db.rollback()

            raise HTTPException(
                status_code=500,
                detail=f"Failed to save ML prediction: {str(exc)}"
            )

    # ==========================================================
    # CREATE ALERT
    # ==========================================================

    try:
        alert = alert_service.create_alert(
            db,
            file_id,
            final_finding
        )

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to create alert: {str(exc)}"
        )

    # ==========================================================
    # RESPONSE
    # ==========================================================

    return {
        "message": "Cybersecurity analysis completed successfully.",
        "analysis_id": analysis_record.id,
        "file_id": file_id,
        "analysis_type": "cybersecurity",
        "result": analysis_result,
        "alert": alert
    }


# ==============================================================
# GET ANALYSIS HISTORY
# ==============================================================

@router.get(
    "/history",
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
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the latest cybersecurity analysis for every analyzed file.

    Returns records suitable for the Scan History page.
    """

    # ==========================================================
    # GET ALL ANALYZED FILES
    # ==========================================================

    files = (
        db.query(File)
        .join(
            Analysis,
            Analysis.file_id == File.id
        )
        .order_by(
            Analysis.created_at.desc()
        )
        .all()
    )

    history = []
    seen_file_ids = set()

    # ==========================================================
    # BUILD ONE RECORD PER FILE
    # ==========================================================

    for db_file in files:

        # Only keep the latest analysis for each file.
        if db_file.id in seen_file_ids:
            continue

        seen_file_ids.add(db_file.id)

        analysis_record = (
            db.query(Analysis)
            .filter(
                Analysis.file_id == db_file.id
            )
            .order_by(
                Analysis.created_at.desc()
            )
            .first()
        )

        if not analysis_record:
            continue

        # ======================================================
        # PARSE ANALYSIS RESULT
        # ======================================================

        try:
            result = json.loads(
                analysis_record.result
            )

        except (json.JSONDecodeError, TypeError):
            result = {}

        # ======================================================
        # GET FINAL FINDING
        # ======================================================

        final_finding = result.get(
            "final_finding",
            {}
        )

        ml_analysis = result.get(
            "ml_analysis",
            {}
        )

        # ======================================================
        # RISK SCORE
        # ======================================================

        risk_score = final_finding.get(
            "risk_score"
        )

        if risk_score is None:
            malware_probability = ml_analysis.get(
                "malware_probability"
            )

            if malware_probability is not None:
                risk_score = round(
                    float(malware_probability) * 100
                )
            else:
                risk_score = 0

        risk_score = max(
            0,
            min(
                100,
                int(risk_score)
            )
        )

        # ======================================================
        # STATUS / SEVERITY
        # ======================================================

        if risk_score >= 76:
            status = "critical"
        elif risk_score >= 51:
            status = "high"
        elif risk_score >= 26:
            status = "medium"
        else:
            status = "low"

        # ======================================================
        # VERDICT
        # ======================================================

        verdict = (
            final_finding.get("verdict")
            or ml_analysis.get("prediction")
            or "UNKNOWN"
        )

        # ======================================================
        # ANALYST
        # ======================================================

        analyst = "Auto-scan"

        if db_file.uploader:
            analyst = (
                db_file.uploader.full_name
                or db_file.uploader.username
                or db_file.uploader.email
                or "Auto-scan"
            )

        # ======================================================
        # RESPONSE RECORD
        # ======================================================

        history.append(
            {
                "analysis_id": analysis_record.id,
                "file_id": db_file.id,
                "file": db_file.original_filename,
                "hash": db_file.sha256 or "",
                "verdict": verdict,
                "risk": risk_score,
                "status": status,
                "analyst": analyst,
                "scanned_at": analysis_record.created_at
            }
        )

    return history


# ==============================================================
# GET LATEST ANALYSIS FOR FILE
# ==============================================================

@router.get(
    "/{file_id}",
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
def get_analysis(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the latest cybersecurity analysis for a file.
    """

    # ==========================================================
    # CHECK FILE EXISTS
    # ==========================================================

    db_file = (
        db.query(File)
        .filter(File.id == file_id)
        .first()
    )

    if not db_file:
        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    # ==========================================================
    # GET LATEST ANALYSIS
    # ==========================================================

    analysis_record = (
        db.query(Analysis)
        .filter(
            Analysis.file_id == file_id
        )
        .order_by(
            Analysis.created_at.desc()
        )
        .first()
    )

    if not analysis_record:
        raise HTTPException(
            status_code=404,
            detail="No analysis found for this file."
        )

    # ==========================================================
    # PARSE STORED JSON
    # ==========================================================

    try:
        result = json.loads(
            analysis_record.result
        )

    except (json.JSONDecodeError, TypeError):
        result = analysis_record.result

    # ==========================================================
    # RESPONSE
    # ==========================================================

    return {
        "analysis_id": analysis_record.id,
        "file_id": file_id,
        "analysis_type": analysis_record.analysis_type,
        "created_at": analysis_record.created_at,
        "result": result
    }