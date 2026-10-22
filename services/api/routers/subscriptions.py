"""
Subscriptions & Plans Router for Print Bot Phase 1.
Implements the single all-inclusive subscription plan, unlimited printers,
usage safety quotas, administrative override, and fake billing simulation.
"""

from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, Optional
from packages.contracts.models import (
    AdminOverrideRequest,
    SubscriptionDetails,
    PlanFeatures,
    SafetyQuotas,
)
from services.api.services.subscription_service import subscription_service
from services.api.services.billing_adapter import fake_billing_adapter

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions & Single Plan"])


class WebhookSimulationRequest(BaseModel):
    shop_id: str
    event_type: str  # 'renewal_success', 'payment_failure', 'grace_expired', 'cancellation'


@router.get("/plan")
async def get_single_plan_details():
    """Returns the single all-inclusive plan terms: UNLIMITED printers, INR pricing, and all features."""
    return {
        "plan_id": "ALL_INCLUSIVE",
        "name": "Print Bot All-Inclusive Plan",
        "description": "Single comprehensive tier for Indian Xerox & Print Shops. Zero feature gating.",
        "pricing": {
            "monthly_paise": 99900,     # ₹999.00 / month
            "monthly_inr": "₹999",
            "annual_paise": 999000,     # ₹9,990.00 / year (approx 2 months free)
            "annual_inr": "₹9,990"
        },
        "printer_policy": {
            "printers_allowed": "UNLIMITED",
            "per_printer_fee_paise": 0,
            "tier_based_printer_limits": False
        },
        "features": PlanFeatures().model_dump() if hasattr(PlanFeatures(), "model_dump") else PlanFeatures().dict(),
        "usage_safety_quotas": SafetyQuotas().model_dump() if hasattr(SafetyQuotas(), "model_dump") else SafetyQuotas().dict(),
        "notes": "Honest DDoS and storage ceiling separate from printer entitlements."
    }


@router.get("")
async def get_shop_subscription(request: Request):
    """Returns subscription details and current operational status for the authenticated shop."""
    shop_id = getattr(request.state, "shop_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    sub = subscription_service.get_subscription(shop_id)
    operational_status = subscription_service.check_operational_status(shop_id)
    can_order, order_reason = subscription_service.can_submit_order(shop_id)

    return {
        "subscription": sub,
        "effective_status": operational_status,
        "can_submit_new_orders": can_order,
        "order_notice": order_reason
    }


@router.post("/override")
async def apply_superadmin_override(req: AdminOverrideRequest, request: Request):
    """
    Superadmin override for subscription suspension.
    Requires descriptive reason, tracked in audit_events.
    """
    user = getattr(request.state, "user", None)
    actor_id = user["user_id"] if user else "superadmin"

    sub = subscription_service.apply_admin_override(
        shop_id=req.shop_id,
        reason=req.reason,
        actor_id=actor_id
    )
    return {
        "status": "override_applied",
        "shop_id": req.shop_id,
        "admin_override": sub.admin_override,
        "admin_override_reason": sub.admin_override_reason
    }


@router.delete("/override")
async def revoke_superadmin_override(shop_id: str, request: Request):
    """Revokes active administrative override."""
    user = getattr(request.state, "user", None)
    actor_id = user["user_id"] if user else "superadmin"

    sub = subscription_service.revoke_admin_override(
        shop_id=shop_id,
        actor_id=actor_id
    )
    return {
        "status": "override_revoked",
        "shop_id": shop_id,
        "admin_override": sub.admin_override
    }


@router.post("/simulate-webhook")
async def simulate_billing_webhook(req: WebhookSimulationRequest):
    """
    Fake open-source billing adapter hook to simulate recurring lifecycle events locally.
    Production gateway labeled PENDING.
    """
    event_type = req.event_type.lower()
    if event_type == "renewal_success":
        result = fake_billing_adapter.simulate_renewal_success(req.shop_id)
    elif event_type == "payment_failure":
        result = fake_billing_adapter.simulate_payment_failure(req.shop_id)
    elif event_type == "grace_expired":
        result = fake_billing_adapter.simulate_grace_period_expired(req.shop_id)
    elif event_type == "cancellation":
        result = fake_billing_adapter.simulate_cancellation(req.shop_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown simulation event '{req.event_type}'. Valid: renewal_success, payment_failure, grace_expired, cancellation."
        )

    return {
        "status": "simulated",
        "event_type": req.event_type,
        "result": result,
        "gateway_status": fake_billing_adapter.pending_production_integration
    }
