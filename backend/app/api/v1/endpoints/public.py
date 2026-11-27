from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.storage import storage_service
from app.models.registration import Registration, RegistrationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.league_settings import LeagueSettings
from app.schemas.registration import (
    RegistrationCreate,
    RegistrationLookupRequest,
    RegistrationPublicStatus,
    RegistrationResponse
)
from app.schemas.league_settings import LeagueSettingsPublic
from app.services.slot_manager import SlotManager, get_utc_now
from app.services.payment_service import PaymentService

router = APIRouter()

@router.get("/league/settings/public", response_model=LeagueSettingsPublic)
def get_public_settings(db: Session = Depends(get_db)):
    """
    Returns public league configuration for landing and registration pages.
    """
    settings = db.query(LeagueSettings).filter(LeagueSettings.id == 1).first()
    if not settings:
        settings = LeagueSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/league/availability")
def get_league_availability(db: Session = Depends(get_db)):
    """
    Returns live slot capacity, occupied slots, available slots and open status.
    """
    return SlotManager.get_availability(db)

@router.post("/registrations/photo")
async def upload_player_photo(
    photo: UploadFile = File(..., description="Player profile photo image (JPG, PNG, WebP)"),
    db: Session = Depends(get_db)
):
    """
    Uploads and stores the player's profile photograph.
    Returns the stored photo path to be linked with the registration form.
    """
    photo_path = await storage_service.save_player_photo(photo)
    return {"photo_path": photo_path, "message": "Player photograph uploaded successfully."}

@router.get("/registrations/{registration_id}/photo")
def get_player_photo(
    registration_id: str,
    db: Session = Depends(get_db)
):
    """
    Serves the player profile photograph.
    """
    reg = db.query(Registration).filter(Registration.registration_id == registration_id.strip()).first()
    if not reg or not reg.photo_path:
        raise HTTPException(status_code=404, detail="Player photograph not found.")

    file_bytes, signed_url, mime_type = storage_service.get_file_bytes_or_url(reg.photo_path)
    if signed_url:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(signed_url)

    return Response(content=file_bytes, media_type=mime_type)

@router.post("/registrations", response_model=RegistrationResponse)
def create_registration(
    data: RegistrationCreate,
    db: Session = Depends(get_db)
):
    """
    Atomically checks capacity and reserves a slot for 10 minutes.
    Returns Registration ID and reservation expiration.
    """
    registration = SlotManager.reserve_slot(db, data.model_dump())
    return registration

@router.post("/payments/submit")
async def submit_payment_proof(
    registration_id: str = Form(..., description="Unique Registration ID"),
    utr: Optional[str] = Form(None, description="Last 4 digits of UPI Reference / UTR (Optional)"),
    screenshot: UploadFile = File(..., description="Payment screenshot image (JPG/PNG)"),
    db: Session = Depends(get_db)
):
    """
    Uploads payment proof screenshot and changes status to PAYMENT_SUBMITTED.
    """
    result = await PaymentService.submit_payment_proof(
        db=db,
        registration_id=registration_id.strip(),
        utr=utr.strip() if utr else None,
        screenshot_file=screenshot
    )
    return result

@router.get("/registrations/{registration_id}/status", response_model=RegistrationPublicStatus)
def get_registration_status(
    registration_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns public status for a registration with friendly instructions.
    Does not expose sensitive personal info.
    """
    # Expiry sweep
    SlotManager.cleanup_expired_reservations(db)

    reg = db.query(Registration).filter(Registration.registration_id == registration_id.strip()).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found.")

    settings = db.query(LeagueSettings).filter(LeagueSettings.id == 1).first()
    latest_payment = reg.payments[-1] if reg.payments else None

    # Status messages according to requirements
    msg_map = {
        RegistrationStatus.RESERVED.value: "Your registration is temporarily reserved. Please complete payment.",
        RegistrationStatus.PAYMENT_SUBMITTED.value: "Your payment proof has been submitted and is awaiting admin verification.",
        RegistrationStatus.CONFIRMED.value: "Congratulations! Your cricket league registration is confirmed.",
        RegistrationStatus.REJECTED.value: "Your payment could not be verified. Please contact the administrator.",
        RegistrationStatus.EXPIRED.value: "Your registration reservation has expired. Please register again if slots are available.",
    }
    status_msg = msg_map.get(reg.status, "Status under review.")

    whatsapp_url = None
    if settings and settings.whatsapp_number:
        whatsapp_url = PaymentService.generate_whatsapp_chat_url(
            admin_whatsapp=settings.whatsapp_number,
            registration_id=reg.registration_id,
            player_name=reg.full_name,
            mobile_number=reg.mobile,
            amount=float(reg.amount),
            utr=latest_payment.utr if latest_payment else "PENDING"
        )

    upi_intent = None
    if reg.status == RegistrationStatus.RESERVED.value and settings:
        upi_intent = PaymentService.generate_upi_intent_url(
            upi_id=settings.upi_id,
            display_name=settings.upi_display_name,
            amount=float(reg.amount),
            registration_id=reg.registration_id
        )

    return RegistrationPublicStatus(
        registration_id=reg.registration_id,
        full_name=reg.full_name,
        city=reg.city,
        cricket_role=reg.cricket_role,
        status=reg.status,
        amount=float(reg.amount),
        created_at=reg.created_at,
        reservation_expires_at=reg.reservation_expires_at,
        payment_submitted=bool(latest_payment),
        utr=latest_payment.utr if latest_payment else None,
        status_message=status_msg,
        whatsapp_url=whatsapp_url,
        upi_intent_url=upi_intent,
        photo_url=f"/api/v1/registrations/{reg.registration_id}/photo" if reg.photo_path else None
    )

@router.post("/registrations/lookup", response_model=RegistrationPublicStatus)
def lookup_registration(
    lookup: RegistrationLookupRequest,
    db: Session = Depends(get_db)
):
    """
    Public dual-key lookup: Registration ID and Mobile Number must match.
    """
    SlotManager.cleanup_expired_reservations(db)

    # Clean mobile number
    clean_mobile = "".join(filter(lambda x: x.isdigit(), lookup.mobile))
    if len(clean_mobile) > 10:
        clean_mobile = clean_mobile[-10:]

    reg = db.query(Registration).filter(
        Registration.registration_id == lookup.registration_id.strip()
    ).first()

    if not reg or not (reg.mobile == clean_mobile or reg.mobile.endswith(clean_mobile)):
        raise HTTPException(
            status_code=404,
            detail="No registration found matching the provided Registration ID and Mobile number."
        )

    return get_registration_status(reg.registration_id, db)
