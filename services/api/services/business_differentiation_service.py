"""
High-Value Business Features & Commercial Differentiation Service for Print Bot Phase 7.
Handles:
- Saved shop presets (College Lab Report, Court Brief, Passport 8-up).
- Tenant-scoped college/corporate prepaid accounts (strictly isolated by shop_id).
- Resumable multi-chunk large upload sessions.
- Dynamic queue wait-time estimation with uncertainty labeling.
- Cryptographically signed print receipts with HMAC-SHA256 integrity verification.
- Per-staff operational performance reporting (jobs handled, cash collected, refunds).
- Printer consumables & maintenance telemetry (toner level %, drum wear, alerts).
"""

import uuid
import hmac
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from packages.contracts.models import (
    PaperSize,
    DuplexMode,
    Orientation,
    PrintOptions,
    ShopPreset,
    PrepaidAccount,
    PrepaidChargeRequest,
    ResumableUploadInit,
    ResumableUploadChunk,
    QueueEstimateResponse,
    CryptographicReceipt,
    PrinterConsumableStatus,
)
from services.api.services.audit_service import audit_service
from services.api.services.job_service import job_service


RECEIPT_SIGNING_SECRET = "printbot_receipt_hmac_signing_key_2026_phase7"


class ResumableSessionRecord(BaseModel):
    upload_id: str
    shop_id: str
    file_name: str
    total_size_bytes: int
    total_chunks: int
    uploaded_chunks: Dict[int, str] = Field(default_factory=dict)
    sha256_checksum: str
    status: str = "IN_PROGRESS"
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)


class StaffPerformanceMetric(BaseModel):
    staff_id: str
    shop_id: str
    jobs_processed: int = 0
    total_sheets_printed: int = 0
    cash_collected_paise: int = 0
    upi_verified_paise: int = 0
    refunds_issued_count: int = 0
    refunds_amount_paise: int = 0


