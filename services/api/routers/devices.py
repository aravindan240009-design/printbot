"""
Windows Device Enrollment Protocol & Workstation Hardware Router.
- Short-TTL pairing code generation by shop staff.
- Asymmetric keypair enrollment & cryptographic challenge-response.
- Device heartbeat & hardware metrics collection.
- Revocation endpoint for shop owners.
- Job polling with hardware license check & subscription verification.
"""

from fastapi import APIRouter, Request, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from packages.contracts.models import (
    DevicePairRequest,
    DeviceChallengeResponse,
    DeviceChallengeProof,
    DeviceTokenResponse,
    DeviceHeartbeatRequest,
    DeviceHeartbeatResponse,
    JobStatus,
)
from services.api.services.device_service import device_service
from services.api.services.job_service import job_service
from services.api.services.subscription_service import subscription_service

router = APIRouter(prefix="/devices", tags=["Windows Device Enrollment & Spooler"])


class RevokeDeviceRequest(BaseModel):
    reason: str = "Revoked by shop owner"


@router.post("/pairing-codes")
async def create_pairing_code(request: Request):
    """Generates a 6-character single-use short-TTL pairing code for desktop enrollment."""
    shop_id = getattr(request.state, "shop_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    user = getattr(request.state, "user", None)
    staff_id = user["user_id"] if user else None

    return device_service.create_pairing_code(shop_id=shop_id, created_by_staff_id=staff_id)


@router.post("/pair", response_model=DeviceChallengeResponse)
async def pair_device(req: DevicePairRequest):
    """Device submits pairing code & public key. Receives cryptographic challenge nonce."""
    return device_service.pair_device(req)


@router.post("/challenge-response", response_model=DeviceTokenResponse)
async def verify_challenge(proof: DeviceChallengeProof):
    """Device returns signed challenge nonce. Receives rotating device access token."""
    return device_service.verify_challenge_and_issue_token(proof)


@router.post("/heartbeat", response_model=DeviceHeartbeatResponse)
async def device_heartbeat(req: DeviceHeartbeatRequest, request: Request):
    """Device sends periodic hardware metrics, spooler status, and heartbeat."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Device token required.")
    token_str = auth_header.split(" ", 1)[1].strip()
    return device_service.process_heartbeat(token_str, req)


@router.post("/{device_id}/revoke")
async def revoke_device(device_id: str, req: RevokeDeviceRequest, request: Request):
    """Shop owner revokes a Windows device. Active device tokens become immediately invalid."""
    shop_id = getattr(request.state, "shop_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    revoked = device_service.revoke_device(shop_id=shop_id, device_id=device_id, reason=req.reason)
    return {
        "status": "revoked",
        "device_id": revoked.id,
        "revoked_at": revoked.revoked_at.isoformat() if revoked.revoked_at else None,
        "reason": req.reason
    }


@router.get("")
async def list_devices(request: Request):
    """Lists all paired devices for the current shop."""
    shop_id = getattr(request.state, "shop_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return {"devices": device_service.list_devices(shop_id)}


@router.get("/jobs/next")
async def poll_next_job(request: Request):
    """
    Device fetches next queued print job for its authorized shop.
    Verifies device token and shop subscription license.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Device token required.")
    token_str = auth_header.split(" ", 1)[1].strip()

    device_id, shop_id = device_service.validate_device_token(token_str)

    # Check shop subscription status
    sub_status = subscription_service.check_operational_status(shop_id)
    if sub_status.value in ("suspended", "canceled"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Shop subscription is {sub_status.value}. Device is not authorized to fetch jobs."
        )

    # Find next queued job
    queued_jobs = job_service.list_jobs(tenant_id=shop_id, status_filter=JobStatus.QUEUED)
    if not queued_jobs:
        return {"has_job": False, "job": None}

    next_job = queued_jobs[0]
    # Mark spooling
    job_service.assign_to_workstation(shop_id, next_job.id, device_id)

    return {
        "has_job": True,
        "job": next_job,
        "device_id": device_id,
        "shop_id": shop_id
    }
