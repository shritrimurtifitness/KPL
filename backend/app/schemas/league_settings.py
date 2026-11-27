from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class LeagueSettingsPublic(BaseModel):
    league_name: str
    tournament_title: str
    registration_fee: float
    maximum_registrations: int
    registration_open: bool
    registration_deadline: Optional[datetime] = None
    reservation_minutes: int
    upi_id: str
    upi_display_name: str
    upi_qr_path: Optional[str] = None
    whatsapp_number: str
    terms_and_conditions: str
    registration_instructions: str
    max_upload_size_mb: int

    model_config = ConfigDict(from_attributes=True)

class LeagueSettingsAdmin(LeagueSettingsPublic):
    id: int
    registration_prefix: str
    registration_year: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LeagueSettingsUpdate(BaseModel):
    league_name: Optional[str] = None
    tournament_title: Optional[str] = None
    registration_fee: Optional[float] = Field(None, gt=0)
    maximum_registrations: Optional[int] = Field(None, ge=1)
    registration_open: Optional[bool] = None
    registration_deadline: Optional[datetime] = None
    reservation_minutes: Optional[int] = Field(None, ge=1, le=120)
    upi_id: Optional[str] = None
    upi_display_name: Optional[str] = None
    whatsapp_number: Optional[str] = None
    registration_prefix: Optional[str] = None
    registration_year: Optional[int] = None
    terms_and_conditions: Optional[str] = None
    registration_instructions: Optional[str] = None
    max_upload_size_mb: Optional[int] = Field(None, ge=1, le=20)
