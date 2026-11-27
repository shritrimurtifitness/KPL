from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Text
from app.database.session import Base
from app.models.registration import utc_now

class LeagueSettings(Base):
    __tablename__ = "league_settings"

    id = Column(Integer, primary_key=True, default=1)
    league_name = Column(String(150), default="Premier Cricket Championship", nullable=False)
    tournament_title = Column(String(200), default="Season 2027 Registration", nullable=False)
    registration_fee = Column(Numeric(10, 2), default=100.00, nullable=False)
    maximum_registrations = Column(Integer, default=120, nullable=False)
    registration_open = Column(Boolean, default=True, nullable=False)
    registration_deadline = Column(DateTime(timezone=True), nullable=True)
    reservation_minutes = Column(Integer, default=10, nullable=False)
    
    # UPI and Payment details
    upi_id = Column(String(100), default="cricketleague@upi", nullable=False)
    upi_display_name = Column(String(150), default="Cricket League Official", nullable=False)
    upi_qr_path = Column(String(500), nullable=True)
    
    # Contact and Identification
    whatsapp_number = Column(String(20), default="+919876543210", nullable=False)
    registration_prefix = Column(String(20), default="CRL", nullable=False)
    registration_year = Column(Integer, default=2027, nullable=False)
    
    # Text and Rules
    terms_and_conditions = Column(Text, default="1. Players must report with official ID.\n2. Registration fee is non-refundable.\n3. Fair play and sportsmanship are strictly enforced.", nullable=False)
    registration_instructions = Column(Text, default="Scan the QR code or pay to the UPI ID. Upload the payment screenshot and enter the exact 12-digit UTR reference number.", nullable=False)
    max_upload_size_mb = Column(Integer, default=3, nullable=False)
    
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
