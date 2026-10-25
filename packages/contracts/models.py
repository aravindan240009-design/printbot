"""
Core Domain Models & Pydantic Schemas for Xerox Platform (Backend & Workers)
"""

import uuid
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime


class ColorMode(str, Enum):
    BW = "bw"
    COLOR = "color"
    GRAYSCALE = "grayscale"


class PaperSize(str, Enum):
    A4 = "A4"
    A3 = "A3"
    A5 = "A5"
    LEGAL = "Legal"
    LETTER = "Letter"


class DuplexMode(str, Enum):
    SIMPLEX = "simplex"
    DUPLEX_LONG = "duplex_long"
    DUPLEX_SHORT = "duplex_short"


class Orientation(str, Enum):
    PORTRAIT = "portrait"
    LANDSCAPE = "landscape"
    AUTO = "auto"


class BindingType(str, Enum):
    NONE = "none"
    STAPLE = "staple"
    SPIRAL = "spiral"
    HARD_BIND = "hard_bind"


class PhotoLayoutPreset(str, Enum):
    STANDARD = "standard"
    PASSPORT_8UP = "passport_8up"
    ID_FRONT_BACK = "id_front_back"


class SupportedFormat(str, Enum):
    PDF = "pdf"
    JPEG = "jpeg"
    PNG = "png"
    WEBP = "webp"
    TIFF = "tiff"
    BMP = "bmp"
    SVG = "svg"
    DOCX = "docx"
    ODT = "odt"
    RTF = "rtf"
    XLSX = "xlsx"
    ODS = "ods"
    CSV = "csv"
    PPTX = "pptx"
    ODP = "odp"
    TXT = "txt"
    UNSUPPORTED = "unsupported"


class JobStatus(str, Enum):
    # Phase 4: Canonical 20-State Machine
    DRAFT = "DRAFT"
    VALIDATING = "VALIDATING"
    READY_TO_QUOTE = "READY_TO_QUOTE"
    AWAITING_PAYMENT = "AWAITING_PAYMENT"
    PAYMENT_VERIFYING = "PAYMENT_VERIFYING"
    PAID_HELD = "PAID_HELD"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    QUEUED = "QUEUED"
    LEASED = "LEASED"
    SPOOL_SUBMITTED = "SPOOL_SUBMITTED"
    COMPLETION_UNKNOWN = "COMPLETION_UNKNOWN"
    PRINT_CONFIRMED = "PRINT_CONFIRMED"
    READY_FOR_PICKUP = "READY_FOR_PICKUP"
    COLLECTED = "COLLECTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"
    EXPIRED = "EXPIRED"
    # Backward compatibility aliases
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    SPOOLING = "SPOOLING"
    PRINTING = "PRINTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class BookingState(str, Enum):
    NONE = "NONE"
    SCHEDULED_PRINT = "SCHEDULED_PRINT"
    RESERVED_PICKUP_SLOT = "RESERVED_PICKUP_SLOT"
    ASSISTED_COUNTER_XEROX = "ASSISTED_COUNTER_XEROX"


class PaymentMethod(str, Enum):
    UPI = "UPI"
    CASH = "CASH"
    CARD = "CARD"
    NETBANKING = "NETBANKING"


class PaymentProviderType(str, Enum):
    MOCK = "MOCK"
    RAZORPAY = "RAZORPAY"
    CASH = "CASH"


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
    photo_layout: PhotoLayoutPreset = PhotoLayoutPreset.STANDARD
    scaling: str = Field(default="fit", description="actual, fit, fill, percentage")
    reverse_order: bool = False
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
    order_mode: Optional[OrderMode] = None
    booking_state: BookingState = BookingState.NONE
    quote_hash: Optional[str] = None
    payment_method: Optional[str] = "UPI"


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
    total_paise: int = 0
    currency: str = "USD"
    status: JobStatus
    order_mode: OrderMode = OrderMode.FULL_AUTOMATIC
    booking_state: BookingState = BookingState.NONE
    version: int = 1
    payment_intent_id: Optional[str] = None
    spooler_job_id: Optional[str] = None
    workstation_id: Optional[str] = None
    hold_reason: Optional[str] = None
    rejection_reason: Optional[str] = None
    refund_id: Optional[str] = None
    lease_expires_at: Optional[datetime] = None
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


