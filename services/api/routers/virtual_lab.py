"""
Virtual Xerox Shop Lab API Router.
Exposes endpoints for virtual printer discovery, failure injection,
spool simulation, event audit logs, and fleet scaling (10, 50, 100 printers).
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from packages.contracts.models import (
    PaperSize,
    ColorMode,
    DuplexMode,
    JobStatus,
)
from services.api.services.virtual_shop_lab import (
    virtual_shop_lab,
    VirtualDeviceConfig,
    FaultInjectionType,
    CapturedPrintOutput,
    LabJobEvent,
)

router = APIRouter(prefix="/lab", tags=["Virtual Xerox Shop Lab"])


class InjectFaultRequest(BaseModel):
    device_id: str
    fault: FaultInjectionType


class SubmitVirtualJobRequest(BaseModel):
    printer_id: str
    job_id: str
    page_count: int = Field(default=1, ge=1)
    color_mode: ColorMode = ColorMode.BW
    duplex_mode: DuplexMode = DuplexMode.SIMPLEX
    paper_size: PaperSize = PaperSize.A4


class ScaleFleetRequest(BaseModel):
    shop_id: str
    count: int = Field(default=10, ge=1, le=200)


@router.get("/devices", response_model=List[VirtualDeviceConfig])
async def list_virtual_devices():
    """Returns the fleet of virtual devices in the lab, including the 10 canonical devices."""
    return virtual_shop_lab.list_devices()


@router.get("/devices/{device_id}", response_model=VirtualDeviceConfig)
async def get_virtual_device(device_id: str):
    """Retrieves current telemetry, queue depth, and active faults for a specific virtual printer."""
    dev = virtual_shop_lab.get_device(device_id)
    if not dev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Virtual printer '{device_id}' not found."
        )
    return dev


@router.post("/fault-inject", response_model=VirtualDeviceConfig)
async def inject_fault_into_device(req: InjectFaultRequest):
    """Injects a failure condition (offline, jam, out of paper, spooler rejection, etc.) into a virtual device."""
    try:
        return virtual_shop_lab.inject_fault(req.device_id, req.fault)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Virtual printer '{req.device_id}' not found."
        )


@router.post("/submit", response_model=Dict[str, Any])
async def submit_virtual_job(req: SubmitVirtualJobRequest):
    """Submits a virtual print job through the lab device engine, verifying capability constraints and capturing output."""
    result = virtual_shop_lab.submit_virtual_job(
        printer_id=req.printer_id,
        job_id=req.job_id,
        page_count=req.page_count,
        color_mode=req.color_mode,
        duplex_mode=req.duplex_mode,
        paper_size=req.paper_size,
    )
    return result


@router.get("/captures/{job_id}", response_model=List[CapturedPrintOutput])
async def get_captured_print_output(job_id: str):
    """Returns the inspectable spool output records for a given job."""
    return virtual_shop_lab.get_captured_output(job_id)


@router.get("/events", response_model=List[LabJobEvent])
async def get_lab_events(limit: int = 100):
    """Returns the audit stream of state machine transitions and hardware fault events in the lab."""
    return virtual_shop_lab.get_events(limit=limit)


@router.post("/scale", response_model=List[VirtualDeviceConfig])
async def scale_virtual_fleet(req: ScaleFleetRequest):
    """Provisions 10, 50, or 100 virtual devices to test unlimited printer routing and queue scalability."""
    return virtual_shop_lab.scale_fleet(shop_id=req.shop_id, count=req.count)
