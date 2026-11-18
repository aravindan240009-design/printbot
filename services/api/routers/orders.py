import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, Header, HTTPException, status
from pydantic import BaseModel, Field
from packages.contracts.models import (
    PrintJobCreateRequest,
    PrintJobResponse,
    PrintOptions,
    JobStatus,
    PaymentProviderType,
)
from services.api.services.accounting_engine import accounting_engine
from services.api.services.job_service import job_service
from services.api.core.idempotency import idempotency_store
from services.api.services.auth_service import auth_service
from services.api.services.payment_provider import get_payment_provider
from services.api.services.shop_customization_service import shop_customization_service

router = APIRouter(prefix="/orders", tags=["Orders & Pricing"])


def require_order_permission(request: Request, permission: str) -> Dict[str, Any]:
    user = getattr(request.state, "user", None)
    if not user or not auth_service.check_permission(user, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authenticated staff permission is required for this order action.",
        )
    return user


class QuoteRequest(BaseModel):
    page_count: int = Field(ge=1, le=5000)
    options: PrintOptions


@router.post("/quote")
def calculate_quote(req: QuoteRequest, request: Request):
    """Calculates a shop-priced quote using the same rules as order creation."""
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    pricing_rates = shop_customization_service.get_config(tenant_id).pricing_rates_paise
    item = accounting_engine.calculate_file_accounting(
        file_id="quote",
        file_name="quote",
        total_file_pages=req.page_count,
        options=req.options,
        pricing_rates_paise=pricing_rates,
    )
    quote_payload = {
        "shop_id": tenant_id,
        "page_count": req.page_count,
        "options": req.options.model_dump(mode="json"),
        "pricing_rates_paise": pricing_rates,
        "total_paise": item.cost_paise,
    }
    quote_hash = hashlib.sha256(
        json.dumps(quote_payload, sort_keys=True).encode("utf-8")
    ).hexdigest()
    return {
        "total_paise": item.cost_paise,
        "total_rupees": item.cost_rupees,
        "total_logical_pages": item.logical_pages * req.options.copies,
        "total_rendered_sides": item.rendered_sides,
        "total_physical_sheets": item.physical_sheets,
        "currency": "INR",
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
        "quote_hash": quote_hash,
    }


@router.post("", response_model=PrintJobResponse, status_code=status.HTTP_201_CREATED)
def create_print_order(
    req: PrintJobCreateRequest,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    """
    Creates a new print order for the current tenant.
    Guaranteed idempotent if Idempotency-Key header is supplied.
    """
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")

    if idempotency_key:
        matches, cached_resp, cached_code = idempotency_store.check(
            tenant_id, idempotency_key, req.model_dump()
        )
        if matches and cached_resp:
            return cached_resp
        idempotency_store.start(tenant_id, idempotency_key, req.model_dump())

    job = job_service.create_job(tenant_id, req)
    job_dict = job.model_dump()
    # Serialize datetimes for cache
    job_dict["created_at"] = job.created_at.isoformat()
    job_dict["updated_at"] = job.updated_at.isoformat()

    if idempotency_key:
        idempotency_store.complete(tenant_id, idempotency_key, 201, job_dict)

    return job


@router.post("/{job_id}/payment-intent")
def create_order_payment_intent(job_id: str, request: Request):
    """Creates a gateway order tied to a server-priced print job."""
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    job = job_service.get_job(tenant_id, job_id)
    if job.status != JobStatus.PENDING_PAYMENT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A payment order can only be created for an unpaid print job.",
        )

    provider = get_payment_provider(PaymentProviderType.RAZORPAY)
    return provider.create_payment_intent(
        shop_id=tenant_id,
        order_id=job.id,
        amount_paise=job.total_paise,
        currency=job.currency,
    )


@router.get("/{job_id}", response_model=PrintJobResponse)
def get_order(job_id: str, request: Request):
    """Retrieves print job ensuring strict tenant isolation."""
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.get_job(tenant_id, job_id)


@router.get("", response_model=List[PrintJobResponse])
def list_orders(
    request: Request,
    status: Optional[JobStatus] = None
):
    """Lists print jobs strictly scoped to the tenant."""
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.list_jobs(tenant_id, status_filter=status)


class RejectOrderRequest(BaseModel):
    reason: str


class MarkUnknownRequest(BaseModel):
    reason: str


@router.post("/{job_id}/approve", response_model=PrintJobResponse)
def approve_order(job_id: str, request: Request):
    """Staff approves an order in MANUAL_APPROVAL mode; transitions to QUEUED."""
    staff = require_order_permission(request, "orders:approve")
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.approve_job(tenant_id, job_id, staff_email=staff["email"])


