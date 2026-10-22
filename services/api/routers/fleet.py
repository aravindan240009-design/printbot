"""
Agent Fleet Management, Update Distribution & Operational Telemetry Router for Print Bot Phase 6.
Provides:
- Signed agent release channels (dev_unsigned, beta_tested, production_signed).
- Forced critical security update evaluation with grace period policies.
- Content-free operational telemetry ingestion (ZERO file names, ZERO customer PII).
- Consented & sanitized technical diagnostic bundles.
- Device revocation safety ensuring zero dropped jobs or untracked auto-reprints.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from typing import Optional, List, Dict, Any

from packages.contracts.models import (
    ReleaseChannel,
    FleetRelease,
    FleetTelemetryReport,
    DiagnosticBundleSubmit,
    DiagnosticBundleResponse,
)
from services.api.services.fleet_service import fleet_service

router = APIRouter(prefix="/fleet", tags=["Fleet Management & Operational Telemetry"])


@router.post("/releases", response_model=FleetRelease)
async def publish_fleet_release(release: FleetRelease, request: Request):
    """Publishes a new agent software release with channel tags and signature checks."""
    user = getattr(request.state, "user", None)
    if not user or not user.get("is_superadmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin access required.")
    actor_id = user.get("user_id", "superadmin@printbot.in")
    return fleet_service.publish_release(release=release, actor_id=actor_id)


@router.get("/releases/check")
async def check_agent_release(
    current_version: str = Query(...),
    channel: ReleaseChannel = Query(default=ReleaseChannel.PRODUCTION_SIGNED)
):
    """
    Checks whether a Windows agent workstation is running the latest release,
    or is subject to mandatory critical security upgrade.
    """
    return fleet_service.check_agent_upgrade_status(current_version=current_version, channel=channel)


@router.post("/telemetry")
async def report_agent_telemetry(report: FleetTelemetryReport, request: Request):
    """
    Windows agent reports operational telemetry.
    Strict privacy compliance: strictly content-free metrics (uptime, raster ms, sheets, errors).
    """
    return fleet_service.ingest_telemetry(report=report)


@router.post("/diagnostic-bundle", response_model=DiagnosticBundleResponse)
async def submit_diagnostic_bundle(bundle: DiagnosticBundleSubmit, request: Request):
    """
    Submits a troubleshooting diagnostic bundle.
    Requires operator consent. Automated redaction scrubs Windows usernames, paths, and raw IPs.
    """
    user = getattr(request.state, "user", None)
    actor_id = user.get("user_id", "operator@shop.com") if user else "operator@shop.com"
    return fleet_service.ingest_diagnostic_bundle(bundle=bundle, actor_id=actor_id)


@router.post("/devices/{device_id}/safety")
async def apply_device_revocation_safety(device_id: str, request: Request):
    """
    Safely transitions active jobs to PAID_HELD when an agent workstation is decommissioned or revoked.
    Prevents orphaned print jobs or untracked auto-reprints.
    """
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    return fleet_service.handle_device_revocation_safety(shop_id=shop_id, device_id=device_id)
