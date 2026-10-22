from typing import List
from packages.contracts.models import (
    ReconciliationRequest,
    ReconciliationResponse,
    JobStatus,
)
from services.api.services.job_service import job_service


class ReconciliationService:
    def reconcile(self, req: ReconciliationRequest) -> ReconciliationResponse:
        """
        Reconciles workstation local spool log against cloud source-of-truth.
        Zero duplicate print guarantee:
        - Confirmed jobs are locked and acknowledged.
        - Only jobs that NEVER spooled are marked for re-spooling.
        - Spooled jobs are never sent again.
        """
        confirmed: List[str] = []
        invalid: List[str] = []
        re_spool: List[str] = []

        # 1. Inspect jobs claimed by workstation
        for job_id in req.spooled_job_ids:
            try:
                job = job_service.get_job(req.tenant_id, job_id)
                if job.status in (JobStatus.SPOOLING, JobStatus.PRINTING, JobStatus.COMPLETED):
                    # Already successfully submitted to spooler; confirm it
                    confirmed.append(job_id)
                elif job.status == JobStatus.CANCELLED:
                    invalid.append(job_id)
                else:
                    # Cloud says not yet marked spooled; update cloud status to prevent duplicate spooling
                    job_service.update_spool_status(
                        tenant_id=req.tenant_id,
                        job_id=job_id,
                        spooler_job_id=job.spooler_job_id or "REC-LOCAL-SPOOL",
                        new_status=JobStatus.PRINTING
                    )
                    confirmed.append(job_id)
            except Exception:
                invalid.append(job_id)

        # 2. Check for QUEUED jobs in cloud that workstation missed while offline
        queued_jobs = job_service.list_jobs(req.tenant_id, status_filter=JobStatus.QUEUED)
        for q_job in queued_jobs:
            if q_job.id not in req.spooled_job_ids:
                re_spool.append(q_job.id)

        return ReconciliationResponse(
            confirmed_job_ids=confirmed,
            re_spool_required_job_ids=re_spool,
            invalid_job_ids=invalid
        )


reconciliation_service = ReconciliationService()
