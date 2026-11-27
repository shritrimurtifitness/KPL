# API Documentation

The Cricket League Registration Platform features a RESTful API exposed under `/api/v1` with JSON request/response payloads, standard HTTP status codes, and JWT Bearer token authentication for admin endpoints.

---

## 1. Public Endpoints

### `GET /api/v1/league/settings/public`
Fetches public tournament details for landing and registration pages.
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "league_name": "Koparde Premier League",
  "tournament_title": "KPL Cricket Championship Season 2027",
  "registration_fee": 100.0,
  "maximum_registrations": 120,
  "registration_open": true,
  "registration_deadline": null,
  "reservation_minutes": 15,
  "upi_id": "kplcricket@okhdfcbank",
  "upi_display_name": "KPL Cricket League Official",
  "upi_qr_path": null,
  "whatsapp_number": "+919876543210",
  "terms_and_conditions": "1. ...",
  "registration_instructions": "1. ...",
  "max_upload_size_mb": 3
}
```

---

### `GET /api/v1/league/availability`
Returns live concurrency-checked slot capacity and availability.
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "maximum_capacity": 120,
  "confirmed_count": 45,
  "payment_submitted_count": 12,
  "reserved_count": 8,
  "rejected_count": 3,
  "expired_count": 14,
  "occupied_count": 65,
  "available_slots": 55,
  "registration_open": true,
  "registration_fee": 100.0,
  "registration_deadline": null,
  "league_name": "Koparde Premier League",
  "tournament_title": "KPL Cricket Championship Season 2027"
}
```

---

### `POST /api/v1/registrations`
Atomically verifies remaining slot capacity, reserves a slot for 15 minutes, and issues a unique public Registration ID.
- **Auth**: None
- **Request Body (`application/json`)**:
```json
{
  "full_name": "Virat Sharma",
  "mobile": "9876543210",
  "email": "virat@example.com",
  "age": 25,
  "city": "Bengaluru",
  "cricket_role": "Batsman",
  "batting_style": "Right-hand bat",
  "bowling_style": "Right-arm medium",
  "team_name": "Royal Challengers",
  "emergency_contact": "9876543200",
  "terms_accepted": true
}
```
- **Response `200 OK`**:
```json
{
  "id": "e4b2d56a-39b1-477d-bb6f-8700ef2a281e",
  "registration_id": "KPL-2027-001",
  "full_name": "Virat Sharma",
  "mobile": "9876543210",
  "email": "virat@example.com",
  "age": 25,
  "city": "Bengaluru",
  "cricket_role": "Batsman",
  "batting_style": "Right-hand bat",
  "bowling_style": "Right-arm medium",
  "team_name": "Royal Challengers",
  "status": "RESERVED",
  "amount": 100.0,
  "reservation_expires_at": "2027-04-10T12:15:00Z",
  "created_at": "2027-04-10T12:00:00Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Capacity reached (`"Registration capacity of 120 has been reached"`), or registrations closed, or duplicate active mobile.
  - `422 Unprocessable Entity`: Validation error (invalid mobile, missing terms, age out of bounds).

---

### `POST /api/v1/payments/submit`
Uploads payment receipt screenshot and submits 12-digit UTR reference number. Transitions status to `PAYMENT_SUBMITTED`.
- **Auth**: None
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `registration_id` (string): Public Registration ID (e.g. `KPL-2027-001`)
  - `utr` (string): 12-digit UPI transaction reference
  - `screenshot` (file): JPG, JPEG, or PNG image (max 3 MB)
- **Response `200 OK`**:
```json
{
  "message": "Payment proof submitted successfully. Pending admin manual verification.",
  "registration_id": "KPL-2027-001",
  "status": "PAYMENT_SUBMITTED",
  "utr": "428719283741",
  "whatsapp_url": "https://wa.me/919876543210?text=..."
}
```
- **Error Responses**:
  - `400 Bad Request`: Reservation expired, or duplicate UTR, or file exceeds size, or invalid image MIME type.
  - `404 Not Found`: Registration ID does not exist.

---

### `GET /api/v1/registrations/{registration_id}/status`
Returns public tracking status for a specific registration. Does not expose private screenshot files or internal notes.
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "registration_id": "KPL-2027-001",
  "full_name": "Virat Sharma",
  "city": "Bengaluru",
  "cricket_role": "Batsman",
  "status": "PAYMENT_SUBMITTED",
  "amount": 100.0,
  "created_at": "2027-04-10T12:00:00Z",
  "reservation_expires_at": "2027-04-10T12:15:00Z",
  "payment_submitted": true,
  "utr": "428719283741",
  "status_message": "Your payment proof has been submitted and is awaiting admin verification.",
  "whatsapp_url": "https://wa.me/919876543210?text=...",
  "upi_intent_url": null
}
```

