"""KrishiSetu Plant Disease Classification Microservice.

Runs inference using an open-source PlantVillage image classification model
(default: linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification)
and enforces image-quality, crop-support, and confidence thresholds before
returning predictions to the Java Spring Boot / Node backend.
"""

from __future__ import annotations

import io
import os
from typing import Any, Optional

import numpy as np
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from PIL import Image, ImageStat

MODEL_ID = os.getenv(
    "PLANT_DISEASE_MODEL_ID",
    "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
)
CONFIDENCE_THRESHOLD = float(os.getenv("PLANT_DISEASE_CONFIDENCE_THRESHOLD", "0.60"))
MIN_DIMENSION_PX = int(os.getenv("PLANT_DISEASE_MIN_DIMENSION_PX", "128"))
MIN_SHARPNESS_SCORE = float(os.getenv("PLANT_DISEASE_MIN_SHARPNESS", "45.0"))
SERVICE_API_KEY = os.getenv("PLANT_DISEASE_INFERENCE_API_KEY", "").strip()

# Crops covered by the standard 38-class PlantVillage dataset
PLANTVILLAGE_SUPPORTED_CROPS = {
    "tomato",
    "potato",
    "maize",
    "corn",
    "apple",
    "cherry",
    "grape",
    "orange",
    "peach",
    "pepper",
    "bell-pepper",
    "capsicum",
    "raspberry",
    "soybean",
    "squash",
    "strawberry",
}

app = FastAPI(title="KrishiSetu Plant Disease Inference Service", version="1.0.0")

_classifier = None
_model_load_error: Optional[str] = None


def get_classifier():
    global _classifier, _model_load_error
    if _classifier is not None:
        return _classifier
    if _model_load_error is not None:
        raise RuntimeError(_model_load_error)
    try:
        from transformers import pipeline

        _classifier = pipeline("image-classification", model=MODEL_ID)
        return _classifier
    except Exception as exc:  # pragma: no cover - runtime dependency loading
        _model_load_error = f"Failed to load model '{MODEL_ID}': {exc}"
        raise RuntimeError(_model_load_error) from exc


def assess_image_quality(image: Image.Image) -> tuple[bool, Optional[str], dict[str, Any]]:
    width, height = image.size
    metrics: dict[str, Any] = {"width": width, "height": height}

    if width < MIN_DIMENSION_PX or height < MIN_DIMENSION_PX:
        return (
            False,
            f"Image resolution ({width}x{height}px) is below minimum {MIN_DIMENSION_PX}x{MIN_DIMENSION_PX}px.",
            metrics,
        )

    gray = image.convert("L")
    stat = ImageStat.Stat(gray)
    mean_brightness = float(stat.mean[0])
    metrics["brightness"] = round(mean_brightness, 2)

    if mean_brightness < 25.0:
        return False, "Image is too dark to reliably inspect leaf symptoms.", metrics
    if mean_brightness > 240.0:
        return False, "Image is heavily overexposed to inspect leaf symptoms.", metrics

    arr = np.asarray(gray, dtype=np.float32)
    # Discrete Laplacian variance proxy for focus/sharpness
    lap = (
        arr[1:-1, 1:-1] * -4.0
        + arr[:-2, 1:-1]
        + arr[2:, 1:-1]
        + arr[1:-1, :-2]
        + arr[1:-1, 2:]
    )
    sharpness = float(np.var(lap))
    metrics["sharpness"] = round(sharpness, 2)

    if sharpness < MIN_SHARPNESS_SCORE:
        return (
            False,
            "Image appears too blurry or out of focus. Capture a sharp close-up of a single leaf.",
            metrics,
        )

    return True, None, metrics


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "UP",
        "modelId": MODEL_ID,
        "confidenceThreshold": CONFIDENCE_THRESHOLD,
        "supportedCrops": sorted(PLANTVILLAGE_SUPPORTED_CROPS),
    }


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    cropCode: Optional[str] = Form(default=None),
    x_api_key: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    if SERVICE_API_KEY and x_api_key != SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid inference service API key.")

    normalized_crop = (cropCode or "").strip().lower()
    if normalized_crop and normalized_crop not in PLANTVILLAGE_SUPPORTED_CROPS:
        return {
            "status": "UNSUPPORTED_CROP",
            "modelId": MODEL_ID,
            "cropCode": normalized_crop,
            "predictedLabel": None,
            "confidence": None,
            "reason": (
                f"Crop '{normalized_crop}' is outside the 38-class PlantVillage training domain "
                f"used by {MODEL_ID}."
            ),
            "topCandidates": [],
        }

    raw_bytes = await image.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image file is empty.")

    try:
        pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid or unreadable image file.") from exc

    ok_quality, quality_reason, quality_metrics = assess_image_quality(pil_img)
    if not ok_quality:
        return {
            "status": "UNCERTAIN_POOR_QUALITY",
            "modelId": MODEL_ID,
            "cropCode": normalized_crop or None,
            "predictedLabel": None,
            "confidence": None,
            "reason": quality_reason,
            "qualityMetrics": quality_metrics,
            "topCandidates": [],
        }

    try:
        clf = get_classifier()
        predictions = clf(pil_img, top_k=3)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not predictions:
        return {
            "status": "UNCERTAIN_LOW_CONFIDENCE",
            "modelId": MODEL_ID,
            "cropCode": normalized_crop or None,
            "predictedLabel": None,
            "confidence": None,
            "reason": "Model returned no candidate labels.",
            "qualityMetrics": quality_metrics,
            "topCandidates": [],
        }

    top = predictions[0]
    top_label = str(top.get("label", ""))
    top_score = float(top.get("score", 0.0))
    candidates = [
        {"label": str(p.get("label", "")), "confidence": round(float(p.get("score", 0.0)), 4)}
        for p in predictions
    ]

    if top_score < CONFIDENCE_THRESHOLD:
        return {
            "status": "UNCERTAIN_LOW_CONFIDENCE",
            "modelId": MODEL_ID,
            "cropCode": normalized_crop or None,
            "predictedLabel": top_label,
            "confidence": round(top_score, 4),
            "reason": (
                f"Top model confidence ({round(top_score * 100, 1)}%) is below threshold "
                f"({round(CONFIDENCE_THRESHOLD * 100, 1)}%). Consult a local expert before treatment."
            ),
            "qualityMetrics": quality_metrics,
            "topCandidates": candidates,
        }

    return {
        "status": "PREDICTION_READY",
        "modelId": MODEL_ID,
        "cropCode": normalized_crop or None,
        "predictedLabel": top_label,
        "confidence": round(top_score, 4),
        "reason": None,
        "qualityMetrics": quality_metrics,
        "topCandidates": candidates,
    }