@router.post("/{job_id}/reject", response_model=PrintJobResponse)
def reject_order(job_id: str, req: RejectOrderRequest, request: Request):
    """Staff rejects an order; transitions to CANCELLED and blocks printing."""
    staff = require_order_permission(request, "orders:approve")
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.reject_job(tenant_id, job_id, req.reason, staff_email=staff["email"])


@router.post("/{job_id}/mark-unknown", response_model=PrintJobResponse)
def mark_order_unknown(job_id: str, req: MarkUnknownRequest, request: Request):
    """Flags ambiguous job as COMPLETION_UNKNOWN; blocks automatic reprint."""
    require_order_permission(request, "orders:approve")
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.mark_completion_unknown(tenant_id, job_id, req.reason)


class CashReceivedRequest(BaseModel):
    amount_paise: Optional[int] = None
    staff_email: str = "staff@shop.com"


class CancelOrderRequest(BaseModel):
    reason: str = "Customer cancelled before print"


class SupervisedReconcileRequest(BaseModel):
    action: str  # 'CONFIRM_PRINTED', 'REPRINT', 'REFUND'
    staff_email: str = "staff@shop.com"


@router.post("/{job_id}/cash-received", response_model=PrintJobResponse)
def record_cash_received(job_id: str, req: CashReceivedRequest, request: Request):
    """
    Staff records in-person cash receipt at counter.
    In MANUAL_APPROVAL mode, transitions to AWAITING_APPROVAL.
    In FULL_AUTOMATIC mode, dispatches to QUEUED if hardware is online.
    """
    staff = require_order_permission(request, "orders:approve")
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.record_cash_payment(
        tenant_id=tenant_id,
        job_id=job_id,
        staff_email=staff["email"],
        amount_paise=req.amount_paise,
    )


@router.post("/{job_id}/cancel", response_model=PrintJobResponse)
def cancel_order(job_id: str, req: CancelOrderRequest, request: Request):
    """
    Cancels order prior to print spooling.
    If paid online, triggers automatic gateway refund.
    Blocks cancellation if document is already in the physical spooler.
    """
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.cancel_order(
        tenant_id=tenant_id,
        job_id=job_id,
        reason=req.reason,
    )


@router.post("/{job_id}/reconcile-unknown", response_model=PrintJobResponse)
def supervise_unknown_order(job_id: str, req: SupervisedReconcileRequest, request: Request):
    """
    Operator supervises a COMPLETION_UNKNOWN job.
    Actions: CONFIRM_PRINTED, REPRINT, or REFUND.
    Strict Invariant: Automatic reprint is blocked; only human supervisor can authorize reprint.
    """
    staff = require_order_permission(request, "orders:approve")
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.supervised_reconcile_unknown(
        tenant_id=tenant_id,
        job_id=job_id,
        action=req.action,
        staff_email=staff["email"],
    )


@router.delete("/{job_id}/documents")
def purge_order_documents(job_id: str, request: Request):
    """
    Customer privacy right to erasure: purges document files & metadata for a job.
    Preserves financial ledger and audit logs while shredding customer data.
    """
    require_order_permission(request, "orders:delete")
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.purge_job_documents(tenant_id, job_id)


@router.get("/{job_id}/callback")
def payment_browser_callback(job_id: str, request: Request):
    """
    Browser return URL after external payment gateway checkout.
    STRICT SECURITY INVARIANT:
    Browser redirects are NEVER proof of payment!
    Returns current true server status; only verified webhook or server-to-server check marks paid.
    """
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    job = job_service.get_job(tenant_id, job_id)
    return {
        "order_id": job.id,
        "shop_id": job.tenant_id,
        "status": job.status,
        "payment_verified": job.status not in (JobStatus.AWAITING_PAYMENT, JobStatus.PENDING_PAYMENT),
        "hold_reason": job.hold_reason,
        "server_authoritative": True,
        "note": "Payment verification is handled strictly via server-to-server signed webhook.",
    }


@router.get("/{job_id}/events")
async def stream_order_events(job_id: str, request: Request, max_events: Optional[int] = None):
    """
    Server-Sent Events (SSE) streaming real-time status to the customer's phone browser.
    Provides honest status (including PAID_HELD reasons) without false print promises.
    """
    from fastapi.responses import StreamingResponse
    from services.api.services.outbox_service import outbox_service

    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    # Verify order belongs to tenant
    _ = job_service.get_job(tenant_id, job_id)

    return StreamingResponse(
        outbox_service.sse_event_generator(job_id, max_events=max_events),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