# ==============================================================================
# Phase 2: Document Processing, Conversion, & Multi-File Quoting Contracts
# ==============================================================================

class FileScanResult(BaseModel):
    asset_id: Optional[str] = None
    is_valid: bool
    format: SupportedFormat
    mime_type: str
    file_size_bytes: int
    page_count: int
    is_encrypted: bool = False
    needs_password: bool = False
    width_pts: Optional[float] = None
    height_pts: Optional[float] = None
    has_macros: bool = False
    error_message: Optional[str] = None
    detected_pages: List[int] = Field(default_factory=list)


class UnlockPdfRequest(BaseModel):
    asset_id: str
    password: str


class UnlockPdfResponse(BaseModel):
    asset_id: str
    is_unlocked: bool
    page_count: int
    error_message: Optional[str] = None


class FileQuoteItemRequest(BaseModel):
    file_id: str
    file_name: str
    page_count: int
    options: PrintOptions


class FileQuoteItemResponse(BaseModel):
    file_id: str
    file_name: str
    page_count: int
    logical_pages: int
    rendered_sides: int
    physical_sheets: int
    cost_paise: int
    cost_rupees: float
    cost_cents: int
    options: PrintOptions


class MultiFileQuoteRequest(BaseModel):
    shop_id: str
    items: List[FileQuoteItemRequest]
    apply_to_all_options: Optional[PrintOptions] = None


class MultiFileQuoteResponse(BaseModel):
    quote_id: str
    quote_hash: str
    expires_at: datetime
    shop_id: str
    pricing_version: int
    total_paise: int
    total_rupees: float
    total_cents: int
    currency: str = "INR"
    total_logical_pages: int
    total_rendered_sides: int
    total_physical_sheets: int
    items: List[FileQuoteItemResponse]


class PhotoLayoutRequest(BaseModel):
    asset_id: str
    layout_preset: PhotoLayoutPreset
    copies: int = 1
    paper_size: PaperSize = PaperSize.A4
    dpi: int = 300


class PhotoLayoutResponse(BaseModel):
    composite_asset_id: str
    layout_preset: PhotoLayoutPreset
    preview_url: str
    width_px: int
    height_px: int
    dpi: int


# ==============================================================================
# Phase 5: Timed Xerox, Physical Bookings, Service Catalogue & Scheduling
# ==============================================================================

class ServiceType(str, Enum):
    SCHEDULE_PRINT = "SCHEDULE_PRINT"                      # Upload now, prints at scheduled future time
    READY_BY_SLOT = "READY_BY_SLOT"                        # Reserve guaranteed ready-by/pickup window
    PHYSICAL_XEROX_BOOKING = "PHYSICAL_XEROX_BOOKING"      # Customer brings physical paper originals to counter
    TIMED_SELF_SERVICE_COPIER = "TIMED_SELF_SERVICE_COPIER"# Optional kiosk session (Hardware unverified)


class BookingStatus(str, Enum):
    CONFIRMED = "CONFIRMED"
    CHECKED_IN = "CHECKED_IN"
    IN_PROGRESS = "IN_PROGRESS"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    NO_SHOW = "NO_SHOW"
    MISSED_SLOT = "MISSED_SLOT"


class AvailableSlot(BaseModel):
    slot_id: str
    slot_start: datetime
    slot_end: datetime
    capacity_total: int
    capacity_available: int
    is_rush: bool = False
    rush_surcharge_paise: int = 0


