# KrishiSetu — Bilingual Smart Agriculture Decision-Support Platform

KrishiSetu is a bilingual (English & Kannada) farm intelligence and agricultural services platform covering five farmer modules (**Crop & Soil Intelligence**, **Plant Health & Protection**, **Market & Weather**, **Agricultural Services**, and **AI Farmer Assistant**) alongside a role-restricted **Administrator Console**.

---

## Architecture Overview

1. **Frontend (`src/`)**: React 19, TypeScript, Tailwind CSS v4, i18next (`en` / `kn`), Recharts, and Leaflet + OpenStreetMap.
2. **Primary Production Backend (`backend/`)**: Java 21 + Spring Boot 3.4.2 + Spring Security (JWT + BCrypt) + Spring Data JPA + PostgreSQL.
3. **Integrated Dev Preview Runtime (`server.ts`, `server/*.ts`)**: Express + Vite middleware runtime on port `3000` providing API parity backed by `.data/krishisetu.db.json` for rapid single-command preview without requiring local PostgreSQL/JVM setup.
4. **Optional Leaf Disease Inference Microservice (`plant-disease-service/`)**: Python FastAPI + PyTorch/Transformers PlantVillage classifier (`app.py`).

> **Scope Note**: SMS OTP and WhatsApp messaging remain intentionally deferred to a future phase and are never simulated.

---

## Quick Start (Node/Vite Integrated Runtime on Port 3000)

### Prerequisites
- Node.js `20+` and npm

### Setup & Run
```bash
npm install
cp .env.example .env
# Edit .env to add GEMINI_API_KEY and optionally DATA_GOV_IN_API_KEY / PLANT_DISEASE_INFERENCE_URL
npm run dev
```
Open `http://localhost:3000`.

Production build check:
```bash
npm run lint
npm run build
```

---

## Full Production Stack Setup (PostgreSQL + Spring Boot + React)

### Prerequisites
- Java `21` (`JDK 21`)
- Apache Maven `3.9+`
- PostgreSQL `15+`
- Node.js `20+`
- Python `3.10+` (optional, only if connecting live leaf-disease image inference)

### 1. Database Configuration (PostgreSQL)
Create a database and user:
```sql
CREATE DATABASE krishisetu;
CREATE USER krishisetu_user WITH ENCRYPTED PASSWORD 'your_strong_local_password';
GRANT ALL PRIVILEGES ON DATABASE krishisetu TO krishisetu_user;
```

Spring Boot configuration (`backend/src/main/resources/application.yml`) reads:
- `SPRING_DATASOURCE_URL` (default: `jdbc:postgresql://localhost:5432/krishisetu`)
- `SPRING_DATASOURCE_USERNAME` (default: `krishisetu_user`)
- `SPRING_DATASOURCE_PASSWORD` (default: `change_this_local_password`)

Hibernate (`ddl-auto: update`) initializes all tables automatically on first boot, and `DataInitializer` seeds the baseline administrator, sample farmer, curated crop/soil dataset, verified pest alerts, prevention guides, and services directory (`SEED_DEMO_DATA=true`).

### 2. Run Spring Boot Backend (Port 8080)
```bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/krishisetu"
export SPRING_DATASOURCE_USERNAME="krishisetu_user"
export SPRING_DATASOURCE_PASSWORD="your_strong_local_password"
export JWT_SECRET_KEY="$(openssl rand -base64 32)"
export GEMINI_API_KEY="your_google_ai_studio_key"
# Optional integrations:
export DATA_GOV_IN_API_KEY="your_data_gov_in_key"
export PLANT_DISEASE_INFERENCE_URL="http://localhost:8001"

cd backend
mvn spring-boot:run
```

### 3. Run Frontend Pointed at Spring Boot
Set `VITE_API_BASE_URL` in `.env` (or environment):
```bash
VITE_API_BASE_URL="http://localhost:8080" npm run dev
```

---

## Environment Variables (`.env.example`)

Never commit `.env` or secret values (`.gitignore` excludes `.env*` while keeping `!.env.example` and ignores `.data/`).

