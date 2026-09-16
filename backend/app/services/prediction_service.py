from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sqlalchemy.orm import Session

from app.models.prediction import Prediction

# ==============================================================
# ML ENGINE PATHS
# ==============================================================

BASE_DIR = Path(__file__).resolve().parents[3]
ML_ENGINE_DIR = BASE_DIR / "ml-engine"
MODEL_DIR = ML_ENGINE_DIR / "models"

FEATURE_EXTRACTOR_DIR = ML_ENGINE_DIR

BINARY_MODEL_PATH = MODEL_DIR / "final_malware_rf.pkl"
FEATURES_PATH = MODEL_DIR / "final_features.pkl"

FAMILY_MODEL_PATH = MODEL_DIR / "malware_family_rf.pkl"
FAMILY_LABELS_PATH = MODEL_DIR / "family_labels.pkl"


class PredictionService:
    """
    Service responsible for running Abhishek's trained ML models.

    The models are loaded lazily and cached in memory so that the
    large Random Forest files are not loaded for every request.
    """

    _binary_model = None
    _feature_list = None
    _family_model = None
    _family_labels = None

    FINAL_THRESHOLD = 0.45

    # ==========================================================
    # MODEL LOADING
    # ==========================================================

    @classmethod
    def _load_binary_model(cls):
        """Load the malware/benign model only when first required."""

        if cls._binary_model is None:

            if not BINARY_MODEL_PATH.exists():
                raise FileNotFoundError(
                    f"Binary ML model not found: {BINARY_MODEL_PATH}"
                )

            if not FEATURES_PATH.exists():
                raise FileNotFoundError(
                    f"Feature specification not found: {FEATURES_PATH}"
                )

            cls._binary_model = joblib.load(
                BINARY_MODEL_PATH
            )

            cls._feature_list = joblib.load(
                FEATURES_PATH
            )

        return cls._binary_model

    @classmethod
    def _load_family_model(cls):
        """Load the malware-family model only when required."""

        if cls._family_model is None:

            if not FAMILY_MODEL_PATH.exists():
                raise FileNotFoundError(
                    f"Family ML model not found: {FAMILY_MODEL_PATH}"
                )

            if not FAMILY_LABELS_PATH.exists():
                raise FileNotFoundError(
                    f"Family labels not found: {FAMILY_LABELS_PATH}"
                )

            cls._family_model = joblib.load(
                FAMILY_MODEL_PATH
            )

            cls._family_labels = joblib.load(
                FAMILY_LABELS_PATH
            )

        return cls._family_model

    # ==========================================================
    # FEATURE EXTRACTION
    # ==========================================================

    @staticmethod
    def _extract_features(file_path: str) -> dict[str, Any]:
        """
        Use Abhishek's exact feature extractor.

        The model was trained using this extractor, so we must not
        recreate or modify the feature calculations here.
        """

        import sys

        ml_engine_path = str(
            FEATURE_EXTRACTOR_DIR
        )

        if ml_engine_path not in sys.path:
            sys.path.insert(
                0,
                ml_engine_path
            )

        from feature_extractor import extract_model_features

        features = extract_model_features(
            file_path
        )

        if not isinstance(features, dict):
            raise TypeError(
                "Feature extractor must return a dictionary."
            )

        return features

    # ==========================================================
    # PREDICTION
    # ==========================================================

    @classmethod
    def predict_file(
        cls,
        file_path: str
    ) -> dict[str, Any]:
        """
        Run binary malware classification and, when malicious,
        malware-family classification.
        """

        # ------------------------------------------------------
        # EXTRACT FEATURES
        # ------------------------------------------------------

        features = cls._extract_features(
            file_path
        )

        # ------------------------------------------------------
        # LOAD BINARY MODEL
        # ------------------------------------------------------

        binary_model = cls._load_binary_model()

        feature_list = cls._feature_list

        if not feature_list:
            raise ValueError(
                "ML feature list is empty."
            )

        missing_features = [
            feature
            for feature in feature_list
            if feature not in features
        ]

        if missing_features:
            raise ValueError(
                "Missing ML features: "
                + ", ".join(missing_features)
            )

        # ------------------------------------------------------
        # CREATE MODEL INPUT
        # ------------------------------------------------------

        X = pd.DataFrame(
            [
                {
                    feature: features[feature]
                    for feature in feature_list
                }
            ]
        )

        # ------------------------------------------------------
        # MALWARE PROBABILITY
        # ------------------------------------------------------

        probabilities = binary_model.predict_proba(
            X
        )[0]

        # Abhishek's model uses classes [0, 1].
        # Class 1 represents malware.
        classes = list(
            binary_model.classes_
        )

        if 1 not in classes:
            raise ValueError(
                "Binary ML model does not contain class 1."
            )

        malware_index = classes.index(1)

        malware_probability = float(
            probabilities[malware_index]
        )

        # ------------------------------------------------------
        # BINARY PREDICTION
        # ------------------------------------------------------

        if malware_probability >= cls.FINAL_THRESHOLD:

            prediction = "Malware"

        else:

            prediction = "Benign"

        # ------------------------------------------------------
        # RISK LEVEL
        # ------------------------------------------------------

        if malware_probability < 0.30:

            risk_level = "Low"

        elif malware_probability < 0.70:

            risk_level = "Medium"

        else:

            risk_level = "High"

        # ------------------------------------------------------
        # FAMILY CLASSIFICATION
        # ------------------------------------------------------

        malware_family = None
        family_probability = None

        if prediction == "Malware":

            family_model = cls._load_family_model()

            family_probabilities = family_model.predict_proba(
                X
            )[0]

            family_index = int(
                family_probabilities.argmax()
            )

            family_probability = float(
                family_probabilities[family_index]
            )

            family_class = family_model.classes_[
                family_index
            ]

            malware_family = str(
                family_class
            )

        # ------------------------------------------------------
        # RESULT
        # ------------------------------------------------------

        return {
            "prediction": prediction,

            "malware_probability": round(
                malware_probability,
                4
            ),

            "risk_level": risk_level,

            "malware_family": malware_family,

            "family_probability": (
                round(
                    family_probability,
                    4
                )
                if family_probability is not None
                else None
            )
        }

    # ==========================================================
    # SAVE PREDICTION
    # ==============================================================

    @staticmethod
    def save_prediction(
        db: Session,
        file_id: int,
        prediction_result: dict[str, Any]
    ) -> Prediction:
        """
        Save the ML prediction to the existing predictions table.
        """

        predicted_class = prediction_result[
            "prediction"
        ]

        malware_probability = float(
            prediction_result[
                "malware_probability"
            ]
        )

        # Confidence means confidence in the predicted class.
        if predicted_class == "Malware":

            confidence_score = malware_probability

        else:

            confidence_score = 1.0 - malware_probability

        prediction_record = Prediction(
            file_id=file_id,

            predicted_class=predicted_class,

            confidence_score=round(
                confidence_score,
                4
            )
        )

        db.add(
            prediction_record
        )

        db.commit()

        db.refresh(
            prediction_record
        )

        return prediction_record