class ShopServiceCatalogue(BaseModel):
    shop_id: str
    time_zone: str = "Asia/Kolkata"
    services_enabled: Dict[str, bool] = Field(
        default_factory=lambda: {
            ServiceType.SCHEDULE_PRINT.value: True,
            ServiceType.READY_BY_SLOT.value: True,
            ServiceType.PHYSICAL_XEROX_BOOKING.value: True,
            ServiceType.TIMED_SELF_SERVICE_COPIER.value: False,  # Feature flag disabled until hardware validated
        }
    )
    slot_duration_minutes: int = 15
    capacity_per_slot: int = 4
    lead_time_minutes: int = 30
    last_booking_cutoff_minutes: int = 60
    operating_hours: Dict[str, Dict[str, str]] = Field(
        default_factory=lambda: {
            "monday_to_saturday": {"open": "08:30", "close": "21:30"},
            "sunday": {"open": "10:00", "close": "18:00"},
        }
    )
    closed_dates: List[str] = Field(default_factory=list)
    rush_surcharge_paise: int = 2000
    minimum_bill_paise: int = 1000
    cancellation_cutoff_minutes: int = 60
    counter_checkin_method: str = "QR_AND_PIN"


class BookingCreateRequest(BaseModel):
    shop_id: str
    service_type: ServiceType
    slot_start: datetime
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    order_id: Optional[str] = None
    estimated_pages: Optional[int] = 1
    copies: int = 1
    options: Optional[PrintOptions] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: str
    booking_reference: str
    shop_id: str
    service_type: ServiceType
    status: BookingStatus
    customer_email: str
    customer_phone: Optional[str] = None
    order_id: Optional[str] = None
    slot_start: datetime
    slot_end: datetime
    pickup_code: str
    estimated_pages: int
    revised_pages: Optional[int] = None
    quoted_paise: int
    revised_paise: Optional[int] = None
    is_physical_originals_required: bool
    human_instruction: str
    staff_assigned_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReviseEstimateRequest(BaseModel):
    revised_pages: int
    staff_id: str = "staff@shop.com"
    reason: str = "Staff verified physical count at counter"


class PhoneCaptureRequest(BaseModel):
    shop_id: str
    images_base64: List[str]
    rotate_degrees: Optional[int] = 0
    target_dpi: int = 200


class PhoneCaptureResponse(BaseModel):
    asset_id: str
    page_count: int
    pdf_url: str
    file_size_bytes: int
    legibility_confirmed: bool = True


# ==============================================================================
# Phase 6: Super Admin, Licensing, Fleet, Security Hardening & Pilot Readiness
# ==============================================================================

