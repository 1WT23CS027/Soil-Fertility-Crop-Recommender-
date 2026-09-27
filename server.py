from pathlib import Path
import json
import pickle
import sqlite3

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model.pkl"
CATALOG_PATH = BASE_DIR / "crop_catalog.json"
DB_PATH = BASE_DIR / "agrisense.db"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

app = Flask(__name__)
CORS(app)

with MODEL_PATH.open("rb") as f:
    model = pickle.load(f)

with CATALOG_PATH.open("r", encoding="utf-8") as f:
    CROP_CATALOG = json.load(f)

# The model is the only authority for the recommendation. The catalog only
# enriches the model's crop ID with its display name, description and image.
MODEL_CROPS = {str(label).strip().lower().replace(" ", "") for label in model.classes_}
CATALOG_CROPS = set(CROP_CATALOG)
MISSING_CATALOG = sorted(MODEL_CROPS - CATALOG_CROPS)
if MISSING_CATALOG:
    raise RuntimeError(f"Missing crop catalog entries for model classes: {MISSING_CATALOG}")


def normalize_crop_id(value: object) -> str:
    return "".join(ch for ch in str(value).strip().lower() if ch.isalnum())


def record_analysis(input_df: pd.DataFrame, crop_id: str) -> None:
    """Store the result produced by the current model in the existing history DB."""
    row = input_df.iloc[0]
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS analysis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nitrogen FLOAT NOT NULL,
                phosphorus FLOAT NOT NULL,
                potassium FLOAT NOT NULL,
                ph FLOAT NOT NULL,
                temperature FLOAT NOT NULL,
                humidity FLOAT NOT NULL,
                rainfall FLOAT NOT NULL,
                predicted_crop VARCHAR(50) NOT NULL
            )
            """
        )
        conn.execute(
            """
            INSERT INTO analysis_history
            (nitrogen, phosphorus, potassium, ph, temperature, humidity, rainfall, predicted_crop)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                float(row["N"]),
                float(row["P"]),
                float(row["K"]),
                float(row["ph"]),
                float(row["temperature"]),
                float(row["humidity"]),
                float(row["rainfall"]),
                crop_id,
            ),
        )


def parse_inputs(payload: dict) -> pd.DataFrame:
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object.")

    values = {}
    for feature in FEATURES:
        if feature not in payload:
            raise ValueError(f"Missing required field: {feature}")
        try:
            value = float(payload[feature])
        except (TypeError, ValueError):
            raise ValueError(f"{feature} must be a number.") from None
        if not np.isfinite(value):
            raise ValueError(f"{feature} must be a finite number.")
        values[feature] = value

    return pd.DataFrame([[values[f] for f in FEATURES]], columns=FEATURES)


@app.get("/health")
def health():
    return jsonify({
        "ok": True,
        "model_loaded": model is not None,
        "model_crops": sorted(MODEL_CROPS),
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        input_df = parse_inputs(request.get_json(silent=True))

        # Keep the exact feature order used while training the model.
        raw_prediction = model.predict(input_df)[0]
        crop_id = normalize_crop_id(raw_prediction)

        if crop_id not in CROP_CATALOG:
            return jsonify({
                "success": False,
                "error": f"Model returned an unknown crop: {raw_prediction}",
            }), 500

        probabilities = model.predict_proba(input_df)[0] if hasattr(model, "predict_proba") else None
        confidence = None
        if probabilities is not None:
            confidence = round(float(np.max(probabilities)) * 100, 2)

        crop = CROP_CATALOG[crop_id].copy()
        crop["id"] = crop_id

        # Save exactly the crop returned by this prediction. The database is
        # analysis history, not a second prediction engine.
        record_analysis(input_df, crop_id)

        return jsonify({
            "success": True,
            "crop": crop,
            "confidence": confidence,
            "inputs": {feature: float(input_df.iloc[0][feature]) for feature in FEATURES},
        })

    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
    except Exception as exc:
        app.logger.exception("Prediction failed")
        return jsonify({"success": False, "error": f"Prediction failed: {exc}"}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
