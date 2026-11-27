from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.database.session import get_db
from app.core.deps import get_current_admin
from app.models.admin import Admin
from app.models.registration import Registration, RegistrationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.league_settings import LeagueSettings
from app.schemas.dashboard import (
    DashboardOverviewStats,
    RegistrationDetailResponse,
    PaginatedRegistrationsResponse
)
from app.services.slot_manager import SlotManager, get_utc_now
from app.services.export_service import ExportService

router = APIRouter()

@router.get("/dashboard", response_model=DashboardOverviewStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Computes key performance indicators for the admin dashboard.
    Verified collection is calculated strictly from confirmed payments.
    """
    SlotManager.cleanup_expired_reservations(db)

    settings = db.query(LeagueSettings).filter(LeagueSettings.id == 1).first()
    max_capacity = settings.maximum_registrations if settings else 120
    now = get_utc_now()

    confirmed_count = db.query(func.count(Registration.id)).filter(
        Registration.status == RegistrationStatus.CONFIRMED.value
    ).scalar() or 0

    pending_count = db.query(func.count(Registration.id)).filter(
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

    occupied = confirmed_count + pending_count + reserved_count
    available = max(0, max_capacity - occupied)

    # Calculate verified collection strictly from payments with VERIFIED status
    verified_collection = db.query(func.sum(Payment.amount)).filter(
        Payment.status == PaymentStatus.VERIFIED.value
    ).scalar() or 0.0

    return DashboardOverviewStats(
        maximum_capacity=max_capacity,
        active_reservations=reserved_count,
        confirmed_registrations=confirmed_count,
        pending_verifications=pending_count,
        available_slots=available,
        rejected_registrations=rejected_count,
        expired_registrations=expired_count,
        total_verified_collection=float(verified_collection),
        registration_open=settings.registration_open if settings else True
    )

@router.get("/registrations", response_model=PaginatedRegistrationsResponse)
def list_registrations(
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by ID, name, mobile, or UTR"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Searchable, filterable and paginated registrations list.
    """
    SlotManager.cleanup_expired_reservations(db)

    query = db.query(Registration).outerjoin(Payment, Registration.id == Payment.registration_id)

    if status and status.upper() != "ALL":
        query = query.filter(Registration.status == status.upper())

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Registration.registration_id.ilike(s),
                Registration.full_name.ilike(s),
                Registration.mobile.ilike(s),
                Registration.email.ilike(s),
                Payment.utr.ilike(s),
            )
        )

    # Distinct registrations
    query = query.distinct()
    total = query.count()

    items = (
        query.order_by(Registration.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedRegistrationsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/registrations/{id}", response_model=RegistrationDetailResponse)
def get_registration_detail(
    id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Returns full details of a specific registration including payment records.
    """
    reg = db.query(Registration).filter(
        or_(Registration.id == id, Registration.registration_id == id)
    ).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found.")
    return reg

@router.get("/export")
def export_registrations(
    format: str = Query("csv", pattern="^(csv|excel)$"),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    """
    Exports registrations as CSV or Excel. Strictly restricted to authorized admins.
    """
    now_str = get_utc_now().strftime("%Y%m%d_%H%M%S")
    if format == "csv":
        csv_file = ExportService.generate_csv(db)
        filename = f"cricket_registrations_{now_str}.csv"
        return StreamingResponse(
            csv_file,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        excel_file = ExportService.generate_excel(db)
        filename = f"cricket_registrations_{now_str}.xlsx"
        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
