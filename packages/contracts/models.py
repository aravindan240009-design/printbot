"""
Core Domain Models & Pydantic Schemas for Xerox Platform (Backend & Workers)
"""

from enum import Enum
from typing import Dict, List, Optional, Any
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
    COMPLETION_UNKNOWN = "COMPLETION_UNKNOWN"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class OrderMode(str, Enum):
    FULL_AUTOMATIC = "FULL_AUTOMATIC"
    MANUAL_APPROVAL = "MANUAL_APPROVAL"


class PrintOptions(BaseModel):
    copies: int = Field(default=1, ge=1, le=500)
    color_mode: ColorMode = ColorMode.BW
    paper_size: PaperSize = PaperSize.A4
    duplex_mode: DuplexMode = DuplexMode.SIMPLEX
    orientation: Orientation = Orientation.PORTRAIT
    binding: BindingType = BindingType.NONE
    paper_gsm: int = Field(default=75, description="Paper thickness in GSM: 75, 80, 100, 120, 200")
    page_range: Optional[str] = Field(default="all", description="Arbitrary valid non-contiguous PDF page ranges, e.g. '1-3,5,8-' or 'all'")
    pages_per_sheet: int = Field(default=1, description="N-up layout: 1, 2, 4, 6, 9, 16")
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


# ==============================================================================
# Phase 1 Domain Models: Subscriptions, Auth, Devices, Assets, Audit
# ==============================================================================

class SubscriptionStatus(str, Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    GRACE = "grace"
    SUSPENDED = "suspended"
    CANCELED = "canceled"


class BillingInterval(str, Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"


class SafetyQuotas(BaseModel):
    max_monthly_bandwidth_bytes: int = 107_374_182_400  # 100 GB
    max_storage_bytes: int = 53_687_091_200            # 50 GB
    max_daily_orders: int = 10_000
    max_burst_requests_per_minute: int = 600


class PlanFeatures(BaseModel):
    unlimited_printers: bool = True
    automatic_routing: bool = True
    timed_xerox: bool = True
    custom_branding: bool = True
    multi_language: bool = True
    advanced_analytics: bool = True
    all_paper_sizes: bool = True


class SubscriptionDetails(BaseModel):
    id: str
    shop_id: str
    plan_id: str = "ALL_INCLUSIVE"
    billing_interval: BillingInterval
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    trial_end: Optional[datetime] = None
    grace_period_end: Optional[datetime] = None
    features: PlanFeatures = Field(default_factory=PlanFeatures)
    quota_limits: SafetyQuotas = Field(default_factory=SafetyQuotas)
    admin_override: bool = False
    admin_override_reason: Optional[str] = None


class StaffRole(str, Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    OPERATOR = "OPERATOR"
    SUPERADMIN = "SUPERADMIN"


class StaffLoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None


class DevicePairingCodeResponse(BaseModel):
    code: str
    shop_id: str
    expires_at: datetime
    ttl_seconds: int


class DevicePairRequest(BaseModel):
    pairing_code: str
    device_identifier: str
    device_name: str
    public_key_pem: str
    os_info: str = "Windows"


class DeviceChallengeResponse(BaseModel):
    device_id: str
    challenge_nonce: str
    expires_at: datetime


class DeviceChallengeProof(BaseModel):
    device_id: str
    challenge_nonce: str
    signature: str


class DeviceTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    device_id: str
    shop_id: str
    expires_in_seconds: int


class DeviceHeartbeatRequest(BaseModel):
    device_id: str
    agent_version: str = "1.0.0"
    status: str = "ONLINE"
    metrics: Dict[str, Any] = Field(default_factory=dict)


class DeviceHeartbeatResponse(BaseModel):
    acknowledged: bool = True
    server_time: datetime = Field(default_factory=datetime.utcnow)
    subscription_warning: Optional[str] = None


class AssetUploadIntentRequest(BaseModel):
    file_name: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str


class AssetUploadIntentResponse(BaseModel):
    asset_id: str
    shop_id: str
    upload_url: str
    storage_path: str
    expires_at: datetime
    upload_headers: Dict[str, str]


class AdminOverrideRequest(BaseModel):
    shop_id: str
    reason: str