class SuperAdminRole(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    SUPPORT_OPERATOR = "SUPPORT_OPERATOR"
    AUDITOR = "AUDITOR"


class ShopLifecycleStatus(str, Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    OFFBOARDED = "OFFBOARDED"


class HardwareAssurance(str, Enum):
    TPM_2_0 = "TPM_2_0"
    SOFTWARE_FALLBACK = "SOFTWARE_FALLBACK"


class ReleaseChannel(str, Enum):
    DEV_UNSIGNED = "dev_unsigned"
    BETA_TESTED = "beta_tested"
    PRODUCTION_SIGNED = "production_signed"


class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class BreakGlassRequest(BaseModel):
    shop_id: str
    reason: str
    duration_minutes: int = 30


class BreakGlassResponse(BaseModel):
    id: str
    shop_id: str
    requester_id: str
    approver_id: Optional[str] = None
    reason: str
    session_token: str
    expires_at: datetime
    status: str
    can_access_documents: bool = False
    notice: str = "Zero-retention emergency support session active. Document downloads strictly blocked."


class StepUpChallengeRequest(BaseModel):
    action_type: str


class StepUpChallengeResponse(BaseModel):
    challenge_id: str
    action_type: str
    expires_at: datetime
    message: str = "Re-enter password or active TOTP code to confirm elevated action."


class StepUpVerifyRequest(BaseModel):
    challenge_id: str
    password: Optional[str] = None
    totp_code: Optional[str] = None


class ShopOnboardRequest(BaseModel):
    name: str
    slug: str
    owner_email: str
    owner_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: str = "Chennai"
    state_code: str = "33"  # Tamil Nadu
    order_mode: OrderMode = OrderMode.FULL_AUTOMATIC
    parent_shop_id: Optional[str] = None


class ShopOnboardResponse(BaseModel):
    shop_id: str
    name: str
    slug: str
    status: ShopLifecycleStatus
    qr_link: str
    plan_id: str = "ALL_INCLUSIVE"
    billing_interval: BillingInterval = BillingInterval.MONTHLY
    trial_end: datetime


class ShopTaxInvoice(BaseModel):
    id: str
    shop_id: str
    invoice_number: str
    billing_period_start: datetime
    billing_period_end: datetime
    base_paise: int
    cgst_paise: int
    sgst_paise: int
    igst_paise: int
    total_paise: int
    sac_code: str = "998313"
    hsn_description: str = "Information Technology Software Services for Print Automation"
    state_code: str = "33"
    status: str = "PAID"
    created_at: datetime


class SuperAdminKPIs(BaseModel):
    active_subscribers: int
    mrr_paise: int
    arr_paise: int
    churn_rate_pct: float
    total_devices: int
    active_devices_24h: int
    queue_age_seconds_p50: float
    queue_age_seconds_p95: float
    failure_rate_pct: float
    total_sheets_printed: int
    processing_cost_paise: int
    storage_cost_paise: int
    open_incidents: int


class FleetRelease(BaseModel):
    version: str
    release_channel: ReleaseChannel
    download_url: str
    sha256_hash: str
    signature_verified: bool
    min_supported_version: str
    is_critical: bool
    grace_period_hours: int = 72
    rollout_percentage: int = 100
    release_notes: Optional[str] = None
    created_at: datetime


class FleetTelemetryReport(BaseModel):
    device_id: str
    shop_id: str
    agent_version: str
    uptime_seconds: int
    jobs_processed: int
    raster_avg_ms: float
    sheets_printed: int
    spool_errors_count: int
    hardware_status: str = "HEALTHY"


class DiagnosticBundleSubmit(BaseModel):
    shop_id: str
    device_id: str
    operator_consented: bool = True
    redaction_verified: bool = True
    log_summary: Dict[str, Any] = Field(default_factory=dict)


class DiagnosticBundleResponse(BaseModel):
    bundle_ref: str
    shop_id: str
    device_id: str
    received_at: datetime
    status: str = "STORED_REDACTED"


class ShopMicrositePreview(BaseModel):
    shop_id: str
    shop_name: str
    slug: str
    order_mode: OrderMode
    brand_primary_color: str
    logo_url: Optional[str] = None
    supported_languages: List[str]
    services_enabled: Dict[str, bool]
    allowed_file_types: List[str]
    pricing_summary: Dict[str, int]
    operating_hours: Dict[str, Any]
    retention_hours: int


class StolenDeviceReport(BaseModel):
    device_id: str
    shop_id: str
    incident_notes: str
    generate_replacement_pairing_code: bool = True


# ==============================================================================
# Phase 7: Advanced Print Studio, Optional Hardware Adapters & Differentiation
# ==============================================================================

class BookletSignature(BaseModel):
    sheet_number: int
    front_left: Optional[int] = None
    front_right: Optional[int] = None
    back_left: Optional[int] = None
    back_right: Optional[int] = None


class BookletImpositionRequest(BaseModel):
    page_count: int
    paper_size: PaperSize = PaperSize.A4
    duplex_mode: DuplexMode = DuplexMode.DUPLEX_LONG


class BookletImpositionResponse(BaseModel):
    total_input_pages: int
    total_sheets: int
    signatures: List[BookletSignature]
    imposition_type: str = "SADDLE_STITCH_4UP"


class MixedColorPageBreakdown(BaseModel):
    page_number: int
    is_color: bool
    coverage_percent: float = 0.0


class MixedColorQuoteRequest(BaseModel):
    shop_id: str
    total_pages: int
    page_breakdown: List[MixedColorPageBreakdown]
    copies: int = 1
    paper_size: PaperSize = PaperSize.A4


class MixedColorQuoteResponse(BaseModel):
    shop_id: str
    total_pages: int
    copies: int
    bw_pages_per_copy: int
    color_pages_per_copy: int
    bw_rate_paise: int
    color_rate_paise: int
    total_bw_paise: int
    total_color_paise: int
    total_paise: int
    pricing_strategy: str = "ACCURATE_PER_PAGE_SPLIT"


class PosterTile(BaseModel):
    tile_col: int
    tile_row: int
    crop_box_mm: List[float]


class PosterTiledLayoutRequest(BaseModel):
    input_asset_id: str
    grid_cols: int = 2
    grid_rows: int = 2
    overlap_bleed_mm: float = 10.0
    target_paper_size: PaperSize = PaperSize.A4


class PosterTiledLayoutResponse(BaseModel):
    total_tiles: int
    grid_cols: int
    grid_rows: int
    overlap_bleed_mm: float
    tiles: List[PosterTile]
    preview_url: str


class IDCardLayoutRequest(BaseModel):
    front_asset_id: str
    back_asset_id: str
    card_width_mm: float = 85.6
    card_height_mm: float = 53.98
    target_paper_size: PaperSize = PaperSize.A4
    copies: int = 1


class IDCardLayoutResponse(BaseModel):
    composite_asset_id: str
    preview_url: str
    card_width_mm: float
    card_height_mm: float
    orientation: Orientation
    front_coords_mm: Dict[str, float]
    back_coords_mm: Dict[str, float]


class ShopPreset(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_id: str
    name: str
    description: str
    options: PrintOptions
    is_default: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PrepaidAccount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_id: str
    account_name: str
    account_code: str
    balance_paise: int
    contact_email: str
    authorized_domains: List[str] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PrepaidChargeRequest(BaseModel):
    account_code: str
    order_id: str
    amount_paise: int


class ResumableUploadInit(BaseModel):
    file_name: str
    file_size_bytes: int
    total_chunks: int
    sha256_checksum: str


class ResumableUploadChunk(BaseModel):
    upload_id: str
    chunk_index: int
    chunk_data_base64: str


class QueueEstimateResponse(BaseModel):
    shop_id: str
    jobs_ahead: int
    estimated_minutes_min: int
    estimated_minutes_max: int
    display_text: str
    uncertainty_label: str


class CryptographicReceipt(BaseModel):
    receipt_number: str
    shop_id: str
    order_id: str
    timestamp: datetime
    total_paise: int
    sheets_printed: int
    customer_email: Optional[str] = None
    signature_hmac: str


class PrinterConsumableStatus(BaseModel):
    printer_id: str
    shop_id: str
    printer_name: str
    toner_black_percent: int
    toner_cyan_percent: Optional[int] = None
    toner_magenta_percent: Optional[int] = None
    toner_yellow_percent: Optional[int] = None
    drum_life_percent: int = 100
    maintenance_box_percent: int = 100
    alerts: List[str] = Field(default_factory=list)


class IntelligentRoutingRequest(BaseModel):
    shop_id: str
    required_paper: PaperSize
    requires_color: bool
    requires_duplex: bool
    page_count: int
    deadline: Optional[datetime] = None


class IntelligentRoutingResponse(BaseModel):
    shop_id: str
    selected_printer_id: str
    printer_name: str
    routing_reason: str
    estimated_duration_seconds: int


class ScannerTaskRequest(BaseModel):
    shop_id: str
    source_type: str = "FLATBED"  # FLATBED or ADF
    duplex: bool = False
    dpi: int = 300
    color_mode: str = "bw"


class ScannerTaskResponse(BaseModel):
    task_id: str
    shop_id: str
    scanner_id: str
    status: str
    pages_scanned: int
    output_asset_id: Optional[str] = None
    hardware_status: str = "SIMULATED_TWAIN_BRIDGE"
    disclaimer: str = "Physical scanner hardware testing is marked UNVERIFIED until on-site scanner deployment."


class TimedCopierSessionRequest(BaseModel):
    shop_id: str
    device_id: str
    customer_identifier: str
    duration_minutes: int
    max_copies: int = 50


class TimedCopierSessionResponse(BaseModel):
    session_id: str
    shop_id: str
    device_id: str
    status: str
    session_token: str
    start_time: datetime
    expires_at: datetime
    allocated_copies: int
    actual_copies: int
    bill_amount_paise: int
    hardware_lock_state: str = "UNLOCKED"
    emergency_staff_override_available: bool = True



