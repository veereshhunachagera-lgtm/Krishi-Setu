# KrishiSetu — Java Spring Boot Backend (Phase 1)

Independent, API-first Spring Boot 3.4 REST backend built with Java 21, Maven, Spring Security (JWT), Spring Data JPA, Hibernate, and PostgreSQL. Designed to serve both the KrishiSetu React web client and future Android/iOS mobile applications.

## Prerequisites

1. **Java 21 (JDK 21)**
2. **Apache Maven 3.9+**
3. **PostgreSQL 15+**

## PostgreSQL Setup

```sql
CREATE USER krishisetu_user WITH PASSWORD 'change_this_local_password';
CREATE DATABASE krishisetu OWNER krishisetu_user;
GRANT ALL PRIVILEGES ON DATABASE krishisetu TO krishisetu_user;
```

## Environment Variables

Set these environment variables before running in production (sensible local defaults exist in `application.yml`):

- `SPRING_DATASOURCE_URL` — e.g. `jdbc:postgresql://localhost:5432/krishisetu`
- `SPRING_DATASOURCE_USERNAME` — PostgreSQL username
- `SPRING_DATASOURCE_PASSWORD` — PostgreSQL password
- `JWT_SECRET_KEY` — Base64-encoded 256-bit+ HMAC secret key
- `CORS_ALLOWED_ORIGINS` — Comma-separated allowed frontend origins (default: `http://localhost:3000,http://localhost:5173`)
- `SEED_DEMO_DATA` — `true` (default) to seed development demo farmer & admin accounts on startup

## Running the Backend

```bash
cd backend
mvn clean spring-boot:run
```

The API will listen on `http://localhost:8080`.

To point the React frontend to this Spring Boot backend directly, set `VITE_API_BASE_URL=http://localhost:8080` in the frontend environment.

## Phase 1 REST Endpoints

- `POST /api/v1/auth/register` — Register a new farmer account
- `POST /api/v1/auth/login` — Authenticate farmer
- `POST /api/v1/auth/admin/login` — Authenticate admin (`ROLE_ADMIN` required)
- `GET /api/v1/auth/me` — Fetch authenticated user summary
- `PATCH /api/v1/auth/language` — Persist user language preference (`en` / `kn`)
- `GET /api/v1/farmer/profile` — Fetch authenticated farmer's profile & soil report
- `POST /api/v1/farmer/profile` — Save or update onboarding profile & soil report
- `GET /api/v1/notifications` — List notifications for authenticated user
- `PATCH /api/v1/notifications/{id}/read` — Mark single notification read
- `PATCH /api/v1/notifications/read-all` — Mark all notifications read
- `GET /api/v1/admin/overview` — Admin-only summary & farmer registry (`ROLE_ADMIN`)
