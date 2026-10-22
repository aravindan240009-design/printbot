"""
Core Domain Models & Pydantic Schemas for Xerox Platform (Backend & Workers)
"""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime


class ColorMode(str, Enum):
    BW = "bw"
    COLOR = "color"


class PaperSize(str, Enum):
    A4 = "A4"
    A3 = "A3"
    LEGAL = "Legal"
    LETTER = "Letter"


class DuplexMode(str, Enum):
    SIMPLEX = "simplex"
    DUPLEX_LONG = "duplex_long"
    DUPLEX_SHORT = "duplex_short"


class Orientation(str, Enum):
    PORTRAIT = "portrait"
    LANDSCAPE = "landscape"


class BindingType(str, Enum):
    NONE = "none"
    STAPLE = "staple"
    SPIRAL = "spiral"
    HARD_BIND = "hard_bind"


class JobStatus(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    QUEUED = "QUEUED"
    SPOOLING = "SPOOLING"
    PRINTING = "PRINTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class PrintOptions(BaseModel):
    copies: int = Field(default=1, ge=1, le=500)
    color_mode: ColorMode = ColorMode.BW
    paper_size: PaperSize = PaperSize.A4
    duplex_mode: DuplexMode = DuplexMode.SIMPLEX
    orientation: Orientation = Orientation.PORTRAIT
    binding: BindingType = BindingType.NONE
    paper_gsm: int = Field(default=75, description="Paper thickness in GSM: 75, 80, 100, 120, 200")
    notes: Optional[str] = None


class PricingRule(BaseModel):
    base_page_bw: int = 5  # cents ($0.05)
    base_page_color: int = 25  # cents ($0.25)
    duplex_discount_percent: int = 15  # 15% discount on double-sided sheets
    paper_size_multiplier: Dict[PaperSize, float] = {
        PaperSize.A4: 1.0,
        PaperSize.A3: 2.0,
        PaperSize.LEGAL: 1.25,
        PaperSize.LETTER: 1.0,
    }
    binding_cost_cents: Dict[BindingType, int] = {
        BindingType.NONE: 0,
        BindingType.STAPLE: 50,
        BindingType.SPIRAL: 250,
        BindingType.HARD_BIND: 600,
    }
    gsm_addon_cents: Dict[int, int] = {
        75: 0,
        80: 2,
        100: 5,
        120: 10,
        200: 25,
    }


class PrintJobCreateRequest(BaseModel):
    file_name: str
    file_size_bytes: int = Field(ge=1, le=100_000_000)
    page_count: int = Field(ge=1, le=5000)
    options: PrintOptions
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    idempotency_key: Optional[str] = None


class PrintJobResponse(BaseModel):
    id: str
    tenant_id: str
    customer_email: str
    customer_phone: Optional[str] = None
    file_name: str
    file_size_bytes: int
    page_count: int
    options: PrintOptions
    calculated_price_cents: int
    currency: str = "USD"
    status: JobStatus
    payment_intent_id: Optional[str] = None
    spooler_job_id: Optional[str] = None
    workstation_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PaymentWebhookPayload(BaseModel):
    event_id: str
    event_type: str
    tenant_id: str
    payment_intent_id: str
    amount_cents: int
    currency: str = "USD"
    timestamp: int


class PrinterDevice(BaseModel):
    id: str
    name: str
    is_default: bool = False
    is_online: bool = True
    status_text: str = "Ready"
    supported_sizes: List[PaperSize] = [PaperSize.A4, PaperSize.LETTER, PaperSize.LEGAL, PaperSize.A3]
    supports_color: bool = True
    supports_duplex: bool = True


class WorkstationSpoolEvent(BaseModel):
    workstation_id: str
    tenant_id: str
    job_id: str
    spooler_job_id: str
    status: str  # 'SPOOLED', 'PRINTING', 'COMPLETED', 'ERROR'
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ReconciliationRequest(BaseModel):
    workstation_id: str
    tenant_id: str
    spooled_job_ids: List[str]


class ReconciliationResponse(BaseModel):
    confirmed_job_ids: List[str]
    re_spool_required_job_ids: List[str]
    invalid_job_ids: List[str]
    server_timestamp: datetime = Field(default_factory=datetime.utcnow)
