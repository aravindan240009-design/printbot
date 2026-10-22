"""
Phase 6: Super Admin, Licensing, Subscription Operations, Security & Pilot Hardening Tests.
Verifies:
1. Super Admin KPI calculations, shop lifecycle, and branch hierarchy.
2. Single all-inclusive subscription plan enforcement (unlimited printers, zero tiers).
3. Indian GST tax invoicing (18% GST with CGST 9% + SGST 9% vs IGST 18%, SAC 998313).
4. SaaS subscription ledger separation from customer printing escrow.
5. Failed renewal dunning workflow (retry -> grace -> suspend).
6. License center: SHA-256 public-key fingerprints, TPM 2.0 assurance, stolen PC revocation.
7. Account sharing & rapid IP jump security anomaly detection.
8. Shop customization, platform retention ceiling (<= 72h), and microsite preview.
9. Fleet management: signed release channels, canary rollout, forced critical updates.
10. Content-free telemetry and sanitized diagnostic bundle upload.
11. Device revocation safety: jobs held in PAID_HELD, zero dropped jobs, zero auto-reprint.
12. Break-glass emergency support session (strictly zero customer document browsing).
13. Step-up re-authentication on sensitive actions.
14. Tamper-evident cryptographic audit log hash chaining.
15. Disaster recovery and cryptographic data shredding drills.
16. Cross-tenant negative isolation & RBAC enforcement.
17. Prometheus /metrics endpoint exposition.
18. Migration 004 DDL parsing and RLS enforcement.
"""

import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from services.api.main import app
from services.api.services.superadmin_service import superadmin_service
from services.api.services.license_service import license_service, compute_sha256_fingerprint
from services.api.services.shop_customization_service import shop_customization_service
from services.api.services.fleet_service import fleet_service
from services.api.services.security_admin_service import security_admin_service
from services.api.services.auth_service import auth_service, compute_totp_code
from services.api.services.subscription_service import subscription_service
from services.api.services.device_service import device_service
from services.api.services.job_service import job_service
from services.api.services.audit_service import audit_service
from packages.contracts.models import (
    ShopLifecycleStatus,
    BillingInterval,
    SubscriptionStatus,
    OrderMode,
    ReleaseChannel,
    HardwareAssurance,
    AlertSeverity,
    JobStatus,
    ShopOnboardRequest,
    StolenDeviceReport,
    FleetRelease,
    FleetTelemetryReport,
    DiagnosticBundleSubmit,
    BreakGlassRequest,
    StepUpChallengeRequest,
    StepUpVerifyRequest,
    PrintJobResponse,
    PrintOptions,
    PaperSize,
    DuplexMode,
    Orientation,
)
from infra.migrations.runner import load_migration_sql, parse_tables_from_ddl

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"
SHOP_B = "22222222-2222-2222-2222-222222222222"


@pytest.fixture(autouse=True)
def clean_services():
    superadmin_service.clear()
    license_service.clear()
    shop_customization_service.clear()
    fleet_service.clear()
    security_admin_service.clear()
    auth_service.clear()
    subscription_service.clear()
    device_service.clear()
    job_service.clear()
    audit_service.clear()


def _get_superadmin_auth_headers() -> dict:
    user = auth_service._users["superadmin@printbot.in"]
    totp = compute_totp_code(user.mfa_secret)
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "superadmin@printbot.in",
            "password": "SuperAdminSecurePassword2026!",
            "totp_code": totp
        }
    )
    assert res.status_code == 200, res.text
    token = res.json()["session_token"]
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. Super Admin KPI & Shop Lifecycle Tests
# ==============================================================================

