import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from app.models.registration import RegistrationStatus, CricketRole

INDIAN_MOBILE_REGEX = re.compile(r"^(?:(?:\+|00)91[\s-]?)?[6789]\d{9}$")

class RegistrationCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name of player")
    mobile: str = Field(..., description="10-digit Indian mobile number")
    email: Optional[str] = Field(None, max_length=100)
    age: int = Field(..., ge=10, le=80, description="Player age (10 to 80)")
    city: str = Field(..., min_length=2, max_length=80)
    cricket_role: str = Field(..., description="Role: Batsman, Bowler, All-rounder, Wicketkeeper")
    batting_style: Optional[str] = None
    bowling_style: Optional[str] = None
    team_name: Optional[str] = None
    emergency_contact: Optional[str] = None
    photo_path: Optional[str] = None
    terms_accepted: bool = Field(..., description="Must accept terms and conditions")

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean or len(clean) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        return clean

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        cleaned = re.sub(r"[\s-]", "", v.strip())
        if not INDIAN_MOBILE_REGEX.match(cleaned):
            raise ValueError("Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.")
        # Standardize to 10 digits
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("0091"):
            cleaned = cleaned[4:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]
        return cleaned

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must accept the terms and conditions to register.")
        return v

class RegistrationLookupRequest(BaseModel):
    registration_id: str = Field(..., min_length=3, description="Public Registration ID (e.g. CRL-2027-001)")
    mobile: str = Field(..., min_length=10, description="Mobile number used during registration")

from datetime import datetime, timezone

def make_aware_utc(v):
    if v is None:
        return None
    if isinstance(v, datetime):
        if v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v.astimezone(timezone.utc)
    return v

class RegistrationResponse(BaseModel):
    id: str
    registration_id: str
    full_name: str
    mobile: str
    email: Optional[str]
    age: int
    city: str
    cricket_role: str
    batting_style: Optional[str]
    bowling_style: Optional[str]
    team_name: Optional[str]
    photo_path: Optional[str] = None
    photo_url: Optional[str] = None
    status: str
    amount: float
    reservation_expires_at: datetime
    created_at: datetime

    @field_validator("reservation_expires_at", "created_at", mode="before")
    @classmethod
    def ensure_tz_response(cls, v):
        return make_aware_utc(v)

    model_config = ConfigDict(from_attributes=True)

class RegistrationPublicStatus(BaseModel):
    registration_id: str
    full_name: str
    city: str
    cricket_role: str
    status: str
    amount: float
    created_at: datetime
    reservation_expires_at: Optional[datetime] = None
    payment_submitted: bool = False
    utr: Optional[str] = None
    status_message: str
    photo_url: Optional[str] = None
    whatsapp_url: Optional[str] = None
    upi_intent_url: Optional[str] = None

    @field_validator("reservation_expires_at", "created_at", mode="before")
    @classmethod
    def ensure_tz_public(cls, v):
        return make_aware_utc(v)
