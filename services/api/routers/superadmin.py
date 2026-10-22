"""
Super Admin Control Plane & Operational Hardening Router for Print Bot Phase 6.
Enforces:
- Strict Superadmin RBAC & Step-up authentication on sensitive operations.
- Single all-inclusive subscription plan lifecycle.
- Zero customer document browsing even during emergency support.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query, Response
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from packages.contracts.models import (
    ShopLifecycleStatus,
    BillingInterval,
    ShopOnboardRequest,
    ShopOnboardResponse,
    ShopTaxInvoice,
    SuperAdminKPIs,
    BreakGlassRequest,
    BreakGlassResponse,
    StepUpChallengeRequest,
    StepUpChallengeResponse,
    StepUpVerifyRequest,
)
from services.api.services.superadmin_service import superadmin_service
from services.api.services.security_admin_service import security_admin_service

router = APIRouter(prefix="/superadmin", tags=["Super Admin Operations & Security Hardening"])


def _assert_superadmin(request: Request):
    """Verifies that the request comes from an authenticated superadmin."""
    user = getattr(request.state, "user", None)
    if not user or not user.get("is_superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin privileges required."
        )
    return user


class SuspendShopRequest(BaseModel):
    reason: str


class TransferOwnershipRequest(BaseModel):
    new_owner_email: str
    new_owner_name: str


class ManualCreditRequest(BaseModel):
    credit_paise: int
    reason: str


class GenerateTaxInvoiceRequest(BaseModel):
    interval: BillingInterval = BillingInterval.MONTHLY


class ShredShopRequest(BaseModel):
    challenge_id: str


@router.get("/kpis", response_model=SuperAdminKPIs)
async def get_platform_kpis(request: Request):
    """Returns aggregated real-time platform metrics, MRR, ARR, device states, and costs."""
    _assert_superadmin(request)
    return superadmin_service.calculate_kpis()


@router.get("/shops")
async def list_shops(
    request: Request,
    status_filter: Optional[ShopLifecycleStatus] = Query(default=None)
):
    """Lists all managed shops and branches."""
    _assert_superadmin(request)
    return {"shops": superadmin_service.list_shops(status_filter=status_filter)}


@router.post("/shops/onboard", response_model=ShopOnboardResponse)
async def onboard_shop(req: ShopOnboardRequest, request: Request):
    """Onboards a new independent Xerox shop or branch with a 14-day all-inclusive trial."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    return superadmin_service.onboard_shop(req=req, actor_id=actor_id)


@router.post("/shops/{shop_id}/suspend")
async def suspend_shop(shop_id: str, req: SuspendShopRequest, request: Request):
    """Suspends a shop's operations while safely preserving existing paid jobs."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    shop = superadmin_service.suspend_shop(shop_id=shop_id, reason=req.reason, actor_id=actor_id)
    return {"status": "suspended", "shop": shop}


@router.post("/shops/{shop_id}/restore")
async def restore_shop(shop_id: str, request: Request):
    """Restores a suspended shop to active operational status."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    shop = superadmin_service.restore_shop(shop_id=shop_id, actor_id=actor_id)
    return {"status": "restored", "shop": shop}


@router.post("/shops/{shop_id}/transfer")
async def transfer_shop_ownership(shop_id: str, req: TransferOwnershipRequest, request: Request):
    """Transfers shop ownership with audited creator lineage."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    shop = superadmin_service.transfer_shop_ownership(
        shop_id=shop_id,
        new_owner_email=req.new_owner_email,
        new_owner_name=req.new_owner_name,
        actor_id=actor_id
    )
    return {"status": "transferred", "shop": shop}


@router.post("/subscriptions/{shop_id}/dunning")
async def trigger_subscription_dunning(shop_id: str, request: Request):
    """Simulates failed renewal dunning (retry -> grace -> suspend)."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    record = superadmin_service.handle_failed_renewal(shop_id=shop_id, actor_id=actor_id)
    return {"status": "dunning_updated", "record": record}


