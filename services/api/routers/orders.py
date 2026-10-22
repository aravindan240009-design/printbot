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
