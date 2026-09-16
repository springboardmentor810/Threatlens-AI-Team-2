import joblib
import pandas as pd
from pathlib import Path

from feature_extractor import (
    extract_model_features,
    generate_static_report
)
# Project directory
BASE_DIR = Path(__file__).resolve().parent

# Model paths
BINARY_MODEL_PATH = BASE_DIR / "models" / "final_malware_rf.pkl"
FEATURES_PATH = BASE_DIR / "models" / "final_features.pkl"
FAMILY_MODEL_PATH = BASE_DIR / "models" / "malware_family_rf.pkl"
FAMILY_LABELS_PATH = BASE_DIR / "models" / "family_labels.pkl"

# Load models and artifacts
binary_model = joblib.load(BINARY_MODEL_PATH)
feature_list = joblib.load(FEATURES_PATH)

family_model = joblib.load(FAMILY_MODEL_PATH)
family_labels = joblib.load(FAMILY_LABELS_PATH)

FINAL_THRESHOLD = 0.45

# --------------------------------------------------
# Risk classification
# --------------------------------------------------

def get_risk_level(probability):

    if probability < 0.30:
        return "Low"

    elif probability < 0.70:
        return "Medium"

    else:
        return "High"


# --------------------------------------------------
# Unified prediction
# --------------------------------------------------

def predict_from_features(features):

    # Convert dictionary to DataFrame
    if isinstance(features, dict):
        features = pd.DataFrame([features])

    # Check required features
    missing_features = [
        feature
        for feature in feature_list
        if feature not in features.columns
    ]

    if missing_features:
        raise ValueError(
            f"Missing required features: {missing_features}"
        )

    # Keep only the features used by the binary model
    input_data = features[feature_list]


    # --------------------------------------------------
    # Stage 1: Binary malware detection
    # --------------------------------------------------

    malware_probability = binary_model.predict_proba(
        input_data
    )[0, 1]

    prediction = (
        "Malware"
        if malware_probability >= FINAL_THRESHOLD
        else "Benign"
    )

    risk_level = get_risk_level(
        malware_probability
    )


    # --------------------------------------------------
    # Stage 2: Malware family classification
    # --------------------------------------------------

    malware_family = None
    family_probability = None

    if prediction == "Malware":

        family_probabilities = family_model.predict_proba(
            input_data
        )[0]

        family_index = family_probabilities.argmax()

        malware_family = family_model.classes_[family_index]

        family_probability = family_probabilities[
            family_index
        ]


    # --------------------------------------------------
    # Final result
    # --------------------------------------------------

    return {
        "prediction": prediction,
        "malware_probability": round(
            float(malware_probability),
            4
        ),
        "risk_level": risk_level,
        "malware_family": malware_family,
        "family_probability": (
            round(float(family_probability), 4)
            if family_probability is not None
            else None
        )
    }

def predict_from_file(file_path):
    """
    Run the complete malware classification pipeline
    directly on a Windows PE file.
    """

    # Extract the 25 model features
    features = extract_model_features(file_path)

    # Reuse the existing prediction pipeline
    return predict_from_features(features)

def generate_security_report(file_path):
    """
    Generate a complete malware security report.

    Combines static analysis, YARA findings,
    malware detection, risk assessment, and
    malware family classification.
    """
    static_report = generate_static_report(file_path)

    ml_result = predict_from_file(file_path)

    static_report["ml_classification"] = {
        "prediction": ml_result["prediction"],
        "malware_probability": ml_result["malware_probability"],
        "risk_level": ml_result["risk_level"],
        "malware_family": ml_result["malware_family"],
        "family_probability": ml_result["family_probability"]
    }

    static_report["overall_assessment"] = (
        get_overall_assessment(static_report)
    )

    static_report["summary"] = (
        generate_report_summary(static_report)
    )

    return static_report

def get_overall_assessment(report):
    """
    Combine ML classification and static-analysis evidence
    into a conservative overall security assessment.
    """

    ml = report["ml_classification"]

    yara_findings = report["yara_findings"]

    indicators = report["suspicious_indicators"]

    has_yara = len(yara_findings) > 0

    has_indicators = any(
        len(values) > 0
        for values in indicators.values()
    )

    if ml["prediction"] == "Malware":
        assessment = "Threat Detected"

    elif has_yara or has_indicators:
        assessment = "Suspicious"

    else:
        assessment = "Clean"

    return assessment

def generate_report_summary(report):
    """
    Generate a concise summary of the security analysis.
    """

    ml = report["ml_classification"]

    yara_count = len(
        report["yara_findings"]
    )

    indicator_count = sum(
        len(values)
        for values in report[
            "suspicious_indicators"
        ].values()
    )

    suspicious_api_count = sum(
        len(apis)
        for apis in report[
            "api_analysis"
        ]["suspicious_apis"].values()
    )

    return {
        "overall_assessment": report[
            "overall_assessment"
        ],
        "risk_level": ml["risk_level"],
        "malware_probability": ml[
            "malware_probability"
        ],
        "yara_match_count": yara_count,
        "suspicious_indicator_count": indicator_count,
        "suspicious_api_count": suspicious_api_count
    }