| Variable | Backend | Description |
| --- | --- | --- |
| `JWT_SECRET` / `JWT_SECRET_KEY` | Node / Spring | Signing key for JWT authentication tokens (256-bit+ Base64 in Spring). |
| `GEMINI_API_KEY` | Both | Server-side key for Google Gemini AI Farmer Assistant (never exposed to browser). |
| `GEMINI_MODEL` | Both | Gemini model alias (defaults to `gemini-4-hydrogen`). |
| `DATA_GOV_IN_API_KEY` | Both | Server-side API key from `data.gov.in` for live Agmarknet mandi price queries. |
| `DATA_GOV_IN_MANDI_RESOURCE_ID` | Both | Daily mandi resource UUID (default `9ef84268-d588-465a-a308-a864a43d0070`). |
| `DATA_GOV_IN_HISTORY_RESOURCE_ID` | Both | Variety-wise historical mandi resource UUID (`35985678-0d79-46b4-9ed6-6f13308a1d24`). |
| `OPEN_METEO_FORECAST_URL` | Both | Forecast endpoint (`https://api.open-meteo.com/v1/forecast`). |
| `OPEN_METEO_GEOCODING_URL` | Both | Geocoding endpoint (`https://geocoding-api.open-meteo.com/v1/search`). |
| `PLANT_DISEASE_INFERENCE_URL` | Both | Base URL of Python FastAPI disease scanner microservice (e.g. `http://localhost:8001`). |
| `PLANT_DISEASE_INFERENCE_API_KEY` | Both | Optional shared token sent to Python inference service via header. |
| `VITE_API_BASE_URL` | Frontend | Empty for same-origin `/api/v1` proxy, or `http://localhost:8080` for standalone Spring Boot. |
| `SPRING_DATASOURCE_*` | Spring | PostgreSQL JDBC URL, username, and password. |
| `CORS_ALLOWED_ORIGINS` | Spring | Comma-separated allowed browser origins (`http://localhost:3000,http://localhost:5173`). |

---

## External API Registration & Model Setup

### 1. Google Gemini AI (AI Farmer Assistant)
1. Visit [Google AI Studio](https://aistudio.google.com/) and create an API key.
2. Add `GEMINI_API_KEY=...` to your backend `.env` or environment variables.
3. Free-tier rate limits apply per minute and per day. When the key is omitted or quota/upstream spikes (`429` / `503`), KrishiSetu keeps all other dashboard modules working and displays an honest retry/setup message.

### 2. data.gov.in Agmarknet API (Mandi Market Prices)
1. Register a free account at [https://data.gov.in/](https://data.gov.in/) and generate an OGD API key from your profile dashboard.
2. Add `DATA_GOV_IN_API_KEY=...` to your backend environment.
3. Without this key, KrishiSetu explicitly reports `API_KEY_MISSING` and never displays fabricated prices. Historical charts require at least 2 distinct dated Agmarknet records (via live sync or Admin entry).

### 3. Open-Meteo Weather & Geocoding
- Uses the public non-commercial Open-Meteo API (`CC BY 4.0` attribution shown in UI) and requires no API key.

### 4. Leaf Disease Classification Microservice (`plant-disease-service/`)
1. Install Python dependencies and start the inference server:
   ```bash
   cd plant-disease-service
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app:app --host 0.0.0.0 --port 8001
   ```
2. Set `PLANT_DISEASE_INFERENCE_URL="http://localhost:8001"` in the backend environment and restart the backend.
3. See `plant-disease-service/README.md` for supported PlantVillage 38-class crop domains, confidence thresholds, and quality checks. When disconnected, KrishiSetu displays an honest unavailable notice and never fabricates diagnoses.

---

## Security & Demo Access

Seeded accounts (`SEED_DEMO_DATA=true` / initial `.data/krishisetu.db.json`):
- **Farmer Portal**: `ramesh.farmer@krishisetu.in` / `Farmer@123`
- **Admin Portal** (`/admin` login route): `admin@krishisetu.in` / `Admin@123`

Security controls implemented:
- Passwords hashed with **BCrypt** (Spring Boot) and **scrypt + per-user random salt + timing-safe comparison** (Node runtime).
- Role-based authorization enforced server-side (`hasRole('ADMIN')` + `@PreAuthorize("hasRole('ADMIN')")` in Spring Security, `requireAuth` + `requireAdmin` in Express) across all `/api/v1/admin/**` routes.
- Deactivated farmer accounts (`active = false`) are rejected immediately at login and during JWT session verification.
- Farmer lists in Admin views mask email addresses and omit raw passwords, tokens, and unnecessary personal notes.
- API keys (`GEMINI_API_KEY`, `DATA_GOV_IN_API_KEY`, `PLANT_DISEASE_INFERENCE_API_KEY`) live strictly on the backend and are never sent to browser clients.

---

## Troubleshooting

- **Port `3000` already in use**: Stop any existing Vite/Node process or restart cleanly (`npm run dev`).
- **Mandi Prices shows "API Key Not Configured"**: Set `DATA_GOV_IN_API_KEY` in the backend `.env` and restart the backend, or import verified bulletins through the Admin Console (`Market & Weather Status`).
- **AI Assistant returns HTTP `503` temporarily**: Gemini free-tier / upstream capacity can return transient 503 spikes; use the Retry button in the chat panel.
- **Disease Scanner says "Model Service Unavailable"**: Start `plant-disease-service/app.py` on port `8001` and set `PLANT_DISEASE_INFERENCE_URL=http://localhost:8001`.
- **Leaflet map tiles fail offline**: OpenStreetMap tiles require internet access; marker data and directory cards still load normally from the database.
