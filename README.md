# re-taskflow

A full-stack project and task management application built with FastAPI, SQLAlchemy 2, PostgreSQL 17, Docker Compose, and a React + Vite frontend.

---

## Architecture Overview

- **Backend:**
  - Python 3.12 with FastAPI & Uvicorn
  - Pydantic v2 & `pydantic-settings`
  - SQLAlchemy 2.0 ORM with Psycopg 3 (`postgresql+psycopg`)
  - Alembic for database migrations
  - Argon2 password hashing (`pwdlib`) & JWT bearer token authentication (`pyjwt`)
- **Frontend:**
  - React 19 with JSX (plain JavaScript)
  - Vite build tool & development server
  - React Router v7
  - Axios for HTTP requests
  - Plain CSS with CSS variables
  - pnpm package manager
- **Database:**
  - PostgreSQL 17 managed via Docker Compose

---

## Directory Structure

```text
re-taskflow/
├── docker-compose.yaml
├── README.md
├── backend/
│   ├── .env.example
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py
│   │   │   └── v1/
│   │   │       ├── router.py
│   │   │       └── endpoints/
│   │   │           ├── auth.py
│   │   │           ├── health.py
│   │   │           ├── projects.py
│   │   │           ├── project_members.py
│   │   │           ├── tasks.py
│   │   │           └── comments.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
└── frontend/
    ├── .env.example
    ├── eslint.config.js
    ├── package.json
    ├── pnpm-lock.yaml
    ├── vite.config.js
    └── src/
        ├── components/
        ├── context/
        ├── lib/
        ├── pages/
        ├── App.jsx
        └── main.jsx
```

---

## Getting Started

### 1. Prerequisites

- **Docker & Docker Compose** (v2+)
- **Node.js** (v20+ or v24+) & **pnpm** (v9+ or v12+)
- **Python 3.12** & **uv** (or virtualenv)

### 2. Database Setup

1. Copy the example environment file for the backend:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Configure database credentials in `backend/.env`.
3. Start the PostgreSQL service via Docker Compose:
   ```bash
   docker compose up -d
   ```
4. Verify the container is running and healthy:
   ```bash
   docker compose ps
   ```

### 3. Backend Setup & Migrations

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python 3.12 virtual environment (e.g. using `uv`):
   ```bash
   uv venv --python 3.12
   source .venv/bin/activate
   uv pip install -r requirements.txt
   ```
3. Run Alembic migrations to apply all database tables:
   ```bash
   alembic upgrade head
   ```
4. Verify migration state:
   ```bash
   alembic current
   ```
5. Start the backend development server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

Interactive API documentation will be available at:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health check:** [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 4. Frontend Setup

1. In a separate terminal, navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Install frontend dependencies:
   ```bash
   pnpm install
   ```
4. Run the development server:
   ```bash
   pnpm dev
   ```
5. Open your browser at [http://127.0.0.1:5173](http://127.0.0.1:5173).

---

## Verification & Checks

### Frontend Checks
- **Linter:** `cd frontend && pnpm lint`
- **Production Build:** `cd frontend && pnpm build`

### Backend Checks
- **Static Syntax Check:** `cd backend && python -m compileall app alembic`
- **API Health Check:** `curl -s http://127.0.0.1:8000/api/v1/health`
- **Database Status:** `docker compose ps` & `alembic current`
