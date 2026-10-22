"""
Hardware Adapters, Intelligent Multi-Printer Routing & Simulator Bridge Router for Print Bot Phase 7.
Provides:
- Intelligent multi-printer routing & load balancing.
- TWAIN / WIA / IPP Scan bridge simulator.
- Timed physical copier rental simulator with lock/unlock states.
- Hardware disclaimer: physical scanner and self-service copier automation are marked BLOCKED/UNVERIFIED until real hardware is deployed.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from packages.contracts.models import (
    IntelligentRoutingRequest,
    IntelligentRoutingResponse,
    ScannerTaskRequest,
    ScannerTaskResponse,
    TimedCopierSessionRequest,
    TimedCopierSessionResponse,
)
from services.api.services.hardware_bridge_service import hardware_bridge_service

router = APIRouter(prefix="/hardware", tags=["Hardware Adapters, Print Routing & Simulators"])


class CloseCopierSessionRequest(BaseModel):
    copies_made: int
    per_copy_paise: int = 200
    staff_override: bool = False


@router.post("/routing", response_model=IntelligentRoutingResponse)
async def route_print_job(req: IntelligentRoutingRequest, request: Request):
    """
    Dynamically routes a job to the optimal printer in the shop
    matching paper size, color, duplex, and lowest active queue depth.
    """
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if shop_id and req.shop_id != shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cross-tenant routing forbidden. Request shop '{req.shop_id}' does not match context '{shop_id}'."
        )
    return hardware_bridge_service.route_print_job(req=req)


@router.post("/scanner/task", response_model=ScannerTaskResponse)
async def dispatch_scanner_task(req: ScannerTaskRequest, request: Request):
    """
    Dispatches a scanning task to the workstation bridge simulator.
    Validates flatbed vs ADF multi-page options.
    Honest disclaimer: physical scanner hardware gate is marked BLOCKED/UNVERIFIED.
    """
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if shop_id and req.shop_id != shop_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cross-tenant scanner task forbidden."
        )
    return hardware_bridge_service.dispatch_scanner_task(req=req)


@router.post("/copier/session/init", response_model=TimedCopierSessionResponse)
async def init_timed_copier_session(req: TimedCopierSessionRequest, request: Request):
    """
    Initiates a timed self-service physical copier session.
    Simulates hardware lock/unlock state and copy allowance.
    """
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if shop_id and req.shop_id != shop_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access forbidden.")
    return hardware_bridge_service.initiate_timed_copier_session(req=req)


@router.post("/copier/session/{session_id}/close", response_model=TimedCopierSessionResponse)
async def close_timed_copier_session(session_id: str, req: CloseCopierSessionRequest, request: Request):
    """
    Closes a timed copier session, locks the hardware, and bills actual copies made.
    Supports staff emergency override.
    """
    return hardware_bridge_service.close_timed_copier_session(
        session_id=session_id,
        copies_made=req.copies_made,
        per_copy_paise=req.per_copy_paise,
        staff_override=req.staff_override,
    )
