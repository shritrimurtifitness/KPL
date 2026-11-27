from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_admin
from app.models.admin import Admin
from app.models.payment import Payment, PaymentStatus
from app.models.registration import Registration
from app.schemas.payment import (
    PaymentResponse,
    PendingPaymentItem,
    PaymentRejectRequest
)
from app.services.payment_service import PaymentService
from app.services.storage import storage_service

router = APIRouter()

@router.get("/payments/pending", response_model=List[PendingPaymentItem])
def list_pending_payments(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Dedicated queue of submitted payments awaiting verification.
    """
    payments = (
        db.query(Payment)
        .join(Registration, Payment.registration_id == Registration.id)
        .filter(Payment.status == PaymentStatus.PENDING.value)
        .order_by(Payment.submitted_at.asc())
        .all()
    )

    result = []
    for p in payments:
        reg = p.registration
        result.append(
            PendingPaymentItem(
                payment_id=p.id,
                registration_id=reg.registration_id if reg else "N/A",
                player_name=reg.full_name if reg else "Unknown",
                mobile=reg.mobile if reg else "Unknown",
                amount=float(p.amount),
                utr=p.utr or "Not specified",
                status=p.status,
                submitted_at=p.submitted_at,
                screenshot_url=p.screenshot_url or f"/api/v1/admin/payments/{p.id}/screenshot",
                player_photo_url=reg.photo_url if reg else None
            )
        )
    return result

@router.get("/payments/{id}", response_model=PaymentResponse)
def get_payment_detail(
    id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    payment = db.query(Payment).filter(Payment.id == id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found.")
    return payment

@router.get("/payments/{id}/screenshot")
def get_payment_screenshot(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Serves the payment screenshot by redirecting to signed storage URL or streaming file bytes.
    """
    payment = db.query(Payment).filter(Payment.id == id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found.")

    file_bytes, signed_url, mime_type = storage_service.get_file_bytes_or_url(payment.screenshot_path)
    if signed_url:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(signed_url)

    return Response(content=file_bytes, media_type=mime_type)

@router.post("/payments/{id}/approve")
def approve_payment(
    id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Verifies payment, confirms registration, locks slot, records admin ID and audit log.
    """
    return PaymentService.approve_payment(db, payment_id=id, admin_id=current_admin.id)

@router.post("/payments/{id}/reject")
def reject_payment(
    id: str,
    body: PaymentRejectRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Rejects payment with reason, sets registration to REJECTED (releasing slot), and logs audit.
    """
    return PaymentService.reject_payment(
        db,
        payment_id=id,
        admin_id=current_admin.id,
        reason=body.reason
    )