---

### `POST /api/v1/registrations/lookup`
Dual-key lookup requiring matching Registration ID and registered mobile number.
- **Auth**: None
- **Request Body**:
```json
{
  "registration_id": "KPL-2027-001",
  "mobile": "9876543210"
}
```
- **Response**: Same as `GET /api/v1/registrations/{registration_id}/status`.

---

## 2. Admin Authentication Endpoints

### `POST /api/v1/admin/auth/login`
Authenticates administrator credentials and returns JWT Bearer token.
- **Auth**: None
- **Request Body**:
```json
{
  "email": "admin@cricketleague.com",
  "password": "CricketAdmin@2027"
}
```
- **Response `200 OK`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "admin_id": "9d90ec82-124b-4861-9f93-b6cce677ec2b",
  "email": "admin@cricketleague.com",
  "full_name": "League Administrator",
  "role": "superadmin"
}
```

---

### `GET /api/v1/admin/auth/me`
Returns current administrator identity.
- **Auth**: `Bearer <token>`

---

## 3. Admin Dashboard & Operations

All endpoints in this section require `Authorization: Bearer <token>`.

### `GET /api/v1/admin/dashboard`
Returns live KPI metrics. Verified collection is strictly computed from confirmed payments only.
- **Response `200 OK`**:
```json
{
  "maximum_capacity": 120,
  "active_reservations": 4,
  "confirmed_registrations": 78,
  "pending_verifications": 6,
  "available_slots": 32,
  "rejected_registrations": 2,
  "expired_registrations": 11,
  "total_verified_collection": 7800.0,
  "registration_open": true
}
```

---

### `GET /api/v1/admin/registrations`
Searchable, filterable, and paginated table data.
- **Query Parameters**:
  - `status`: `ALL`, `CONFIRMED`, `PAYMENT_SUBMITTED`, `RESERVED`, `REJECTED`, `EXPIRED`
  - `search`: string (matches registration ID, full name, mobile, email, or UTR)
  - `page`: integer (default: 1)
  - `page_size`: integer (default: 20)

---

### `GET /api/v1/admin/payments/pending`
Returns dedicated queue of submitted payments requiring manual review.

---

### `GET /api/v1/admin/payments/{id}/screenshot`
Streams the private payment screenshot image to authenticated administrators only, or redirects to a short-lived Supabase signed URL.

---

### `POST /api/v1/admin/payments/{id}/approve`
Atomically marks payment as `VERIFIED`, registration as `CONFIRMED`, and creates an immutable audit log record.

---

### `POST /api/v1/admin/payments/{id}/reject`
Atomically marks payment as `REJECTED`, registration as `REJECTED` (which immediately releases the occupied slot back to the available pool), and creates an audit log entry.
- **Request Body**:
```json
{
  "reason": "UTR did not match receiving bank statement"
}
```

---

### `GET /api/v1/admin/export?format=csv` or `?format=excel`
Streams an export file of all tournament registrations with timestamps converted to Asia/Kolkata (IST).

---

### `GET /api/v1/admin/settings` & `PUT /api/v1/admin/settings`
Retrieves or updates configurable league parameters. Enforces safeguards:
- Cannot reduce maximum registrations below currently occupied slots.
- Cannot change registration fee if players have already submitted payments.
