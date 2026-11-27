# 🏏 Cricket League Registration & Payment Management Platform

A production-minded, full-stack Cricket League Registration & Manual UPI Payment Verification Platform with concurrency-safe slot allocation, automated 15-minute reservation expiry, direct UPI app intent integration, private screenshot proof storage, and a comprehensive administrator review dashboard.

---

## 🌟 Key Features

### Public Portal
- **Sports-Oriented Modern UI**: Designed with a dark navy & charcoal theme, emerald turf accents, and gold championship badges.
- **Dynamic Slot Availability**: Live capacity indicator reflecting real-time database state (never hardcoded).
- **Concurrency-Safe Slot Reservation**: Atomic database locking prevents race conditions and strictly enforces the 120-player tournament capacity limit.
- **15-Minute Reservation Expiry**: Holds the player's slot for 15 minutes while they pay. Auto-releases if proof is not submitted in time.
- **Direct UPI Payment**: Zero payment gateway commissions. Generates dynamic `upi://pay` intent links and QR codes with embedded registration metadata.
- **Proof Submission**: Players upload transaction screenshot receipts and provide the 12-digit UPI UTR reference.
- **WhatsApp Integration**: Instant click-to-chat button pre-filling player name, registration ID, amount, and UTR.
- **Dual-Key Status Tracker**: Public status tracking requiring both Registration ID and Mobile Number.

### Admin Console
- **Role-Based JWT Security**: Multi-admin database support, password hashing with bcrypt, and protected REST APIs.
- **Dashboard Overview**: Live KPI statistics (Total Capacity, Confirmed Players, Pending Verification, Active Holds, Available Slots, Total Verified Collection ₹).
- **Dedicated Payment Verification Queue**: Review submitted payment proofs, inspect receipt screenshots via authenticated viewer, cross-check UTR with bank records, and Approve or Reject.
- **Automated Slot Release**: Rejecting a payment immediately frees the slot back to the public pool and records audit logs.
- **Searchable Registrations Table**: Filter by status (Confirmed, Pending, Reserved, Rejected, Expired) and search by player name, ID, phone, or UTR.
- **Export Data**: Single-click export to CSV and Excel (`.xlsx`) with timestamps in Asia/Kolkata (IST).
- **Configurable Settings**: Dynamic administration of league name, tournament title, fee, capacity, UPI ID, display name, instructions, and rules.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router 6, React Hook Form, Zod, Lucide Icons, Axios |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.x, Pydantic 2.x, Alembic, PyJWT, Bcrypt, Pandas, OpenPyXL |
| **Database** | PostgreSQL (Supabase Free Tier in Production) / SQLite (Local dev & test suite) |
| **Storage** | Supabase Storage (Private bucket for proofs) / Local disk storage fallback |
| **Deployment** | Cloudflare Pages (Frontend) + Render Free Web Service (Backend) |

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🧪 Comprehensive Automated Test Suite

Run the full pytest suite covering 16 critical test cases:
```bash
cd backend
PYTHONPATH=. .venv/bin/pytest tests/ -v
```

### Verified Test Cases:
1. `test_successful_registration`
2. `test_invalid_mobile_number`
3. `test_duplicate_registration_prevention`
4. `test_registration_after_capacity_reached`
5. `test_concurrent_registrations_last_slot`
6. `test_reservation_expiration`
7. `test_payment_proof_submission`
8. `test_duplicate_utr_prevention`
9. `test_payment_approval`
10. `test_payment_rejection_and_slot_release`
11. `test_unauthorized_admin_api_access`
12. `test_screenshot_file_validation`
13. `test_registration_status_lookup`
14. `test_admin_settings_updates`
15. `test_verified_collection_calculation`
16. `test_capacity_limit_120_and_121st_rejected`

---

## 🔑 Default Credentials

- **Admin Login**: `http://localhost:5173/admin/login`
- **Email**: `admin@cricketleague.com`
- **Password**: `CricketAdmin@2027`

---

## 📚 Documentation Links

- [Local Development Setup](docs/SETUP.md)
- [REST API Specification](docs/API.md)
- [Production Deployment Guide (Cloudflare Pages + Render + Supabase Free)](docs/DEPLOYMENT.md)
- [League Administrator Guide](docs/ADMIN_GUIDE.md)

---

## 📄 License
MIT License. Free for cricket tournaments, sports clubs, and youth sports organizations.
