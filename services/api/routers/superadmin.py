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

class ApproveApplicationRequest(BaseModel):
    generated_username: str
    generated_key: str
    plan: str


class UpdateApplicationPlanRequest(BaseModel):
    plan: str


class DirectLicenseIssueRequest(BaseModel):
    id: Optional[str] = None
    shop_name: str
    username: str
    license_key: str
    plan: str = "1 Year"
    city: Optional[str] = "Branch Counter 01"
    phone: Optional[str] = "+91 90000 00000"


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


@router.get("/applications")
async def list_pilot_applications(request: Request):
    """Lists pilot applications with server-side superadmin authorization."""
    _assert_superadmin(request)
    return {"applications": superadmin_service.list_applications()}


@router.patch("/applications/{app_id}/plan")
async def update_pilot_application_plan(app_id: str, req: UpdateApplicationPlanRequest, request: Request):
    """Updates pilot application subscription plan with server-side superadmin authorization."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    app = superadmin_service.update_application_plan(app_id=app_id, new_plan=req.plan, actor_id=actor_id)
    return {"status": "success", "application": app}


@router.post("/applications/{app_id}/approve")
async def approve_pilot_application(app_id: str, req: ApproveApplicationRequest, request: Request):
    """Approves pilot application with server-side superadmin authorization."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    app = superadmin_service.approve_application(
        app_id=app_id,
        generated_username=req.generated_username,
        generated_key=req.generated_key,
        plan=req.plan,
        actor_id=actor_id
    )
    return {"status": "success", "application": app}


@router.post("/applications/{app_id}/reject")
async def reject_pilot_application(app_id: str, request: Request):
    """Rejects pilot application with server-side superadmin authorization."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    app = superadmin_service.reject_application(app_id=app_id, actor_id=actor_id)
    return {"status": "rejected", "application": app}


@router.delete("/applications/{app_id}")
async def delete_pilot_application(app_id: str, request: Request):
    """Deletes pilot application with server-side superadmin authorization."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    superadmin_service.delete_application(app_id=app_id, actor_id=actor_id)
    return {"status": "deleted", "id": app_id}


@router.post("/licenses/issue")
async def issue_direct_license(req: DirectLicenseIssueRequest, request: Request):
    """Issues authenticated shop license key directly via superadmin."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    res = superadmin_service.issue_direct_license(req=req.model_dump(), actor_id=actor_id)
    return {"status": "issued", "license": res}


@router.post("/licenses/{username}/revoke")
async def revoke_direct_license(username: str, request: Request):
    """Toggles active/revoked status of an issued license via superadmin."""
    user = _assert_superadmin(request)
    actor_id = user.get("user_id", "superadmin@printbot.in")
    res = superadmin_service.revoke_direct_license(username=username, actor_id=actor_id)
    return {"status": "updated", "license": res}
