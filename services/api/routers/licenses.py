"""
License Center & Hardware Security Router for Print Bot Phase 6.
Provides:
- Cryptographic public-key fingerprints (SHA-256 colon hex format, never private keys).
- Hardware assurance verification (TPM 2.0 vs software fallback).
- Stolen/Replaced workstation instant revocation workflows.
- Security anomaly alerts (suspicious account sharing, simultaneous IPs).
- Strict non-negotiable rule: UNLIMITED printers per shop.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from packages.contracts.models import (
    StolenDeviceReport,
)
from services.api.services.license_service import license_service, EnrichedDeviceRecord, DeviceSecurityAlert

router = APIRouter(prefix="/licenses", tags=["License Center & Hardware Security"])


@router.get("/devices", response_model=List[EnrichedDeviceRecord])
async def list_license_devices(request: Request):
    """
    Returns all registered Windows workstations for the current shop,
    enriched with SHA-256 public-key fingerprints, TPM 2.0 assurance level,
    and unlimited printer entitlements.
    """
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    user = getattr(request.state, "user", None)
    if user and user.get("is_superadmin"):
        # Superadmin can query via query param or default
        pass
    elif not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    return license_service.list_enriched_devices(shop_id=shop_id)


@router.post("/devices/{device_id}/stolen")
async def report_stolen_device(device_id: str, req: StolenDeviceReport, request: Request):
    """
    Reports a stolen or decommissioned PC.
    Immediately wipes active access tokens and issues an optional fresh pairing code for replacement.
    """
    shop_id = getattr(request.state, "shop_id", None) or req.shop_id
    user = getattr(request.state, "user", None)
    actor_id = user.get("user_id", "owner@shop.com") if user else "owner@shop.com"

    return license_service.report_stolen_or_replaced_device(req=req, actor_id=actor_id)


@router.get("/alerts", response_model=List[DeviceSecurityAlert])
async def list_security_alerts(request: Request):
    """Lists security alerts (e.g. suspicious account sharing or rapid IP hops)."""
    shop_id = getattr(request.state, "shop_id", None)
    user = getattr(request.state, "user", None)
    if user and user.get("is_superadmin"):
        shop_id = None  # Superadmin views platform-wide alerts

    return license_service.list_alerts(shop_id=shop_id)


@router.post("/alerts/{alert_id}/resolve")
async def resolve_security_alert(alert_id: str, request: Request):
    """Resolves an active security alert."""
    user = getattr(request.state, "user", None)
    actor_id = user.get("user_id", "staff@shop.com") if user else "staff@shop.com"
    alert = license_service.resolve_alert(alert_id=alert_id, actor_id=actor_id)
    return {"status": "resolved", "alert": alert}
