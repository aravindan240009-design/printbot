from typing import List, Optional
from fastapi import APIRouter, Request, Header, HTTPException, status
from pydantic import BaseModel
from packages.contracts.models import (
    PrintJobCreateRequest,
    PrintJobResponse,
    PrintOptions,
    JobStatus,
)
from services.api.services.pricing import pricing_engine
from services.api.services.job_service import job_service
from services.api.core.idempotency import idempotency_store

router = APIRouter(prefix="/orders", tags=["Orders & Pricing"])


class QuoteRequest(BaseModel):
    page_count: int
    options: PrintOptions


@router.post("/quote")
def calculate_quote(req: QuoteRequest):
    """Calculates instantaneous live quote breakdown."""
    return pricing_engine.calculate(req.page_count, req.options)


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
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.approve_job(tenant_id, job_id)


@router.post("/{job_id}/reject", response_model=PrintJobResponse)
def reject_order(job_id: str, req: RejectOrderRequest, request: Request):
    """Staff rejects an order; transitions to CANCELLED and blocks printing."""
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.reject_job(tenant_id, job_id, req.reason)


@router.post("/{job_id}/mark-unknown", response_model=PrintJobResponse)
def mark_order_unknown(job_id: str, req: MarkUnknownRequest, request: Request):
    """Flags ambiguous job as COMPLETION_UNKNOWN; blocks automatic reprint."""
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
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.record_cash_payment(
        tenant_id=tenant_id,
        job_id=job_id,
        staff_email=req.staff_email,
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
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.supervised_reconcile_unknown(
        tenant_id=tenant_id,
        job_id=job_id,
        action=req.action,
        staff_email=req.staff_email,
    )


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