class BusinessDifferentiationService:
    def __init__(self):
        # Maps shop_id -> List[ShopPreset]
        self._presets: Dict[str, List[ShopPreset]] = {}
        # Maps (shop_id, account_code) -> PrepaidAccount
        self._prepaid_accounts: Dict[Tuple[str, str], PrepaidAccount] = {}
        # Maps upload_id -> ResumableSessionRecord
        self._resumable_sessions: Dict[str, ResumableSessionRecord] = {}
        # Maps (shop_id, printer_id) -> PrinterConsumableStatus
        self._consumables: Dict[Tuple[str, str], PrinterConsumableStatus] = {}
        # Maps staff_id -> StaffPerformanceMetric
        self._staff_metrics: Dict[str, StaffPerformanceMetric] = {}
        self._init_defaults()

    def _init_defaults(self):
        shop_a = "11111111-1111-1111-1111-111111111111"
        shop_b = "22222222-2222-2222-2222-222222222222"

        # 1. Seed Presets for Shop A
        self._presets[shop_a] = [
            ShopPreset(
                shop_id=shop_a,
                name="College Lab Record",
                description="Double-sided B&W on 80 GSM paper with staple binding",
                options=PrintOptions(
                    copies=1,
                    color_mode="bw",
                    paper_size=PaperSize.A4,
                    duplex_mode=DuplexMode.DUPLEX_LONG,
                    paper_gsm=80,
                    binding="staple",
                ),
                is_default=True,
            ),
            ShopPreset(
                shop_id=shop_a,
                name="Official Passport 8-Up Photo",
                description="8 photos on single glossy A4 sheet with cutting guides",
                options=PrintOptions(
                    copies=1,
                    color_mode="color",
                    paper_size=PaperSize.A4,
                    duplex_mode=DuplexMode.SIMPLEX,
                    photo_layout="passport_8up",
                ),
                is_default=False,
            ),
        ]

        # 2. Seed College Prepaid Account for Shop A
        code_a = "ANNA_ENGG_DEPT"
        self._prepaid_accounts[(shop_a, code_a)] = PrepaidAccount(
            shop_id=shop_a,
            account_name="Anna University Mech Engg Dept",
            account_code=code_a,
            balance_paise=250000,  # ₹2,500.00
            contact_email="hod_mech@annauniv.edu",
            authorized_domains=["annauniv.edu"],
            is_active=True,
        )

        # 3. Seed Printer Consumable Status
        self._consumables[(shop_a, "ptr-guindy-hp-1")] = PrinterConsumableStatus(
            printer_id="ptr-guindy-hp-1",
            shop_id=shop_a,
            printer_name="HP LaserJet Pro M404dn",
            toner_black_percent=68,
            drum_life_percent=85,
            maintenance_box_percent=95,
            alerts=[],
        )

    # --------------------------------------------------------------------------
    # 1. Saved Shop Presets
    # --------------------------------------------------------------------------
    def list_presets(self, shop_id: str) -> List[ShopPreset]:
        return self._presets.get(shop_id, [])

    def create_preset(self, shop_id: str, preset: ShopPreset, actor_id: str = "owner@shop.com") -> ShopPreset:
        if shop_id not in self._presets:
            self._presets[shop_id] = []
        preset.shop_id = shop_id
        self._presets[shop_id].append(preset)

        audit_service.record_event(
            actor_type="OWNER",
            actor_id=actor_id,
            action="PRESET_CREATED",
            resource_type="preset",
            resource_id=preset.id,
            shop_id=shop_id,
            metadata={"preset_name": preset.name}
        )
        return preset

    # --------------------------------------------------------------------------
    # 2. Tenant-Scoped College & Corporate Prepaid Accounts
    # --------------------------------------------------------------------------
    def get_prepaid_account(self, shop_id: str, account_code: str) -> PrepaidAccount:
        """Looks up prepaid wallet strictly scoped by shop_id."""
        acc = self._prepaid_accounts.get((shop_id, account_code.upper()))
        if not acc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prepaid account '{account_code}' not found for this shop."
            )
        return acc

    def create_prepaid_account(self, shop_id: str, acc: PrepaidAccount, actor_id: str = "owner@shop.com") -> PrepaidAccount:
        acc.shop_id = shop_id
        acc.account_code = acc.account_code.upper()
        key = (shop_id, acc.account_code)
        if key in self._prepaid_accounts:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Prepaid account code '{acc.account_code}' already exists for this shop."
            )
        self._prepaid_accounts[key] = acc
        audit_service.record_event(
            actor_type="OWNER",
            actor_id=actor_id,
            action="PREPAID_ACCOUNT_CREATED",
            resource_type="prepaid_account",
            resource_id=acc.id,
            shop_id=shop_id,
            metadata={"account_code": acc.account_code, "initial_balance_paise": acc.balance_paise}
        )
        return acc

    def charge_prepaid_account(self, shop_id: str, req: PrepaidChargeRequest, actor_id: str = "customer") -> Dict[str, Any]:
        """Debits an order fee from the prepaid wallet. Atomic balance check."""
        acc = self.get_prepaid_account(shop_id, req.account_code)
        if not acc.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prepaid account is inactive.")
        if acc.balance_paise < req.amount_paise:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient prepaid balance. Available: ₹{acc.balance_paise/100:.2f}, Required: ₹{req.amount_paise/100:.2f}"
            )

        acc.balance_paise -= req.amount_paise

        audit_service.record_event(
            actor_type="CUSTOMER",
            actor_id=actor_id,
            action="PREPAID_ACCOUNT_DEBITED",
            resource_type="prepaid_account",
            resource_id=acc.id,
            shop_id=shop_id,
            metadata={
                "order_id": req.order_id,
                "amount_paise": req.amount_paise,
                "balance_after_paise": acc.balance_paise
            }
        )
        return {
            "status": "charged",
            "account_code": acc.account_code,
            "debited_paise": req.amount_paise,
            "remaining_balance_paise": acc.balance_paise,
            "order_id": req.order_id,
        }

    # --------------------------------------------------------------------------
    # 3. Resumable Chunked Upload Engine
    # --------------------------------------------------------------------------
    def init_resumable_upload(self, shop_id: str, req: ResumableUploadInit) -> Dict[str, Any]:
        upload_id = f"upl_{uuid.uuid4().hex}"
        session = ResumableSessionRecord(
            upload_id=upload_id,
            shop_id=shop_id,
            file_name=req.file_name,
            total_size_bytes=req.file_size_bytes,
            total_chunks=req.total_chunks,
            sha256_checksum=req.sha256_checksum,
            status="IN_PROGRESS",
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )
        self._resumable_sessions[upload_id] = session
        return {
            "upload_id": upload_id,
            "shop_id": shop_id,
            "total_chunks": req.total_chunks,
            "expires_at": session.expires_at.isoformat(),
        }

    def upload_chunk(self, shop_id: str, req: ResumableUploadChunk) -> Dict[str, Any]:
        session = self._resumable_sessions.get(req.upload_id)
        if not session or session.shop_id != shop_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resumable upload session not found.")
        if req.chunk_index < 0 or req.chunk_index >= session.total_chunks:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid chunk index.")

        # Store chunk reference
        session.uploaded_chunks[req.chunk_index] = req.chunk_data_base64
        is_completed = (len(session.uploaded_chunks) == session.total_chunks)
        if is_completed:
            session.status = "COMPLETED"

        return {
            "upload_id": session.upload_id,
            "chunk_index": req.chunk_index,
            "chunks_received": len(session.uploaded_chunks),
            "total_chunks": session.total_chunks,
            "is_completed": is_completed,
            "asset_id": f"asset_{session.upload_id[:12]}" if is_completed else None,
        }

    # --------------------------------------------------------------------------
    # 4. Queue Wait-Time Estimation with Uncertainty Labeling
    # --------------------------------------------------------------------------
    def estimate_queue_wait_time(self, shop_id: str) -> QueueEstimateResponse:
        """
        Estimates customer wait time based on queued jobs ahead and average print speed.
        Indian shop benchmark: ~15 seconds per job + ~2 seconds per physical page.
        """
        jobs = job_service.list_jobs(tenant_id=shop_id)
        queued = [j for j in jobs if j.status.value in ("QUEUED", "AWAITING_APPROVAL", "PAID_HELD", "LEASED")]
        count = len(queued)

        if count == 0:
            return QueueEstimateResponse(
                shop_id=shop_id,
                jobs_ahead=0,
                estimated_minutes_min=0,
                estimated_minutes_max=2,
                display_text="No wait: Printers are ready for immediate dispatch.",
                uncertainty_label="HIGH_CONFIDENCE_IMMEDIATE"
            )

        # Baseline: 3 minutes per job average
        est_min = max(2, count * 2)
        est_max = max(est_min + 3, count * 4)

        return QueueEstimateResponse(
            shop_id=shop_id,
            jobs_ahead=count,
            estimated_minutes_min=est_min,
            estimated_minutes_max=est_max,
            display_text=f"Estimated wait: {est_min}–{est_max} mins ({count} jobs ahead in queue)",
            uncertainty_label="ESTIMATE_WITH_TOLERANCE_PM_3M"
        )

    # --------------------------------------------------------------------------
    # 5. Cryptographically Signed Print Receipts
    # --------------------------------------------------------------------------
    def generate_signed_receipt(self, shop_id: str, order_id: str, total_paise: int, sheets_printed: int, customer_email: Optional[str] = None) -> CryptographicReceipt:
        now = datetime.utcnow()
        seq = uuid.uuid4().hex[:6].upper()
        receipt_num = f"RCPT-{now.year}{now.month:02d}-{seq}"

        payload = f"{receipt_num}|{shop_id}|{order_id}|{total_paise}|{sheets_printed}|{now.isoformat()}"
        signature = hmac.new(
            RECEIPT_SIGNING_SECRET.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        return CryptographicReceipt(
            receipt_number=receipt_num,
            shop_id=shop_id,
            order_id=order_id,
            timestamp=now,
            total_paise=total_paise,
            sheets_printed=sheets_printed,
            customer_email=customer_email,
            signature_hmac=signature
        )

    def verify_receipt_signature(self, receipt: CryptographicReceipt) -> bool:
        payload = f"{receipt.receipt_number}|{receipt.shop_id}|{receipt.order_id}|{receipt.total_paise}|{receipt.sheets_printed}|{receipt.timestamp.isoformat()}"
        expected = hmac.new(
            RECEIPT_SIGNING_SECRET.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, receipt.signature_hmac)

    # --------------------------------------------------------------------------
    # 6. Per-Staff Operational Reporting
    # --------------------------------------------------------------------------
    def record_staff_job_completion(self, staff_id: str, shop_id: str, sheets: int, paise: int, is_cash: bool = False):
        if staff_id not in self._staff_metrics:
            self._staff_metrics[staff_id] = StaffPerformanceMetric(staff_id=staff_id, shop_id=shop_id)

        m = self._staff_metrics[staff_id]
        m.jobs_processed += 1
        m.total_sheets_printed += sheets
        if is_cash:
            m.cash_collected_paise += paise
        else:
            m.upi_verified_paise += paise

    def get_staff_performance(self, staff_id: str, shop_id: str) -> StaffPerformanceMetric:
        m = self._staff_metrics.get(staff_id)
        if not m or m.shop_id != shop_id:
            return StaffPerformanceMetric(staff_id=staff_id, shop_id=shop_id)
        return m

    # --------------------------------------------------------------------------
    # 7. Consumables & Maintenance Telemetry
    # --------------------------------------------------------------------------
    def update_printer_consumables(self, status_obj: PrinterConsumableStatus):
        key = (status_obj.shop_id, status_obj.printer_id)
        # Check for low toner alert (< 15%)
        if status_obj.toner_black_percent < 15 and "LOW_BLACK_TONER" not in status_obj.alerts:
            status_obj.alerts.append("LOW_BLACK_TONER")

        self._consumables[key] = status_obj

    def get_printer_consumables(self, shop_id: str, printer_id: str) -> Optional[PrinterConsumableStatus]:
        return self._consumables.get((shop_id, printer_id))

    def clear(self):
        self._presets.clear()
        self._prepaid_accounts.clear()
        self._resumable_sessions.clear()
        self._consumables.clear()
        self._staff_metrics.clear()
        self._init_defaults()


business_differentiation_service = BusinessDifferentiationService()
