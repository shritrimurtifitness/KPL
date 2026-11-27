# Local Development Setup Guide

This guide provides instructions to run the **Cricket League Registration & Payment Management System** locally on Linux, macOS, or Windows.

---

## 1. Prerequisites

- **Python**: version 3.10+ (tested on Python 3.12)
- **Node.js**: version 18+ (tested on Node v22)
- **npm**: version 9+
- **Git**

---

## 2. Monorepo Project Structure

```
.
├── backend/                  # FastAPI Backend & SQLAlchemy models
│   ├── app/                  # Application core, models, schemas, services
│   ├── alembic/              # Database migration scripts
│   ├── tests/                # Pytest test suite (16 comprehensive tests)
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment variables template
├── frontend/                 # React + Vite + TypeScript + Tailwind
│   ├── src/                  # Components, pages, context, services
│   ├── package.json          # Frontend dependencies
│   └── .env.example          # Frontend environment variables template
├── docs/                     # Full system documentation
└── README.md
```

---

## 3. Backend Setup

### A. Create and Activate Virtual Environment

**Linux / macOS:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell):**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### B. Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### C. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key configuration options in `backend/.env`:
- `DATABASE_URL`: By default set to `sqlite:///./cricket_league.db` for instant offline testing and local dev. For PostgreSQL or Supabase, provide: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`.
- `SECRET_KEY`: A secure 32+ character random string.
- `BACKEND_CORS_ORIGINS`: JSON array of allowed origins, e.g. `["http://localhost:5173", "http://localhost:3000"]`.
- `INITIAL_ADMIN_EMAIL`: Seed admin email (default: `admin@cricketleague.com`).
- `INITIAL_ADMIN_PASSWORD`: Seed admin password (default: `CricketAdmin@2027`).

### D. Run Database Migrations & Initial Seed
The backend automatically creates tables and seeds default admin credentials and league settings on boot.
To manually run migrations:
```bash
alembic upgrade head
```

### E. Start the Backend API Server
```bash
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`

---

## 4. Frontend Setup

### A. Install Node Dependencies
In a new terminal window:
```bash
cd frontend
npm install
```

### B. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default content:
```env
VITE_API_BASE_URL=/api/v1
```

### C. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.
Vite proxy automatically forwards `/api/*` calls to `http://localhost:8000`.

---

## 5. Running Automated Backend Tests

The system comes with an automated pytest suite covering 16 critical business requirements, including:
1. Concurrency-safe slot reservation
2. Strict 120-player capacity ceiling enforcement
3. Competing concurrent registrations taking the last available slot
4. 15-minute reservation expiration and slot release
5. Duplicate mobile number prevention
6. Duplicate UTR reference prevention
7. Private screenshot proof upload and MIME/extension validation
8. Admin payment approval and verified collection calculation
9. Admin payment rejection and automatic slot release
10. Dual-key status lookup
11. Admin authorization checks
12. Admin settings updates and safeguards

To execute the test suite:
```bash
cd backend
PYTHONPATH=. .venv/bin/pytest tests/ -v
```
All 16 tests will execute against an isolated test database with 100% pass rate.

---

## 6. Accessing the Application

- **Public Landing Page**: `http://localhost:5173/`
- **Player Registration Form**: `http://localhost:5173/register`
- **UPI Payment & Screenshot Proof**: `http://localhost:5173/payment?id=KPL-2027-001`
- **Dual-Key Registration Status Lookup**: `http://localhost:5173/status`
- **Administrator Login Portal**: `http://localhost:5173/admin/login`
  - Default Email: `admin@cricketleague.com`
  - Default Password: `CricketAdmin@2027`
- **Admin Dashboard**: `http://localhost:5173/admin/dashboard`
