import uuid
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import HTTPException, status
from packages.contracts.models import (
    PrintJobResponse,
    PrintJobCreateRequest,
    JobStatus,
    PrintOptions,
)
from services.api.services.pricing import pricing_engine


class JobService:
    def __init__(self):
        # Maps (tenant_id, job_id) -> PrintJobResponse
        self._jobs: Dict[str, PrintJobResponse] = {}

    def _key(self, tenant_id: str, job_id: str) -> str:
        return f"{tenant_id}:{job_id}"

    def create_job(self, tenant_id: str, req: PrintJobCreateRequest) -> PrintJobResponse:
        job_id = str(uuid.uuid4())
        quote = pricing_engine.calculate(req.page_count, req.options)
        now = datetime.utcnow()

        job = PrintJobResponse(
            id=job_id,
            tenant_id=tenant_id,
            customer_email=req.customer_email,
            customer_phone=req.customer_phone,
            file_name=req.file_name,
            file_size_bytes=req.file_size_bytes,
            page_count=req.page_count,
            options=req.options,
            calculated_price_cents=quote["total_cents"],
            currency=quote["currency"],
            status=JobStatus.PENDING_PAYMENT,
            created_at=now,
            updated_at=now,
        )
        self._jobs[self._key(tenant_id, job_id)] = job
        return job

    def get_job(self, tenant_id: str, job_id: str) -> PrintJobResponse:
        k = self._key(tenant_id, job_id)
        job = self._jobs.get(k)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job '{job_id}' not found for tenant '{tenant_id}'."
            )
        return job

    def list_jobs(self, tenant_id: str, status_filter: Optional[JobStatus] = None) -> List[PrintJobResponse]:
        results = [
            j for k, j in self._jobs.items()
            if k.startswith(f"{tenant_id}:") and (status_filter is None or j.status == status_filter)
        ]
        return sorted(results, key=lambda x: x.created_at, reverse=True)

    def mark_paid(self, tenant_id: str, job_id: str, payment_intent_id: str) -> PrintJobResponse:
        job = self.get_job(tenant_id, job_id)
        if job.status not in (JobStatus.PENDING_PAYMENT, JobStatus.FAILED):
            # Already paid or queued - return existing state (idempotent)
            return job

        job.status = JobStatus.PAID
        job.payment_intent_id = payment_intent_id
        job.updated_at = datetime.utcnow()
        # Immediately place in queue for desktop workstations
        job.status = JobStatus.QUEUED
        return job

    def assign_to_workstation(self, tenant_id: str, job_id: str, workstation_id: str) -> PrintJobResponse:
        job = self.get_job(tenant_id, job_id)
        if job.status != JobStatus.QUEUED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot claim job in status '{job.status}'. Only QUEUED jobs may be claimed."
            )
        job.status = JobStatus.SPOOLING
        job.workstation_id = workstation_id
        job.updated_at = datetime.utcnow()
        return job

    def update_spool_status(
        self,
        tenant_id: str,
        job_id: str,
        spooler_job_id: str,
        new_status: JobStatus
    ) -> PrintJobResponse:
        job = self.get_job(tenant_id, job_id)
        job.spooler_job_id = spooler_job_id
        job.status = new_status
        job.updated_at = datetime.utcnow()
        return job

    def clear(self) -> None:
        """Teardown helper for tests."""
        self._jobs.clear()


job_service = JobService()
