from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from app.database.session import get_db
from app.core.deps import get_current_admin
from app.models.admin import Admin
from app.models.league_settings import LeagueSettings
from app.models.registration import Registration, RegistrationStatus
from app.models.payment import Payment
from app.models.audit_log import AuditLog
from app.schemas.league_settings import LeagueSettingsAdmin, LeagueSettingsUpdate
from app.services.slot_manager import SlotManager, get_utc_now

router = APIRouter()

@router.get("/settings", response_model=LeagueSettingsAdmin)
def get_admin_settings(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    settings = db.query(LeagueSettings).filter(LeagueSettings.id == 1).first()
    if not settings:
        settings = LeagueSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings", response_model=LeagueSettingsAdmin)
def update_admin_settings(
    data: LeagueSettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    SlotManager.cleanup_expired_reservations(db)

    settings = db.query(LeagueSettings).filter(LeagueSettings.id == 1).first()
    if not settings:
        settings = LeagueSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    now = get_utc_now()
    updates = data.model_dump(exclude_unset=True)

    # 1. Capacity validation: cannot reduce below currently occupied slots
    if "maximum_registrations" in updates and updates["maximum_registrations"] is not None:
        new_capacity = updates["maximum_registrations"]
        occupied_count = db.query(func.count(Registration.id)).filter(
            or_(
                Registration.status.in_([
                    RegistrationStatus.CONFIRMED.value,
                    RegistrationStatus.PAYMENT_SUBMITTED.value,
                ]),
                and_(
                    Registration.status == RegistrationStatus.RESERVED.value,
                    Registration.reservation_expires_at > now
                )
            )
        ).scalar() or 0

        if new_capacity < occupied_count:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reduce capacity to {new_capacity}. There are currently {occupied_count} active or confirmed registrations."
            )

    # 2. Fee validation: cannot change fee if payments have already been submitted
    if "registration_fee" in updates and updates["registration_fee"] is not None:
        new_fee = updates["registration_fee"]
        if float(new_fee) != float(settings.registration_fee):
            submitted_payments_count = db.query(func.count(Payment.id)).scalar() or 0
            if submitted_payments_count > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot change registration fee after payments have already been submitted by players."
                )

    # Apply updates
    for field, val in updates.items():
        setattr(settings, field, val)

    # Audit log
    audit = AuditLog(
        admin_id=current_admin.id,
        action="SETTINGS_UPDATED",
        entity_type="league_settings",
        entity_id="1",
        description=f"Admin {current_admin.email} updated league settings ({', '.join(updates.keys())})."
    )
    db.add(audit)
    db.commit()
    db.refresh(settings)

    return settings
