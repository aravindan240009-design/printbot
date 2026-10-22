"""
Shop Owner & Platform Superadmin Operational Dashboards Router.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from typing import Optional, List
from services.api.services.job_service import job_service
from services.api.services.subscription_service import subscription_service
from services.api.services.device_service import device_service
from services.api.services.audit_service import audit_service
from services.api.services.shop_service import shop_service, ShopSettings
from packages.contracts.models import OrderMode
from pydantic import BaseModel

router = APIRouter(tags=["Operations & Dashboards"])


class UpdateShopSettingsRequest(BaseModel):
    order_mode: Optional[OrderMode] = None
    cash_allowed: Optional[bool] = None
    upi_allowed: Optional[bool] = None
    retention_hours: Optional[int] = None


@router.get("/shops/settings", response_model=ShopSettings)
async def get_shop_settings(request: Request):
    """Retrieves operational settings and order mode for the shop."""
    shop_id = getattr(request.state, "tenant_id", None) or getattr(request.state, "shop_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")
    return shop_service.get_settings(shop_id)


@router.patch("/shops/settings", response_model=ShopSettings)
async def update_shop_settings(req: UpdateShopSettingsRequest, request: Request):
    """
    Updates shop mode (FULL_AUTOMATIC vs MANUAL_APPROVAL) and policies.
    Logged to audit trail and applied to future jobs only.
    """
    shop_id = getattr(request.state, "tenant_id", None) or getattr(request.state, "shop_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    user = getattr(request.state, "user", None)
    actor_id = user.get("email", "owner@shop.com") if user else "owner@shop.com"

    return shop_service.update_settings(
        shop_id=shop_id,
        new_mode=req.order_mode,
        cash_allowed=req.cash_allowed,
        upi_allowed=req.upi_allowed,
        retention_hours=req.retention_hours,
        actor_id=actor_id,
    )


@router.get("/shops/dashboard")
async def get_shop_dashboard(request: Request):
    """Returns dashboard metrics for the authenticated shop owner."""
    shop_id = getattr(request.state, "shop_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    sub = subscription_service.get_subscription(shop_id)
    devices = device_service.list_devices(shop_id)
    jobs = job_service.list_jobs(tenant_id=shop_id)

    return {
        "shop_id": shop_id,
        "subscription": {
            "status": subscription_service.check_operational_status(shop_id).value,
            "plan": sub.plan_id,
            "billing_interval": sub.billing_interval.value,
            "period_end": sub.current_period_end.isoformat(),
            "admin_override": sub.admin_override
        },
        "metrics": {
            "total_jobs": len(jobs),
            "queued_jobs": len([j for j in jobs if j.status.value == "QUEUED"]),
            "paired_devices_count": len(devices),
            "safety_quotas": sub.quota_limits.model_dump() if hasattr(sub.quota_limits, "model_dump") else sub.quota_limits.dict()
        }
    }


@router.get("/superadmin/dashboard")
async def get_superadmin_dashboard(request: Request):
    """Returns platform overview for superadmins."""
    user = getattr(request.state, "user", None)
    if not user or not user.get("is_superadmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin access required.")

    events = audit_service.list_events(limit=20)
    return {
        "platform": "Print Bot Multi-Tenant SaaS Control Plane",
        "single_plan": {
            "plan_id": "ALL_INCLUSIVE",
            "monthly_price_paise": 99900,
            "annual_price_paise": 999000,
            "printers_entitlement": "UNLIMITED"
        },
        "recent_audit_events": [e.model_dump() if hasattr(e, "model_dump") else e.dict() for e in events]
    }


@router.get("/audit/events")
async def get_audit_events(
    request: Request,
    shop_id: Optional[str] = Query(default=None),
    action: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200)
):
    """Lists immutable audit log events. Scoped to authenticated shop unless superadmin."""
    current_shop = getattr(request.state, "shop_id", None)
    user = getattr(request.state, "user", None)
    is_superadmin = user and user.get("is_superadmin")

    effective_shop_id = current_shop
    if is_superadmin:
        effective_shop_id = shop_id  # Superadmin can filter or view all

    events = audit_service.list_events(shop_id=effective_shop_id, action=action, limit=limit)
    return {"audit_events": [e.model_dump() if hasattr(e, "model_dump") else e.dict() for e in events]}
