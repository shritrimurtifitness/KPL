import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import Column, String, Numeric, DateTime, Enum, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.registration import utc_now

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    utr = Column(String(64), unique=True, nullable=False, index=True)
    screenshot_path = Column(String(500), nullable=False)
    status = Column(
        String(32),
        default=PaymentStatus.PENDING.value,
        nullable=False,
        index=True
    )
    submitted_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(36), ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    registration = relationship("Registration", back_populates="payments")
    verifier = relationship("Admin", foreign_keys=[verified_by])
