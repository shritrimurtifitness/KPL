from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, field_validator
from app.schemas.registration import RegistrationResponse, make_aware_utc
from app.schemas.payment import PaymentResponse

class DashboardOverviewStats(BaseModel):
    maximum_capacity: int
    active_reservations: int
    confirmed_registrations: int
    pending_verifications: int
    available_slots: int
    rejected_registrations: int
    expired_registrations: int
    total_verified_collection: float
    registration_open: bool

class RegistrationDetailResponse(BaseModel):
    id: str
    registration_id: str
    full_name: str
    mobile: str
    email: Optional[str] = None
    age: int
    city: str
    cricket_role: str
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    team_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    photo_path: Optional[str] = None
    photo_url: Optional[str] = None
    status: str
    amount: float
    reservation_expires_at: datetime
    created_at: datetime
    payments: List[PaymentResponse] = []

    @field_validator("reservation_expires_at", "created_at", mode="before")
    @classmethod
    def ensure_tz_detail(cls, v):
        return make_aware_utc(v)

    model_config = ConfigDict(from_attributes=True)

class PaginatedRegistrationsResponse(BaseModel):
    items: List[RegistrationDetailResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
