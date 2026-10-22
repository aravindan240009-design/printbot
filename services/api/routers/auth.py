"""
Staff Authentication, Superadmin MFA, and Support Impersonation Router.
"""

from fastapi import APIRouter, Request, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from packages.contracts.models import StaffLoginRequest
from services.api.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


class ImpersonateRequest(BaseModel):
    target_shop_id: str
    reason: str
    duration_minutes: int = Field(default=15, ge=5, le=60)


@router.post("/login")
async def login(req: StaffLoginRequest, request: Request):
    """Authenticates staff or superadmin. Superadmin accounts require TOTP code."""
    ip_addr = request.client.host if request.client else "127.0.0.1"
    session = auth_service.authenticate_staff(
        email=req.email,
        password=req.password,
        totp_code=req.totp_code,
        ip_address=ip_addr
    )
    return {
        "status": "success",
        "session_token": session["session_token"],
        "user": {
            "id": session["user_id"],
            "email": session["email"],
            "full_name": session["full_name"],
            "is_superadmin": session["is_superadmin"],
            "shop_id": session["shop_id"],
            "role": session["role"],
            "permissions": session["permissions"]
        },
        "expires_at": session["expires_at"].isoformat()
    }


@router.get("/me")
async def get_current_user(request: Request):
    """Returns profile and permissions of the currently authenticated session."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )
    return {"user": user}


@router.post("/impersonate")
async def impersonate_shop(req: ImpersonateRequest, request: Request):
    """
    Superadmin explicitly initiates support impersonation for a shop.
    CRITICAL: Customer documents cannot be downloaded by impersonators without explicit consent.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required.")

    admin_token = auth_header.split(" ", 1)[1].strip()
    ip_addr = request.client.host if request.client else "127.0.0.1"

    session = auth_service.create_support_impersonation_session(
        superadmin_session_token=admin_token,
        target_shop_id=req.target_shop_id,
        reason=req.reason,
        duration_minutes=req.duration_minutes,
        ip_address=ip_addr
    )

    return {
        "status": "impersonation_active",
        "impersonation_token": session["session_token"],
        "shop_id": session["shop_id"],
        "expires_at": session["expires_at"].isoformat(),
        "can_access_documents": session["can_access_documents"],
        "notice": "Zero-retention support session active. Document downloads blocked."
    }
