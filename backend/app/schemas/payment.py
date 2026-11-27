from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class PaymentProofSubmission(BaseModel):
    registration_id: str
    utr: str

class PaymentRejectRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Reason for rejecting payment proof")

class PaymentResponse(BaseModel):
    id: str
    registration_id: str
    amount: float
    utr: Optional[str] = None
    screenshot_path: str
    screenshot_url: Optional[str] = None
    status: str
    submitted_at: datetime
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    rejection_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PendingPaymentItem(BaseModel):
    payment_id: str
    registration_id: str
    player_name: str
    mobile: str
    amount: float
    utr: Optional[str] = None
    status: str
    submitted_at: datetime
    screenshot_url: str
    player_photo_url: Optional[str] = None
