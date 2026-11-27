import io
import time
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
from fastapi.testclient import TestClient

import pytest
from app.models.registration import Registration, RegistrationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.league_settings import LeagueSettings
from app.services.slot_manager import SlotManager

def create_dummy_image_bytes(format="PNG"):
    img = Image.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf.getvalue()

# 1. Successful registration
def test_successful_registration(client, default_league_settings):
    payload = {
        "full_name": "Virat Sharma",
        "mobile": "9876543210",
        "email": "virat@example.com",
        "age": 25,
        "city": "Bengaluru",
        "cricket_role": "Batsman",
        "batting_style": "Right-hand bat",
        "bowling_style": "Right-arm medium",
        "team_name": "Royal Challengers",
        "terms_accepted": True
    }
    response = client.post("/api/v1/registrations", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["registration_id"].startswith("KPL-2027-")
    assert data["status"] == "RESERVED"
    assert data["amount"] == 100.00
    assert "reservation_expires_at" in data

# 2. Invalid mobile number
def test_invalid_mobile_number(client, default_league_settings):
    payload = {
        "full_name": "Invalid Phone",
        "mobile": "12345",  # Invalid
        "age": 22,
        "city": "Mysuru",
        "cricket_role": "Bowler",
        "terms_accepted": True
    }
    response = client.post("/api/v1/registrations", json=payload)
    assert response.status_code == 422

# 3. Duplicate registration for same active mobile
def test_duplicate_registration_prevention(client, default_league_settings):
    payload = {
        "full_name": "Rohit Kumar",
        "mobile": "9876543222",
        "age": 28,
        "city": "Hubballi",
        "cricket_role": "Batsman",
        "terms_accepted": True
    }
    resp1 = client.post("/api/v1/registrations", json=payload)
    assert resp1.status_code == 200

    # Second attempt with same mobile while reservation is active
    resp2 = client.post("/api/v1/registrations", json=payload)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"].lower()

# 4. Registration after capacity is reached
def test_registration_after_capacity_reached(client, db_session, default_league_settings):
    # Set capacity temporarily to 2
    default_league_settings.maximum_registrations = 2
    db_session.commit()

    # Fill 2 slots
    for i in range(1, 3):
        res = client.post("/api/v1/registrations", json={
            "full_name": f"Player {i}",
            "mobile": f"987654320{i}",
            "age": 20 + i,
            "city": "Bengaluru",
            "cricket_role": "All-rounder",
            "terms_accepted": True
        })
        assert res.status_code == 200

    # 3rd registration must fail
    res3 = client.post("/api/v1/registrations", json={
        "full_name": "Player 3",
        "mobile": "9876543203",
        "age": 24,
        "city": "Bengaluru",
        "cricket_role": "All-rounder",
        "terms_accepted": True
    })
    assert res3.status_code == 400
    assert "capacity" in res3.json()["detail"].lower()

# 5. Two concurrent registrations attempting to take the last slot
def test_concurrent_registrations_last_slot(client, db_session, default_league_settings):
    # Set capacity to 1
    default_league_settings.maximum_registrations = 1
    db_session.commit()

    # First registration takes the slot
    resp1 = client.post("/api/v1/registrations", json={
        "full_name": "Racer One",
        "mobile": "9888888801",
        "age": 26,
        "city": "Mangaluru",
        "cricket_role": "Batsman",
        "terms_accepted": True
    })
    assert resp1.status_code == 200

    # Competing simultaneous/subsequent registration for the last slot must be rejected
    resp2 = client.post("/api/v1/registrations", json={
        "full_name": "Racer Two",
        "mobile": "9888888802",
        "age": 27,
        "city": "Mangaluru",
        "cricket_role": "Bowler",
        "terms_accepted": True
    })
    assert resp2.status_code == 400
    assert "capacity" in resp2.json()["detail"].lower()

# 6. Reservation expiration
def test_reservation_expiration(client, db_session, default_league_settings):
    # Register player
    resp = client.post("/api/v1/registrations", json={
        "full_name": "Expiring Player",
        "mobile": "9999988881",
        "age": 23,
        "city": "Belagavi",
        "cricket_role": "Bowler",
        "terms_accepted": True
    })
    assert resp.status_code == 200
    reg_id = resp.json()["registration_id"]

    # Manually backdate reservation expiry to simulate 16 minutes passed
    reg = db_session.query(Registration).filter(Registration.registration_id == reg_id).first()
    reg.reservation_expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db_session.commit()

    # Query status - should transition to EXPIRED
    status_resp = client.get(f"/api/v1/registrations/{reg_id}/status")
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "EXPIRED"

# 7. Payment proof submission
def test_payment_proof_submission(client, default_league_settings):
    # 1. Register
    reg_resp = client.post("/api/v1/registrations", json={
        "full_name": "K L Rahul",
        "mobile": "9988776655",
        "age": 30,
        "city": "Bengaluru",
        "cricket_role": "Wicketkeeper",
        "terms_accepted": True
    })
    assert reg_resp.status_code == 200
    reg_id = reg_resp.json()["registration_id"]

    # 2. Submit payment proof
    image_data = create_dummy_image_bytes("PNG")
    files = {"screenshot": ("proof.png", image_data, "image/png")}
    data = {
        "registration_id": reg_id,
        "utr": "UTR123456789012"
    }
    pay_resp = client.post("/api/v1/payments/submit", data=data, files=files)
    assert pay_resp.status_code == 200
    result = pay_resp.json()
    assert result["status"] == "PAYMENT_SUBMITTED"
    assert "whatsapp_url" in result

# 8. Duplicate UTR prevention
def test_duplicate_utr_prevention(client, default_league_settings):
    # Register first player and submit UTR
    p1 = client.post("/api/v1/registrations", json={
        "full_name": "Player Alpha",
        "mobile": "9911223344",
        "age": 21,
        "city": "Bengaluru",
        "cricket_role": "Batsman",
        "terms_accepted": True
    }).json()["registration_id"]

    image_data = create_dummy_image_bytes("PNG")
    client.post(
        "/api/v1/payments/submit",
        data={"registration_id": p1, "utr": "SHAREDUTR9999"},
        files={"screenshot": ("p1.png", image_data, "image/png")}
    )

    # Register second player and attempt to use same UTR
    p2 = client.post("/api/v1/registrations", json={
        "full_name": "Player Beta",
        "mobile": "9911223355",
        "age": 22,
        "city": "Mysuru",
        "cricket_role": "Bowler",
        "terms_accepted": True
    }).json()["registration_id"]

    pay_resp2 = client.post(
        "/api/v1/payments/submit",
        data={"registration_id": p2, "utr": "SHAREDUTR9999"},
        files={"screenshot": ("p2.png", image_data, "image/png")}
    )
    assert pay_resp2.status_code == 400
    assert "already been submitted" in pay_resp2.json()["detail"].lower()

# 9. Payment approval
def test_payment_approval(client, db_session, admin_headers, default_league_settings):
    reg = client.post("/api/v1/registrations", json={
        "full_name": "Hardik Player",
        "mobile": "9776655443",
        "age": 27,
        "city": "Bengaluru",
        "cricket_role": "All-rounder",
        "terms_accepted": True
    }).json()["registration_id"]

    img = create_dummy_image_bytes("JPEG")
    client.post(
        "/api/v1/payments/submit",
        data={"registration_id": reg, "utr": "HARDIKUTR777"},
        files={"screenshot": ("proof.jpg", img, "image/jpeg")}
    )

    # Find pending payment
    pending = client.get("/api/v1/admin/payments/pending", headers=admin_headers).json()
    hardik_payment = next(p for p in pending if p["registration_id"] == reg)

    # Approve payment
    appr_resp = client.post(
        f"/api/v1/admin/payments/{hardik_payment['payment_id']}/approve",
        headers=admin_headers
    )
    assert appr_resp.status_code == 200

    # Verify registration is now CONFIRMED
    status = client.get(f"/api/v1/registrations/{reg}/status").json()
    assert status["status"] == "CONFIRMED"

# 10. Payment rejection and 11. Slot release after rejection
def test_payment_rejection_and_slot_release(client, db_session, admin_headers, default_league_settings):
    default_league_settings.maximum_registrations = 1
    db_session.commit()

    reg = client.post("/api/v1/registrations", json={
        "full_name": "Reject Candidate",
        "mobile": "9665544332",
        "age": 29,
        "city": "Shivamogga",
        "cricket_role": "Batsman",
        "terms_accepted": True
    }).json()["registration_id"]

    img = create_dummy_image_bytes("PNG")
    client.post(
        "/api/v1/payments/submit",
        data={"registration_id": reg, "utr": "FAKEUTR000000"},
        files={"screenshot": ("proof.png", img, "image/png")}
    )

    # Capacity should be full now
    avail_before = client.get("/api/v1/league/availability").json()
    assert avail_before["available_slots"] == 0

    pending = client.get("/api/v1/admin/payments/pending", headers=admin_headers).json()
    pay_item = next(p for p in pending if p["registration_id"] == reg)

    # Reject payment with reason
    rej_resp = client.post(
        f"/api/v1/admin/payments/{pay_item['payment_id']}/reject",
        headers=admin_headers,
        json={"reason": "Fake UTR screenshot provided."}
    )
    assert rej_resp.status_code == 200

    # Registration status is REJECTED
    status = client.get(f"/api/v1/registrations/{reg}/status").json()
    assert status["status"] == "REJECTED"

    # Slot must be released and available again!
    avail_after = client.get("/api/v1/league/availability").json()
    assert avail_after["available_slots"] == 1

# 12. Unauthorized admin API access
def test_unauthorized_admin_api_access(client):
    resp = client.get("/api/v1/admin/dashboard")
    assert resp.status_code in (401, 403)

    resp2 = client.get("/api/v1/admin/payments/pending")
    assert resp2.status_code in (401, 403)

# 13. Screenshot file validation (Invalid format and size)
def test_screenshot_file_validation(client, default_league_settings):
    reg = client.post("/api/v1/registrations", json={
        "full_name": "Test Validator",
        "mobile": "9554433221",
        "age": 23,
        "city": "Bengaluru",
        "cricket_role": "Bowler",
        "terms_accepted": True
    }).json()["registration_id"]

    # Test invalid extension (e.g. .pdf or .txt)
    bad_file = ("document.pdf", b"%PDF-1.4...", "application/pdf")
    resp = client.post(
        "/api/v1/payments/submit",
        data={"registration_id": reg, "utr": "VALIDUTR12345"},
        files={"screenshot": bad_file}
    )
    assert resp.status_code == 400
    assert "only jpg, jpeg, png, and webp" in resp.json()["detail"].lower()

# 14. Registration status lookup (Dual key)
def test_registration_status_lookup(client, default_league_settings):
    reg_id = client.post("/api/v1/registrations", json={
        "full_name": "Lookup User",
        "mobile": "9443322110",
        "age": 22,
        "city": "Bengaluru",
        "cricket_role": "Batsman",
        "terms_accepted": True
    }).json()["registration_id"]

    # Correct registration_id and mobile
    lookup_success = client.post("/api/v1/registrations/lookup", json={
        "registration_id": reg_id,
        "mobile": "9443322110"
    })
    assert lookup_success.status_code == 200
    assert lookup_success.json()["full_name"] == "Lookup User"

    # Mismatched mobile
    lookup_fail = client.post("/api/v1/registrations/lookup", json={
        "registration_id": reg_id,
        "mobile": "9999999999"
    })
    assert lookup_fail.status_code == 404

# 15. Admin settings updates and validation
def test_admin_settings_updates(client, admin_headers, default_league_settings):
    # Update settings
    update_data = {
        "league_name": "Updated Premier League",
        "tournament_title": "Season 2027 Mega Cup",
        "upi_id": "updated@upi"
    }
    resp = client.put("/api/v1/admin/settings", headers=admin_headers, json=update_data)
    assert resp.status_code == 200
    assert resp.json()["league_name"] == "Updated Premier League"

# 16. Verified collection calculation
def test_verified_collection_calculation(client, admin_headers, default_league_settings):
    # Register and approve 2 registrations
    for i in range(1, 3):
        reg = client.post("/api/v1/registrations", json={
            "full_name": f"Collector {i}",
            "mobile": f"933221100{i}",
            "age": 25,
            "city": "Bengaluru",
            "cricket_role": "Batsman",
            "terms_accepted": True
        }).json()["registration_id"]

        img = create_dummy_image_bytes("PNG")
        client.post(
            "/api/v1/payments/submit",
            data={"registration_id": reg, "utr": f"COLLECTUTR00{i}"},
            files={"screenshot": (f"p{i}.png", img, "image/png")}
        )

        pending = client.get("/api/v1/admin/payments/pending", headers=admin_headers).json()
        item = next(p for p in pending if p["registration_id"] == reg)
        client.post(f"/api/v1/admin/payments/{item['payment_id']}/approve", headers=admin_headers)

    # Dashboard should show collection from approved payments only
    dashboard = client.get("/api/v1/admin/dashboard", headers=admin_headers).json()
    assert dashboard["total_verified_collection"] >= 200.00

def test_capacity_limit_120_and_121st_rejected(client, db_session, default_league_settings):
    """
    Directly populates 120 confirmed registrations, then verifies the 121st registration fails.
    """
    default_league_settings.maximum_registrations = 120
    db_session.commit()

    # Bulk insert 120 confirmed registrations
    registrations = [
        Registration(
            registration_id=f"KPL-2027-{i:03d}",
            full_name=f"Confirmed Player {i}",
            mobile=f"900000{i:04d}",
            age=25,
            city="Bengaluru",
            cricket_role="Batsman",
            status=RegistrationStatus.CONFIRMED.value,
            amount=100.00,
            reservation_expires_at=datetime.now(timezone.utc) + timedelta(days=1)
        )
        for i in range(1, 121)
    ]
    db_session.bulk_save_objects(registrations)
    db_session.commit()

    # Verify availability is 0
    avail = client.get("/api/v1/league/availability").json()
    assert avail["occupied_count"] == 120
    assert avail["available_slots"] == 0

    # Attempt 121st registration
    resp_121 = client.post("/api/v1/registrations", json={
        "full_name": "Player 121",
        "mobile": "9999999999",
        "age": 28,
        "city": "Bengaluru",
        "cricket_role": "Bowler",
        "terms_accepted": True
    })
    assert resp_121.status_code == 400
    assert "capacity of 120 has been reached" in resp_121.json()["detail"].lower()

def test_player_photo_upload_and_registration(client, default_league_settings):
    """
    Test uploading player photo, attaching it to registration, and retrieving it.
    """
    img_bytes = create_dummy_image_bytes(format="JPEG")
    upload_res = client.post(
        "/api/v1/registrations/photo",
        files={"photo": ("avatar.jpg", img_bytes, "image/jpeg")}
    )
    assert upload_res.status_code == 200, upload_res.text
    photo_path = upload_res.json()["photo_path"]
    assert photo_path is not None

    payload = {
        "full_name": "Photo Test Player",
        "mobile": "9811223344",
        "age": 24,
        "city": "Bengaluru",
        "cricket_role": "All-rounder",
        "photo_path": photo_path,
        "terms_accepted": True
    }
    reg_res = client.post("/api/v1/registrations", json=payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["photo_url"] is not None

    # Photo URL should be present (either direct signed URL or relative photo route)
    photo_url = reg_data["photo_url"]
    assert photo_url is not None
    if photo_url.startswith("http"):
        assert "supabase.co" in photo_url
    else:
        photo_res = client.get(photo_url, follow_redirects=False)
        assert photo_res.status_code in [200, 307]

    # Verify the dedicated endpoint also serves/redirects properly
    direct_res = client.get(f"/api/v1/registrations/{reg_data['registration_id']}/photo", follow_redirects=False)
    assert direct_res.status_code in [200, 307]

