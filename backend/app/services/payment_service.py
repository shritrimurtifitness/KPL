import urllib.parse
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, UploadFile
from app.models.registration import Registration, RegistrationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.league_settings import LeagueSettings
from app.models.audit_log import AuditLog
from app.services.storage import storage_service
from app.services.slot_manager import SlotManager, get_utc_now, ensure_utc

class PaymentService:
    @staticmethod
    def generate_upi_intent_url(
        upi_id: str,
        display_name: str,
        amount: float,
        registration_id: str
    ) -> str:
        """
        Builds standard compliant UPI payment intent URI.
        """
        params = {
            "pa": upi_id.strip(),
            "pn": display_name.strip(),
            "am": f"{amount:.2f}",
            "cu": "INR",
            "tn": registration_id.strip()
        }
        query_string = urllib.parse.urlencode(params)
        return f"upi://pay?{query_string}"

    @staticmethod
    def generate_whatsapp_chat_url(
        admin_whatsapp: Optional[str],
        registration_id: str,
        player_name: str,
        mobile_number: str,
        amount: float,
        utr: Optional[str] = None
    ) -> str:
        """
        Builds official WhatsApp click-to-chat URL with prefilled message.
        """
        cleaned_phone = "".join(filter(lambda x: x.isdigit(), admin_whatsapp or ""))
        if not cleaned_phone:
            cleaned_phone = "919922335991"
        elif len(cleaned_phone) == 10:
            cleaned_phone = f"91{cleaned_phone}"
        
        utr_display = utr.strip() if utr and utr.strip() else "Attached in Screenshot"

        message = (
            f"Hello Admin,\n\n"
            f"I have completed my cricket league registration payment.\n\n"
            f"Registration ID: {registration_id}\n"
            f"Name: {player_name}\n"
            f"Mobile: {mobile_number}\n"
            f"Amount: ₹{int(amount) if amount.is_integer() else f'{amount:.2f}'}\n"
            f"UPI Ref (Last 4 Digits): {utr_display}\n\n"
            f"Please verify my payment screenshot and confirm my registration.\n\n"
            f"Thank you."
        )
        encoded_message = urllib.parse.quote(message)
        return f"https://wa.me/{cleaned_phone}?text={encoded_message}"

    @staticmethod
    async def submit_payment_proof(
        db: Session,
        registration_id: str,
        screenshot_file: UploadFile,
        utr: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validates reservation expiry, verifies optional UTR,
        uploads payment screenshot, and updates status to PAYMENT_SUBMITTED.
        """
        clean_utr = utr.strip().upper() if utr and utr.strip() else None

        # 1. Clean up expired reservations first
        SlotManager.cleanup_expired_reservations(db)

        # 2. Check registration existence
        reg = db.query(Registration).filter(Registration.registration_id == registration_id).first()
        if not reg:
            raise HTTPException(status_code=404, detail="Registration not found.")

        now = get_utc_now()

        # Check status
        if reg.status == RegistrationStatus.CONFIRMED.value:
            raise HTTPException(status_code=400, detail="This registration is already confirmed.")
        
        if reg.status == RegistrationStatus.EXPIRED.value:
            raise HTTPException(status_code=400, detail="This reservation has expired. Slots have been released.")
        
        if reg.status == RegistrationStatus.RESERVED.value and ensure_utc(reg.reservation_expires_at) <= now:
            reg.status = RegistrationStatus.EXPIRED.value
            db.commit()
            raise HTTPException(status_code=400, detail="Reservation window (10 minutes) has elapsed. Slot expired.")

        # 3. Check duplicate full UTR (only when a full 10+ character UTR is provided)
        if clean_utr and len(clean_utr) >= 10:
            existing_payment = db.query(Payment).filter(Payment.utr == clean_utr).first()
            if existing_payment:
                raise HTTPException(
                    status_code=400,
                    detail=f"This UTR / Transaction Reference '{clean_utr}' has already been submitted for another registration."
                )

        # 4. Fetch league settings for max upload size and WhatsApp number
        settings = db.query(LeagueSettings).filter(LeagueSettings.id == 1).first()
        max_mb = settings.max_upload_size_mb if settings else 3

        # 5. Save screenshot to private storage
        storage_path = await storage_service.save_screenshot(
            file=screenshot_file,
            registration_id=reg.registration_id,
            max_size_mb=max_mb
        )

        # 6. Create or update payment record
        payment = Payment(
            registration_id=reg.id,
            amount=reg.amount,
            utr=clean_utr,
            screenshot_path=storage_path,
            status=PaymentStatus.PENDING.value,
            submitted_at=now
        )
        db.add(payment)

        # Update registration status to PAYMENT_SUBMITTED
        reg.status = RegistrationStatus.PAYMENT_SUBMITTED.value
        db.commit()
        db.refresh(reg)
        db.refresh(payment)

        # Generate WhatsApp link for user convenience (destination defaults to +919922335991)
        whatsapp_number = settings.whatsapp_number if settings and settings.whatsapp_number else "+919922335991"
        whatsapp_url = PaymentService.generate_whatsapp_chat_url(
            admin_whatsapp=whatsapp_number,
            registration_id=reg.registration_id,
            player_name=reg.full_name,
            mobile_number=reg.mobile,
            amount=float(reg.amount),
            utr=clean_utr
        )

        return {
            "message": "Payment proof submitted successfully. Pending admin manual verification.",
            "registration_id": reg.registration_id,
            "status": reg.status,
            "utr": clean_utr,
            "whatsapp_url": whatsapp_url
        }

    @staticmethod
    def approve_payment(db: Session, payment_id: str, admin_id: str) -> Dict[str, Any]:
        """
        Atomically approves payment, sets registration to CONFIRMED, and logs audit entry.
        """
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment record not found.")

        if payment.status == PaymentStatus.VERIFIED.value:
            raise HTTPException(status_code=400, detail="Payment is already verified.")

        now = get_utc_now()
        payment.status = PaymentStatus.VERIFIED.value
        payment.verified_at = now
        payment.verified_by = admin_id
        payment.rejection_reason = None

        # Update registration to CONFIRMED
        reg = db.query(Registration).filter(Registration.id == payment.registration_id).first()
        if reg:
            reg.status = RegistrationStatus.CONFIRMED.value

        # Log audit
        audit = AuditLog(
            admin_id=admin_id,
            action="PAYMENT_APPROVED",
            entity_type="payment",
            entity_id=payment.id,
            description=f"Admin approved payment of ₹{payment.amount} for registration {reg.registration_id if reg else 'N/A'} (UTR: {payment.utr})"
        )
        db.add(audit)
        db.commit()
        db.refresh(payment)

        return {
            "message": "Payment successfully approved and registration confirmed.",
            "payment_id": payment.id,
            "registration_id": reg.registration_id if reg else None,
            "status": PaymentStatus.VERIFIED.value
        }

    @staticmethod
    def reject_payment(db: Session, payment_id: str, admin_id: str, reason: str) -> Dict[str, Any]:
        """
        Atomically rejects payment, sets registration to REJECTED (releasing slot), and logs audit entry.
        """
        clean_reason = reason.strip()
        if not clean_reason:
            raise HTTPException(status_code=400, detail="A rejection reason is required.")

        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment record not found.")

        now = get_utc_now()
        payment.status = PaymentStatus.REJECTED.value
        payment.rejection_reason = clean_reason
        payment.verified_at = now
        payment.verified_by = admin_id

        # Update registration to REJECTED (slot is released)
        reg = db.query(Registration).filter(Registration.id == payment.registration_id).first()
        if reg:
            reg.status = RegistrationStatus.REJECTED.value

        # Log audit
        audit = AuditLog(
            admin_id=admin_id,
            action="PAYMENT_REJECTED",
            entity_type="payment",
            entity_id=payment.id,
            description=f"Admin rejected payment for registration {reg.registration_id if reg else 'N/A'}. Reason: {clean_reason}"
        )
        db.add(audit)
        db.commit()
        db.refresh(payment)

        return {
            "message": "Payment rejected and slot released.",
            "payment_id": payment.id,
            "registration_id": reg.registration_id if reg else None,
            "status": PaymentStatus.REJECTED.value,
            "reason": clean_reason
        }