@router.post("/subscriptions/{shop_id}/credit")
async def apply_manual_adjustment(shop_id: str, req: ManualCreditRequest, request: Request):
    """Applies a manual promotional adjustment or credit coupon."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    return superadmin_service.apply_manual_adjustment(
        shop_id=shop_id,
        credit_paise=req.credit_paise,
        reason=req.reason,
        actor_id=actor_id
    )


@router.get("/shops/{shop_id}/tax-invoices", response_model=List[ShopTaxInvoice])
async def list_shop_tax_invoices(shop_id: str, request: Request):
    """Lists official GST tax invoices for SaaS subscription billing."""
    _assert_superadmin(request)
    return superadmin_service.list_tax_invoices(shop_id=shop_id)


@router.post("/shops/{shop_id}/tax-invoices", response_model=ShopTaxInvoice)
async def generate_shop_tax_invoice(shop_id: str, req: GenerateTaxInvoiceRequest, request: Request):
    """Generates an official GST tax invoice for subscription renewal."""
    _assert_superadmin(request)
    return superadmin_service.generate_gst_invoice(shop_id=shop_id, interval=req.interval)


@router.post("/break-glass", response_model=BreakGlassResponse)
async def create_break_glass_session(req: BreakGlassRequest, request: Request):
    """
    Initiates emergency support break-glass session for a distressed shop.
    Guaranteed invariant: customer document downloads are strictly blocked.
    """
    user = _assert_superadmin(request)
    requester_id = user.get("user_id", "support_lead@printbot.in")
    return security_admin_service.initiate_break_glass(req=req, requester_id=requester_id)


@router.post("/step-up/challenge", response_model=StepUpChallengeResponse)
async def request_step_up_challenge(req: StepUpChallengeRequest, request: Request):
    """Issues a step-up challenge for sensitive administrative operations."""
    user = _assert_superadmin(request)
    user_id = user.get("user_id", "superadmin@printbot.in")
    return security_admin_service.create_step_up_challenge(user_id=user_id, action_type=req.action_type)


@router.post("/step-up/verify")
async def verify_step_up_challenge(req: StepUpVerifyRequest, request: Request):
    """Verifies a step-up challenge using password or TOTP code."""
    user = _assert_superadmin(request)
    security_admin_service.verify_step_up(req=req, user=user)
    return {"status": "verified", "challenge_id": req.challenge_id}


@router.get("/export/billing")
async def export_billing_csv(request: Request):
    """Exports SaaS platform billing ledger in CSV format."""
    _assert_superadmin(request)
    csv_data = superadmin_service.export_saas_billing_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=printbot_saas_billing_ledger.csv"}
    )


@router.get("/audit/chain-verify")
async def verify_audit_hash_chain(request: Request):
    """Traverses the cryptographic tamper-evident audit log chain from genesis."""
    _assert_superadmin(request)
    is_valid, error_msg = security_admin_service.verify_chain_integrity()
    return {
        "tamper_evident_valid": is_valid,
        "error": error_msg,
        "total_chained_blocks": len(security_admin_service._audit_chain)
    }


@router.post("/drills/backup-restore")
async def trigger_disaster_recovery_drill(request: Request):
    """Simulates an automated point-in-time database and storage restore drill."""
    _assert_superadmin(request)
    return security_admin_service.run_backup_and_restore_drill()


@router.post("/shops/{shop_id}/cryptographic-shred")
async def execute_shop_cryptographic_shredding(shop_id: str, req: ShredShopRequest, request: Request):
    """
    Executes DPDP/GDPR-compliant data shredding drill.
    Requires verified step-up authentication. Zero raw document viewing.
    """
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    return security_admin_service.execute_shop_cryptographic_shredding(
        shop_id=shop_id,
        challenge_id=req.challenge_id,
        actor_id=actor_id
    )
