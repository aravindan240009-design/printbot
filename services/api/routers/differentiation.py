"""
High-Value Commercial Differentiation Router for Print Bot Phase 7.
Provides:
- Saved shop presets (Lab Record, Court Brief, Passport 8-up).
- Tenant-scoped college/corporate prepaid accounts.
- Resumable multi-chunk large upload sessions.
- Dynamic queue wait-time estimation with uncertainty labeling.
- Cryptographically signed print receipts with HMAC-SHA256 integrity verification.
- Per-staff operational performance reporting.
- Printer consumables & maintenance telemetry.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from packages.contracts.models import (
    ShopPreset,
    PrepaidAccount,
    PrepaidChargeRequest,
    ResumableUploadInit,
    ResumableUploadChunk,
    QueueEstimateResponse,
    CryptographicReceipt,
    PrinterConsumableStatus,
)
from services.api.services.business_differentiation_service import business_differentiation_service

router = APIRouter(prefix="/differentiation", tags=["Commercial Differentiation & Business Features"])


class GenerateReceiptRequest(BaseModel):
    total_paise: int
    sheets_printed: int
    customer_email: Optional[str] = None


@router.get("/presets", response_model=List[ShopPreset])
async def list_shop_presets(request: Request):
    """Lists saved print setting templates for the shop."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return business_differentiation_service.list_presets(shop_id=shop_id)


@router.post("/presets", response_model=ShopPreset)
async def create_shop_preset(preset: ShopPreset, request: Request):
    """Creates a new saved preset template for the shop."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    user = getattr(request.state, "user", None)
    actor_id = user.get("user_id", "owner@shop.com") if user else "owner@shop.com"
    return business_differentiation_service.create_preset(shop_id=shop_id, preset=preset, actor_id=actor_id)


@router.post("/prepaid/accounts", response_model=PrepaidAccount)
async def create_prepaid_account(acc: PrepaidAccount, request: Request):
    """Enrolls a tenant-scoped college department or corporate prepaid account."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    user = getattr(request.state, "user", None)
    actor_id = user.get("user_id", "owner@shop.com") if user else "owner@shop.com"
    return business_differentiation_service.create_prepaid_account(shop_id=shop_id, acc=acc, actor_id=actor_id)


@router.get("/prepaid/accounts/{account_code}", response_model=PrepaidAccount)
async def get_prepaid_account(account_code: str, request: Request):
    """Retrieves prepaid balance for an authorized account within the authenticated shop."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return business_differentiation_service.get_prepaid_account(shop_id=shop_id, account_code=account_code)


@router.post("/prepaid/charge")
async def charge_prepaid_account(req: PrepaidChargeRequest, request: Request):
    """Charges an order fee to a college/corporate prepaid balance."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return business_differentiation_service.charge_prepaid_account(shop_id=shop_id, req=req)


@router.post("/uploads/resumable/init")
async def init_resumable_upload(req: ResumableUploadInit, request: Request):
    """Initializes a chunked upload session for large assets."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return business_differentiation_service.init_resumable_upload(shop_id=shop_id, req=req)


@router.post("/uploads/resumable/chunk")
async def upload_resumable_chunk(req: ResumableUploadChunk, request: Request):
    """Uploads an individual chunk in a multi-chunk session."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return business_differentiation_service.upload_chunk(shop_id=shop_id, req=req)


@router.get("/queue/estimate", response_model=QueueEstimateResponse)
async def get_queue_estimate(request: Request):
    """Calculates dynamic queue wait-time estimate with tolerance and uncertainty labeling."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return business_differentiation_service.estimate_queue_wait_time(shop_id=shop_id)


@router.post("/receipts/verify")
async def verify_receipt(receipt: CryptographicReceipt):
    """Verifies HMAC signature of a printed customer receipt."""
    is_valid = business_differentiation_service.verify_receipt_signature(receipt=receipt)
    return {"receipt_number": receipt.receipt_number, "is_valid": is_valid}


@router.post("/receipts/{order_id}", response_model=CryptographicReceipt)
async def generate_signed_receipt(order_id: str, req: GenerateReceiptRequest, request: Request):
    """Generates an HMAC-SHA256 cryptographically signed customer receipt."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return business_differentiation_service.generate_signed_receipt(
        shop_id=shop_id,
        order_id=order_id,
        total_paise=req.total_paise,
        sheets_printed=req.sheets_printed,
        customer_email=req.customer_email,
    )


@router.get("/staff/{staff_id}/performance")
async def get_staff_performance(staff_id: str, request: Request):
    """Returns operational throughput and payment reconciliation for a staff member."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return business_differentiation_service.get_staff_performance(staff_id=staff_id, shop_id=shop_id)


@router.get("/printers/{printer_id}/consumables", response_model=Optional[PrinterConsumableStatus])
async def get_printer_consumables(printer_id: str, request: Request):
    """Retrieves live toner and drum life metrics for a connected printer."""
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return business_differentiation_service.get_printer_consumables(shop_id=shop_id, printer_id=printer_id)
