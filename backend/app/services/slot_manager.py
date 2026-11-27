from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, select
from fastapi import HTTPException
from app.models.registration import Registration, RegistrationStatus
from app.models.league_settings import LeagueSettings
from app.database.session import engine

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

class SlotManager:
    @staticmethod
    def cleanup_expired_reservations(db: Session) -> int:
        """
        Marks all active reservations whose reservation window has expired as EXPIRED.
        Returns the number of expired reservations updated.
        """
        now = get_utc_now()
        # Quick check without write lock if none expired
        has_expired = db.query(Registration.id).filter(
            Registration.status == RegistrationStatus.RESERVED.value,
            Registration.reservation_expires_at <= now
        ).first()
        if not has_expired:
            return 0

        expired_query = (
            db.query(Registration)
            .filter(
                Registration.status == RegistrationStatus.RESERVED.value,
                Registration.reservation_expires_at <= now
            )
        )
        count = expired_query.update(
            {Registration.status: RegistrationStatus.EXPIRED.value},
            synchronize_session=False
        )
        if count > 0:
            db.commit()
        return count

    @staticmethod
    def get_availability(db: Session) -> Dict[str, Any]:
        """
        Calculates live slot statistics and availability.
        Always runs expiry cleanup first to guarantee accurate counts.
        """
        SlotManager.cleanup_expired_reservations(db)
        
        settings = db.query(LeagueSettings).filter(LeagueSettings.id == 1).first()
        if not settings:
            settings = LeagueSettings(id=1)
            db.add(settings)
            db.commit()
            db.refresh(settings)

        max_capacity = settings.maximum_registrations
        now = get_utc_now()

        confirmed_count = db.query(func.count(Registration.id)).filter(
            Registration.status == RegistrationStatus.CONFIRMED.value
        ).scalar() or 0

        submitted_count = db.query(func.count(Registration.id)).filter(
            Registration.status == RegistrationStatus.PAYMENT_SUBMITTED.value
        ).scalar() or 0

        reserved_count = db.query(func.count(Registration.id)).filter(
            Registration.status == RegistrationStatus.RESERVED.value,
            Registration.reservation_expires_at > now
        ).scalar() or 0

        rejected_count = db.query(func.count(Registration.id)).filter(
            Registration.status == RegistrationStatus.REJECTED.value
        ).scalar() or 0

        expired_count = db.query(func.count(Registration.id)).filter(
            Registration.status == RegistrationStatus.EXPIRED.value
        ).scalar() or 0

        occupied_count = confirmed_count + submitted_count + reserved_count
        available_slots = max(0, max_capacity - occupied_count)
        
        is_open = settings.registration_open
        if settings.registration_deadline and now > ensure_utc(settings.registration_deadline):
            is_open = False
        if available_slots <= 0:
            is_open = False

        return {
            "maximum_capacity": max_capacity,
            "confirmed_count": confirmed_count,
            "payment_submitted_count": submitted_count,
            "reserved_count": reserved_count,
            "rejected_count": rejected_count,
            "expired_count": expired_count,
            "occupied_count": occupied_count,
            "available_slots": available_slots,
            "registration_open": is_open,
            "registration_fee": float(settings.registration_fee),
            "registration_deadline": settings.registration_deadline.isoformat() if settings.registration_deadline else None,
            "league_name": settings.league_name,
            "tournament_title": settings.tournament_title,
        }

    @staticmethod
    def generate_next_registration_id(db: Session, prefix: str, year: int) -> str:
        """
        Generates a sequence ID in format: PREFIX-YEAR-001
        """
        pattern = f"{prefix}-{year}-%"
        count = db.query(func.count(Registration.id)).filter(
            Registration.registration_id.like(pattern)
        ).scalar() or 0
        
        sequence_num = count + 1
        while True:
            candidate = f"{prefix}-{year}-{sequence_num:03d}"
            exists = db.query(Registration.id).filter(Registration.registration_id == candidate).first()
            if not exists:
                return candidate
            sequence_num += 1

    @staticmethod
    def reserve_slot(db: Session, registration_data: dict) -> Registration:
        """
        Concurrency-safe atomic slot reservation.
        Acquires row-lock on league_settings row (Postgres FOR UPDATE),
        checks live active count, generates unique registration ID,
        and saves registration with RESERVED status.
        """
        now = get_utc_now()
        
        # 1. Clean up expired reservations first
        SlotManager.cleanup_expired_reservations(db)

        # 2. Acquire lock on LeagueSettings to serialize concurrent registration requests
        query = db.query(LeagueSettings).filter(LeagueSettings.id == 1)
        if engine.dialect.name == "postgresql":
            query = query.with_for_update()
        settings = query.first()

        if not settings:
            settings = LeagueSettings(id=1)
            db.add(settings)
            db.commit()
            db.refresh(settings)

        # Check if registrations are open
        if not settings.registration_open:
            raise HTTPException(status_code=400, detail="Registrations are currently closed by the administrator.")
        
        if settings.registration_deadline and now > ensure_utc(settings.registration_deadline):
            raise HTTPException(status_code=400, detail="Registration deadline has passed.")

        # Check active mobile registration (prevent duplicate active registration)
        mobile = registration_data.get("mobile", "").strip()
        active_for_mobile = db.query(Registration).filter(
            Registration.mobile == mobile,
            Registration.status.in_([
                RegistrationStatus.CONFIRMED.value,
                RegistrationStatus.PAYMENT_SUBMITTED.value,
                RegistrationStatus.RESERVED.value,
            ])
        ).first()

        if active_for_mobile:
            if active_for_mobile.status == RegistrationStatus.RESERVED.value:
                if ensure_utc(active_for_mobile.reservation_expires_at) > now:
                    raise HTTPException(
                        status_code=400,
                        detail=f"An active reservation ({active_for_mobile.registration_id}) already exists for mobile {mobile}. Please complete payment or wait for it to expire."
                    )
                else:
                    active_for_mobile.status = RegistrationStatus.EXPIRED.value
                    db.commit()
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Mobile number {mobile} is already registered under Registration ID {active_for_mobile.registration_id}. Only one registration per contact number is allowed."
                )

        # Count total active slots: CONFIRMED + PAYMENT_SUBMITTED + RESERVED(unexpired)
        active_count = db.query(func.count(Registration.id)).filter(
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

        if active_count >= settings.maximum_registrations:
            raise HTTPException(
                status_code=400,
                detail=f"Registration capacity of {settings.maximum_registrations} has been reached. No slots available."
            )

        # Generate unique Registration ID
        registration_id = SlotManager.generate_next_registration_id(
            db,
            prefix=settings.registration_prefix,
            year=settings.registration_year
        )

        expires_at = now + timedelta(minutes=settings.reservation_minutes)

        new_reg = Registration(
            registration_id=registration_id,
            full_name=registration_data["full_name"].strip(),
            mobile=mobile,
            email=(registration_data.get("email") or "").strip() or None,
            age=registration_data["age"],
            city=registration_data["city"].strip(),
            cricket_role=registration_data["cricket_role"],
            batting_style=registration_data.get("batting_style"),
            bowling_style=registration_data.get("bowling_style"),
            team_name=(registration_data.get("team_name") or "").strip() or None,
            emergency_contact=(registration_data.get("emergency_contact") or "").strip() or None,
            photo_path=registration_data.get("photo_path"),
            status=RegistrationStatus.RESERVED.value,
            amount=settings.registration_fee,
            reservation_expires_at=expires_at,
        )

        db.add(new_reg)
        db.commit()
        db.refresh(new_reg)
        return new_reg
