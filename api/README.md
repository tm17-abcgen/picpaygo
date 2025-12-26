# PicPayGo API

FastAPI backend powering generation, auth, and credits.

## Run locally

From repo root:
- `cd api`
- `python3 -m venv .venv && source .venv/bin/activate`
- `pip install -r requirements.txt`
- `uvicorn main:app --reload --host 0.0.0.0 --port 8081`

Local schema init loads from `docs/db/schema.sql` (or set `SCHEMA_PATH`).

## Structure

- `main.py`: app wiring (middleware, routers, startup/shutdown).
- `config.py`: environment configuration.
- `models.py`: Pydantic response models.
- `services/`: domain modules
  - `services/database/connection.py`: asyncpg pool + schema init
  - `services/storage/`: MinIO storage helpers
  - `services/auth/`: auth + guest session middleware
  - `services/credits/`: credits endpoints + helpers
  - `services/generate/`: generation endpoints + job workers
