import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Integer, Numeric, DateTime, Enum, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.session import Base

class RegistrationStatus(str, enum.Enum):
    RESERVED = "RESERVED"
    PAYMENT_SUBMITTED = "PAYMENT_SUBMITTED"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class CricketRole(str, enum.Enum):
    BATSMAN = "BATSMAN"
    BOWLER = "BOWLER"
    ALL_ROUNDER = "ALL_ROUNDER"
    WICKET_KEEPER = "WICKET_KEEPER"

def utc_now():
    return datetime.now(timezone.utc)

class Registration(Base):
    __tablename__ = "registrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(32), unique=True, nullable=False, index=True)
    full_name = Column(String(120), nullable=False, index=True)
    mobile = Column(String(20), nullable=False, index=True)
    email = Column(String(120), nullable=True)
    age = Column(Integer, nullable=False)
    city = Column(String(80), nullable=False)
    cricket_role = Column(String(32), nullable=False)
    batting_style = Column(String(32), nullable=True)
    bowling_style = Column(String(32), nullable=True)
    team_name = Column(String(100), nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    photo_path = Column(String(500), nullable=True)
    
    status = Column(
        String(32),
        default=RegistrationStatus.RESERVED.value,
        nullable=False,
        index=True
    )
    amount = Column(Numeric(10, 2), nullable=False)
    reservation_expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    payments = relationship("Payment", back_populates="registration", cascade="all, delete-orphan")

    @property
    def photo_url(self):
        if self.photo_path:
            return f"/api/v1/registrations/{self.registration_id}/photo"
        return None

    __table_args__ = (
        Index("ix_registrations_mobile_status", "mobile", "status"),
    )