def test_superadmin_kpis_calculation():
    headers = _get_superadmin_auth_headers()
    res = client.get("/api/v1/superadmin/kpis", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["active_subscribers"] >= 2
    assert data["mrr_paise"] > 0
    assert data["arr_paise"] > 0
    assert data["total_devices"] >= 1
    assert data["queue_age_seconds_p50"] > 0
    assert "failure_rate_pct" in data
    assert "total_sheets_printed" in data
    assert "processing_cost_paise" in data
    assert "storage_cost_paise" in data


def test_shop_onboarding_and_unique_slug_conflict():
    headers = _get_superadmin_auth_headers()
    onboard_payload = {
        "name": "Thillai Xerox & Stationers",
        "slug": "thillai-trichy",
        "owner_email": "owner@thillaixerox.in",
        "owner_name": "Ramanathan T",
        "phone": "+91-98400-33333",
        "city": "Trichy",
        "state_code": "33",
        "order_mode": "FULL_AUTOMATIC"
    }

    # 1. Successful onboarding
    res = client.post("/api/v1/superadmin/shops/onboard", json=onboard_payload, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["slug"] == "thillai-trichy"
    assert body["plan_id"] == "ALL_INCLUSIVE"
    assert "qr_link" in body

    # 2. Duplicate slug rejection (409 Conflict)
    res_dup = client.post("/api/v1/superadmin/shops/onboard", json=onboard_payload, headers=headers)
    assert res_dup.status_code == 409


def test_shop_suspension_and_restoration_lifecycle():
    headers = _get_superadmin_auth_headers()

    # 1. Suspend shop
    res_susp = client.post(
        f"/api/v1/superadmin/shops/{SHOP_A}/suspend",
        json={"reason": "Audit verification pending"},
        headers=headers
    )
    assert res_susp.status_code == 200
    assert res_susp.json()["shop"]["status"] == "SUSPENDED"

    # Verify subscription synchronized
    sub = subscription_service.get_subscription(SHOP_A)
    assert sub.status == SubscriptionStatus.SUSPENDED

    # 2. Restore shop
    res_rest = client.post(
        f"/api/v1/superadmin/shops/{SHOP_A}/restore",
        headers=headers
    )
    assert res_rest.status_code == 200
    assert res_rest.json()["shop"]["status"] == "ACTIVE"
    sub_rest = subscription_service.get_subscription(SHOP_A)
    assert sub_rest.status == SubscriptionStatus.ACTIVE


def test_branch_hierarchy_and_ownership_transfer():
    headers = _get_superadmin_auth_headers()

    # 1. Transfer ownership
    res = client.post(
        f"/api/v1/superadmin/shops/{SHOP_A}/transfer",
        json={"new_owner_email": "new_murugan@annaxerox.in", "new_owner_name": "Murugan Junior"},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["shop"]["owner_email"] == "new_murugan@annaxerox.in"

    # Verify audit event recorded
    events = audit_service.list_events(shop_id=SHOP_A, action="SHOP_OWNERSHIP_TRANSFERRED")
    assert len(events) >= 1
    assert events[0].metadata["new_owner"] == "new_murugan@annaxerox.in"


# ==============================================================================
# 2. Single Plan, GST Invoicing & Financial Segregation
# ==============================================================================

def test_single_all_inclusive_plan_enforcement():
    res = client.get("/api/v1/subscriptions/plan")
    assert res.status_code == 200
    plan = res.json()

    assert plan["plan_id"] == "ALL_INCLUSIVE"
    assert plan["pricing"]["monthly_paise"] == 99900  # ₹999
    assert plan["pricing"]["annual_paise"] == 999000  # ₹9,990
    assert plan["printer_policy"]["printers_allowed"] == "UNLIMITED"
    assert plan["printer_policy"]["per_printer_fee_paise"] == 0
    assert plan["printer_policy"]["tier_based_printer_limits"] is False


def test_indian_gst_tax_invoice_generation():
    headers = _get_superadmin_auth_headers()

    # 1. Intra-state (Tamil Nadu 33 -> 33) monthly: CGST 9% + SGST 9%
    inv = superadmin_service.generate_gst_invoice(shop_id=SHOP_A, interval=BillingInterval.MONTHLY)
    assert inv.base_paise == 99900
    assert inv.cgst_paise == int(round(99900 * 0.09))
    assert inv.sgst_paise == int(round(99900 * 0.09))
    assert inv.igst_paise == 0
    assert inv.total_paise == inv.base_paise + inv.cgst_paise + inv.sgst_paise
    assert inv.sac_code == "998313"

    # 2. Inter-state (e.g. Karnataka 29): IGST 18%
    shop_b = superadmin_service.get_shop(SHOP_B)
    shop_b.state_code = "29"  # Karnataka
    inv_inter = superadmin_service.generate_gst_invoice(shop_id=SHOP_B, interval=BillingInterval.MONTHLY)
    assert inv_inter.cgst_paise == 0
    assert inv_inter.sgst_paise == 0
    assert inv_inter.igst_paise == int(round(99900 * 0.18))
    assert inv_inter.total_paise == inv_inter.base_paise + inv_inter.igst_paise

    # 3. Query via API
    res = client.get(f"/api/v1/superadmin/shops/{SHOP_A}/tax-invoices", headers=headers)
    assert res.status_code == 200
    invoices = res.json()
    assert len(invoices) >= 1
    assert invoices[0]["sac_code"] == "998313"


def test_financial_ledger_segregation_and_export():
    headers = _get_superadmin_auth_headers()

    # SaaS platform revenue is tracked in superadmin_service._saas_billing_ledger
    assert len(superadmin_service._saas_billing_ledger) >= 2

    # Export to CSV
    res = client.get("/api/v1/superadmin/export/billing", headers=headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "text/csv; charset=utf-8"
    csv_text = res.text
    assert "Event ID,Shop ID,Amount (Paise),Amount (INR),Interval,Event Type,Description,Timestamp" in csv_text
    assert "₹1178.82" in csv_text or "₹11788.20" in csv_text or "RENEWAL" in csv_text


def test_subscription_dunning_lifecycle():
    headers = _get_superadmin_auth_headers()

    # Attempt 1 -> RETRYING / PAST_DUE
    res1 = client.post(f"/api/v1/superadmin/subscriptions/{SHOP_A}/dunning", headers=headers)
    assert res1.status_code == 200
    assert res1.json()["record"]["dunning_status"] == "RETRYING"
    assert subscription_service.get_subscription(SHOP_A).status == SubscriptionStatus.PAST_DUE

    # Attempt 2 -> GRACE
    res2 = client.post(f"/api/v1/superadmin/subscriptions/{SHOP_A}/dunning", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["record"]["dunning_status"] == "GRACE"
    assert subscription_service.get_subscription(SHOP_A).status == SubscriptionStatus.GRACE

    # Attempt 3 -> SUSPENDED
    res3 = client.post(f"/api/v1/superadmin/subscriptions/{SHOP_A}/dunning", headers=headers)
    assert res3.status_code == 200
    assert res3.json()["record"]["dunning_status"] == "SUSPENDED"
    assert subscription_service.get_subscription(SHOP_A).status == SubscriptionStatus.SUSPENDED
    assert superadmin_service.get_shop(SHOP_A).status == ShopLifecycleStatus.SUSPENDED


def test_manual_promotional_adjustment_and_credits():
    headers = _get_superadmin_auth_headers()
    res = client.post(
        f"/api/v1/superadmin/subscriptions/{SHOP_A}/credit",
        json={"credit_paise": 50000, "reason": "Festive Diwali Goodwill Promo"},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["credit_applied_paise"] == 50000
    assert res.json()["total_credit_balance_paise"] == 50000


# ==============================================================================
# 3. License Center, Hardware Assurance & Anomaly Detection
# ==============================================================================

def test_license_center_device_enrichment_and_fingerprints():
    # Public key fingerprint format SHA256:xx:xx:...
    fp = compute_sha256_fingerprint("MOCK_ED25519_PUBKEY_ANNA_1")
    assert fp.startswith("SHA256:")
    assert len(fp.split(":")) == 33  # "SHA256" + 32 bytes hex

    devices = license_service.list_enriched_devices(SHOP_A)
    assert len(devices) >= 1
    dev = devices[0]
    assert dev.public_key_fingerprint.startswith("SHA256:")
    assert dev.hardware_assurance in (HardwareAssurance.TPM_2_0, HardwareAssurance.SOFTWARE_FALLBACK)
    assert dev.unlimited_printers_entitled is True


def test_stolen_or_replaced_pc_instant_revocation():
    headers = {"X-Shop-ID": SHOP_A}
    dev_a_id = "d1111111-0000-0000-0000-000000000001"

    # Report stolen
    res = client.post(
        f"/api/v1/licenses/devices/{dev_a_id}/stolen",
        json={
            "device_id": dev_a_id,
            "shop_id": SHOP_A,
            "incident_notes": "Break-in at front counter, desktop PC missing",
            "generate_replacement_pairing_code": True
        },
        headers=headers
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "device_revoked_and_isolated"
    assert body["replacement_pairing_code"] is not None

    # Verify device status is revoked
    dev = device_service._devices.get(dev_a_id)
    assert dev.status == "revoked"


def test_suspicious_account_sharing_detection():
    # Attempting to enroll conflicting key for same shop raises CRITICAL alert
    alert = license_service.detect_account_sharing(
        shop_id=SHOP_A,
        current_ip="203.0.113.45",
        public_key_pem="CONFLICTING_ROGUE_KEY_ATTEMPT_999"
    )
    assert alert is not None
    assert alert.alert_type == "SUSPICIOUS_ACCOUNT_SHARING"
    assert alert.severity == AlertSeverity.CRITICAL

    alerts = license_service.list_alerts(SHOP_A)
    assert len(alerts) >= 1


def test_rapid_ip_jump_detection():
    dev_id = "d1111111-0000-0000-0000-000000000001"
    license_service.record_device_ip(dev_id, "192.168.1.100", shop_id=SHOP_A)
    # Immediate IP jump within seconds
    license_service.record_device_ip(dev_id, "10.0.0.99", shop_id=SHOP_A)

    alerts = license_service.list_alerts(SHOP_A)
    jump_alerts = [a for a in alerts if a.alert_type == "RAPID_IP_JUMP"]
    assert len(jump_alerts) >= 1


# ==============================================================================
# 4. Shop Admin Customization, Retention Ceiling & Microsite Preview
# ==============================================================================

def test_shop_customization_and_retention_ceiling_guardrail():
    headers = {"X-Shop-ID": SHOP_A}
    # 1. Valid update
    res = client.patch(
        f"/api/v1/shops/{SHOP_A}/customization",
        json={"retention_hours": 48, "brand_primary_color": "#10B981"},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["retention_hours"] == 48

    # 2. Exceeding platform ceiling of 72 hours -> 400 Bad Request
    res_bad = client.patch(
        f"/api/v1/shops/{SHOP_A}/customization",
        json={"retention_hours": 120},
        headers=headers
    )
    assert res_bad.status_code == 400
    assert "exceeds platform maximum ceiling" in res_bad.json()["detail"]


def test_microsite_preview_and_capability_validator():
    headers = {"X-Shop-ID": SHOP_A}
    # 1. Customer-view microsite preview
    res = client.get(f"/api/v1/shops/{SHOP_A}/microsite-preview", headers=headers)
    assert res.status_code == 200
    preview = res.json()
    assert preview["shop_id"] == SHOP_A
    assert preview["order_mode"] == "FULL_AUTOMATIC"
    assert "pdf" in preview["allowed_file_types"]
    assert "bw_single" in preview["pricing_summary"]

    # 2. Capability validator
    res_val = client.get(
        f"/api/v1/shops/{SHOP_A}/validate-capability",
        params={"format_ext": "pdf", "color_mode": "bw", "paper_size": "A4"},
        headers=headers
    )
    assert res_val.status_code == 200
    assert res_val.json()["is_supported"] is True

    # 3. Disabled capability
    res_dis = client.get(
        f"/api/v1/shops/{SHOP_A}/validate-capability",
        params={"format_ext": "exe", "color_mode": "bw", "paper_size": "A4"},
        headers=headers
    )
    assert res_dis.status_code == 200
    assert res_dis.json()["is_supported"] is False


# ==============================================================================
# 5. Fleet Management, Telemetry & Diagnostics
# ==============================================================================

def test_fleet_release_channels_and_canary_rollout():
    headers = _get_superadmin_auth_headers()
    new_release = {
        "version": "1.4.0",
        "release_channel": "production_signed",
        "download_url": "https://releases.printbot.in/v1.4.0/agent.exe",
        "sha256_hash": "a" * 64,
        "signature_verified": True,
        "min_supported_version": "1.2.0",
        "is_critical": False,
        "grace_period_hours": 72,
        "rollout_percentage": 50,
        "release_notes": "Improved Windows Print Spooler Named Pipe IPC",
        "created_at": datetime.utcnow().isoformat()
    }

    res = client.post("/api/v1/fleet/releases", json=new_release, headers=headers)
    assert res.status_code == 200
    assert res.json()["version"] == "1.4.0"

    # Check upgrade status for an older agent
    res_chk = client.get("/api/v1/fleet/releases/check", params={"current_version": "1.2.0"})
    assert res_chk.status_code == 200
    assert res_chk.json()["upgrade_available"] is True


def test_fleet_forced_critical_update_policy():
    # Publish critical release created 5 days ago (> 72h grace)
    crit = FleetRelease(
        version="2.0.0",
        release_channel=ReleaseChannel.PRODUCTION_SIGNED,
        download_url="https://releases.printbot.in/v2.0.0/agent.exe",
        sha256_hash="b" * 64,
        signature_verified=True,
        min_supported_version="2.0.0",
        is_critical=True,
        grace_period_hours=72,
        rollout_percentage=100,
        release_notes="Zero-day security hotfix for spool buffer parsing.",
        created_at=datetime.utcnow() - timedelta(days=5)
    )
    fleet_service.publish_release(crit)

    status = fleet_service.check_agent_upgrade_status(current_version="1.2.0")
    assert status["is_critical"] is True
    assert status["blocked_from_leasing"] is True


def test_content_free_telemetry_privacy_compliance():
    headers = {"X-Shop-ID": SHOP_A}
    telemetry = {
        "device_id": "d1111111-0000-0000-0000-000000000001",
        "shop_id": SHOP_A,
        "agent_version": "1.2.0",
        "uptime_seconds": 3600,
        "jobs_processed": 15,
        "raster_avg_ms": 124.5,
        "sheets_printed": 42,
        "spool_errors_count": 0,
        "hardware_status": "HEALTHY"
    }
    res = client.post("/api/v1/fleet/telemetry", json=telemetry, headers=headers)
    assert res.status_code == 200
    assert res.json()["privacy_compliance"] == "CONTENT_FREE_METRICS_ONLY"


def test_diagnostic_bundle_automated_redaction():
    headers = {"X-Shop-ID": SHOP_A}
    bundle_data = {
        "shop_id": SHOP_A,
        "device_id": "d1111111-0000-0000-0000-000000000001",
        "operator_consented": True,
        "redaction_verified": True,
        "log_summary": {
            "error_msg": "Spool write failed at C:\\Users\\Administrator\\AppData\\Local\\temp\\job_9.spl",
            "lan_ip": "192.168.1.45",
            "driver_name": "HP LaserJet PCL6"
        }
    }
    res = client.post("/api/v1/fleet/diagnostic-bundle", json=bundle_data, headers=headers)
    assert res.status_code == 200
    ref = res.json()["bundle_ref"]

    stored = fleet_service._diagnostic_bundles[ref]
    assert "Administrator" not in stored["log_summary"]["error_msg"]
    assert "C:\\Users\\[REDACTED]" in stored["log_summary"]["error_msg"]
    assert stored["log_summary"]["lan_ip"] == "192.168.x.x"


def test_device_revocation_safety_preserves_paid_jobs():
    # Seed in-flight leased job
    job_id = "test_job_leased_1"
    job = PrintJobResponse(
        id=job_id,
        tenant_id=SHOP_A,
        customer_email="customer@example.com",
        status=JobStatus.LEASED,
        file_name="invoice.pdf",
        file_size_bytes=10240,
        page_count=2,
        options=PrintOptions(
            copies=1,
            color_mode="bw",
            paper_size=PaperSize.A4,
            duplex_mode=DuplexMode.SIMPLEX,
            orientation=Orientation.PORTRAIT,
        ),
        calculated_price_cents=20,
        total_paise=200,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    job_service._jobs[f"{SHOP_A}:{job_id}"] = job

    # Revocation safety
    res = client.post(
        "/api/v1/fleet/devices/d1111111-0000-0000-0000-000000000001/safety",
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res.status_code == 200
    assert res.json()["jobs_safely_held_count"] >= 1

    # Verify job is preserved in PAID_HELD (never dropped or auto-spooled)
    rescued = job_service.get_job(tenant_id=SHOP_A, job_id=job.id)
    assert rescued.status == JobStatus.PAID_HELD


# ==============================================================================
# 6. Admin Security, Break-Glass, Step-Up & Cryptographic Chaining
# ==============================================================================

def test_break_glass_emergency_support_protocol():
    headers = _get_superadmin_auth_headers()
    bg_req = {
        "shop_id": SHOP_A,
        "reason": "Printer spool queue deadlock reported during rush hour",
        "duration_minutes": 30
    }
    res = client.post("/api/v1/superadmin/break-glass", json=bg_req, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "ACTIVE"
    assert data["can_access_documents"] is False  # Zero raw document viewing
    assert "Customer document downloads strictly blocked" in data["notice"]


def test_step_up_reauth_challenge_and_verification():
    headers = _get_superadmin_auth_headers()

    # 1. Request step-up challenge
    res1 = client.post(
        "/api/v1/superadmin/step-up/challenge",
        json={"action_type": "SHRED_SHOP_DATA"},
        headers=headers
    )
    assert res1.status_code == 200
    cid = res1.json()["challenge_id"]

    # 2. Verify challenge with TOTP
    user = auth_service._users["superadmin@printbot.in"]
    totp = compute_totp_code(user.mfa_secret)
    res2 = client.post(
        "/api/v1/superadmin/step-up/verify",
        json={"challenge_id": cid, "totp_code": totp},
        headers=headers
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "verified"

    # 3. Assert guard allows verified challenge
    security_admin_service.assert_step_up_verified(cid, "SHRED_SHOP_DATA")


def test_cryptographic_audit_hash_chain_tamper_evidence():
    headers = _get_superadmin_auth_headers()

    # Verify chain is intact
    res = client.get("/api/v1/superadmin/audit/chain-verify", headers=headers)
    assert res.status_code == 200
    assert res.json()["tamper_evident_valid"] is True

    # Intentionally corrupt a block to verify tamper detection
    security_admin_service._audit_chain[0].event_hash = "CORRUPTED_HASH_ATTEMPT_12345"
    is_valid, err = security_admin_service.verify_chain_integrity()
    assert is_valid is False
    assert "Tampered hash" in err or "Broken link" in err


def test_disaster_recovery_and_cryptographic_shredding_drills():
    headers = _get_superadmin_auth_headers()

    # 1. Disaster recovery drill
    res_dr = client.post("/api/v1/superadmin/drills/backup-restore", headers=headers)
    assert res_dr.status_code == 200
    assert res_dr.json()["status"] == "PASSED"
    assert res_dr.json()["rls_policies_verified"] is True

    # 2. Cryptographic data shredding drill (requires step-up challenge)
    ch = security_admin_service.create_step_up_challenge("superadmin@printbot.in", "SHRED_SHOP_DATA")
    security_admin_service._step_up_challenges[ch.challenge_id].verified = True

    res_shred = client.post(
        f"/api/v1/superadmin/shops/{SHOP_A}/cryptographic-shred",
        json={"challenge_id": ch.challenge_id},
        headers=headers
    )
    assert res_shred.status_code == 200
    assert res_shred.json()["status"] == "shredding_completed"
    assert "zero_document_browsing_confirmed" in res_shred.json()["actions_executed"]


# ==============================================================================
# 7. Cross-Tenant Negative Isolation & Prometheus Metrics
# ==============================================================================

def test_cross_tenant_negative_isolation_and_support_rbac():
    # 1. Non-superadmin authenticated user cannot access /superadmin/kpis (403 Forbidden)
    res_owner = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@annaxerox.com", "password": "AnnaShopPassword2026!"}
    )
    assert res_owner.status_code == 200
    token_owner = res_owner.json()["session_token"]
    res = client.get("/api/v1/superadmin/kpis", headers={"Authorization": f"Bearer {token_owner}"})
    assert res.status_code == 403

    # 2. Shop B cannot access Shop A's devices
    devs_b = license_service.list_enriched_devices(SHOP_B)
    for d in devs_b:
        assert d.shop_id == SHOP_B
        assert d.shop_id != SHOP_A

    # 3. Shop B cannot access Shop A's tax invoices
    invs_b = superadmin_service.list_tax_invoices(shop_id=SHOP_B)
    for inv in invs_b:
        assert inv.shop_id == SHOP_B


def test_prometheus_metrics_endpoint():
    res = client.get("/metrics")
    assert res.status_code == 200
    assert "text/plain" in res.headers["content-type"]
    body = res.text

    assert "printbot_active_shops_total" in body
    assert "printbot_mrr_paise" in body
    assert "printbot_arr_paise" in body
    assert "printbot_devices_total" in body
    assert "printbot_sheets_printed_total" in body


def test_phase6_migration_004_and_rls_integrity():
    sql = load_migration_sql("004_phase6_schema.sql")
    tables = parse_tables_from_ddl(sql)

    assert "break_glass_sessions" in tables
    assert "admin_step_up_challenges" in tables
    assert "agent_fleet_releases" in tables
    assert "device_security_alerts" in tables
    assert "diagnostic_bundles" in tables
    assert "shop_tax_invoices" in tables

    # Verify RLS is forced
    assert "ENABLE ROW LEVEL SECURITY" in sql
    assert "FORCE ROW LEVEL SECURITY" in sql
    assert "app.current_shop_id" in sql
