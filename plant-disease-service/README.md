# KrishiSetu Crop Disease Inference Microservice

This standalone Python FastAPI microservice runs an open-source PlantVillage image classification model so the Java Spring Boot backend (or Express sandbox runtime) can classify uploaded leaf images without exposing credentials or fabricating diagnoses.

## Compatible Open-Source Model

- Default Hugging Face model: `linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification` (MobileNetV2 trained on the 38-class PlantVillage dataset).
- Supported crop classes in this domain: Tomato, Potato, Maize/Corn, Apple, Cherry, Grape, Orange, Peach, Bell Pepper/Capsicum, Raspberry, Soybean, Squash, Strawberry.
- Crops outside this label set (for example Ragi, Tur Dal, Groundnut, Paddy, Sugarcane) are explicitly returned as `UNSUPPORTED_CROP` so the system never guesses a wrong crop disease.

## Local Setup

```bash
cd plant-disease-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Optional shared secret between Spring Boot / Express and this Python service
export PLANT_DISEASE_INFERENCE_API_KEY="replace_with_shared_secret"

uvicorn app:app --host 0.0.0.0 --port 8001
```

Then configure the backend environment:

```bash
export PLANT_DISEASE_INFERENCE_URL="http://localhost:8001"
export PLANT_DISEASE_INFERENCE_API_KEY="replace_with_shared_secret"
```

## API Contract (`POST /predict`)

- Request: `multipart/form-data` with fields `image` (JPEG/PNG/WebP file) and optional `cropCode`
- Optional Header: `X-API-Key` when `PLANT_DISEASE_INFERENCE_API_KEY` is configured
- Status values returned:
  - `PREDICTION_READY`: Validated image, supported crop, confidence >= threshold (`0.60`)
  - `UNCERTAIN_LOW_CONFIDENCE`: Confidence below threshold
  - `UNCERTAIN_POOR_QUALITY`: Blurry, dark, overexposed, or resolution below 128x128px
  - `UNSUPPORTED_CROP`: Selected crop is outside the PlantVillage 38-class domain
