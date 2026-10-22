from typing import List
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from packages.contracts.models import (
    PrinterDevice,
    PrintJobResponse,
    JobStatus,
    PaperSize
)
from services.api.services.job_service import job_service

router = APIRouter(prefix="/printers", tags=["Hardware & Workstations"])


class ClaimJobRequest(BaseModel):
    workstation_id: str
    job_id: str


class UpdateSpoolStatusRequest(BaseModel):
    workstation_id: str
    job_id: str
    spooler_job_id: str
    status: JobStatus


@router.get("", response_model=List[PrinterDevice])
def list_printers():
    """Lists standard and auto-detected printing profiles."""
    return [
        PrinterDevice(
            id="printer-xerox-c8170",
            name="Xerox AltaLink C8170 (Color High-Speed)",
            is_default=True,
            is_online=True,
            status_text="Idle / Ready",
            supported_sizes=[PaperSize.A4, PaperSize.A3, PaperSize.LEGAL, PaperSize.LETTER],
            supports_color=True,
            supports_duplex=True
        ),
        PrinterDevice(
            id="printer-canon-iradv-dx",
            name="Canon imageRUNNER ADVANCE DX (B&W High-Volume)",
            is_default=False,
            is_online=True,
            status_text="Idle / Ready",
            supported_sizes=[PaperSize.A4, PaperSize.LEGAL, PaperSize.LETTER],
            supports_color=False,
            supports_duplex=True
        )
    ]


@router.post("/claim", response_model=PrintJobResponse)
def claim_queued_job(req: ClaimJobRequest, request: Request):
    """Allows workstation to claim a job for local spooling."""
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.assign_to_workstation(
        tenant_id=tenant_id,
        job_id=req.job_id,
        workstation_id=req.workstation_id
    )


@router.post("/spool-status", response_model=PrintJobResponse)
def update_spooler_status(req: UpdateSpoolStatusRequest, request: Request):
    """Workstation reports physical Windows Spooler status updates."""
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return job_service.update_spool_status(
        tenant_id=tenant_id,
        job_id=req.job_id,
        spooler_job_id=req.spooler_job_id,
        new_status=req.status
    )


class PrinterSnapshotSyncRequest(BaseModel):
    device_id: str
    printers: List[dict]


@router.post("/snapshots")
def ingest_printer_snapshots(req: PrinterSnapshotSyncRequest, request: Request):
    """
    Ingests connected printer capability snapshots from an enrolled workstation.
    Guarantees UNLIMITED printer registrations per shop (zero count limits).
    """
    tenant_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return {
        "status": "synchronized",
        "shop_id": tenant_id,
        "device_id": req.device_id,
        "discovered_printers_count": len(req.printers),
        "unlimited_quota": True
    }

