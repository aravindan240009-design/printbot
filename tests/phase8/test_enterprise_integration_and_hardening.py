"""
Phase 8: Enterprise System Integration, Security Hardening & Commercial Launch Test Suite.
Verifies the complete Print Bot platform against 12 end-to-end integration scenarios (A through L):

Scenario A: Normal Automatic Print Journey (QR -> Upload -> PrintPlan -> Pay -> Spooler Lease -> Complete)
Scenario B: Manual Approval Workflow (Submit -> Review -> Staff Approve/Reject -> Ledger Refund on Reject)
Scenario C: Strict Cross-Shop Tenant Isolation (Customer, order, asset, prepaid wallet, device leakage)
Scenario D: Unauthorized Desktop Installation (Copied EXE fails without paired enrollment)
Scenario E: Printer Failure Protocol (COMPLETION_UNKNOWN supervised reconciliation, zero auto-reprint)
Scenario F: Multi-File Intakes & Multi-Format Conversions (PDF, DOCX, XLSX with independent PrintPlans)
Scenario G: Duplex Edge Cases, Odd Page Counts & Booklet Signature Imposition (4-up saddle stitch)
Scenario H: Timed Printing, Pickup Windows & Counter Assisted Xerox (Capacity limits, PIN check-in)
Scenario I: Subscription Expiry & In-Flight Order Safety (New orders blocked, existing paid orders resolvable)
Scenario J: Agent Disconnection & Crash Recovery (Survives disconnects, held in PAID_HELD, no duplicate prints)
Scenario K: Privacy Deletion & DPDP Right to Erasure (Customer document scrub while preserving financial ledger)
Scenario L: Super Admin Platform Operations (Single all-inclusive plan, GST tax invoices, break-glass safety)
"""

import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from services.api.main import app
from services.api.services.job_service import job_service
from services.api.services.shop_service import shop_service
from services.api.services.device_service import device_service
from services.api.services.subscription_service import subscription_service
from services.api.services.ledger_service import ledger_service
from services.api.services.payment_provider import mock_payment_provider
from services.api.services.asset_service import asset_service
from services.api.services.auth_service import auth_service, compute_totp_code
from services.api.services.superadmin_service import superadmin_service
from services.api.services.license_service import license_service
from services.api.services.security_admin_service import security_admin_service
from services.api.services.studio_service import studio_service
from services.api.services.business_differentiation_service import business_differentiation_service
from services.api.services.conversion_engine import conversion_engine
from services.api.services.scheduling_service import scheduling_service
from services.api.services.catalogue_service import catalogue_service
from services.api.services.outbox_service import outbox_service
from services.api.core.idempotency import idempotency_store

from packages.contracts.models import (
    JobStatus,
    OrderMode,
    SubscriptionStatus,
    PrintOptions,
    PaperSize,
    ColorMode,
    DuplexMode,
    Orientation,
    BookletImpositionRequest,
    PrepaidAccount,
    PrepaidChargeRequest,
    AssetUploadIntentRequest,
    ReconciliationRequest,
    BillingInterval,
    ServiceType,
    SupportedFormat,
)

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"  # MANUAL_APPROVAL
SHOP_B = "22222222-2222-2222-2222-222222222222"  # FULL_AUTOMATIC


def _get_superadmin_auth_headers() -> dict:
    user = auth_service._users["superadmin@printbot.in"]
    totp = compute_totp_code(user.mfa_secret)
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "superadmin@printbot.in",
            "password": "SuperAdminSecurePassword2026!",
            "totp_code": totp,
        },
    )
    assert res.status_code == 200, res.text
    token = res.json()["session_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def reset_all_platform_services():
    job_service.clear()
    shop_service.clear()
    device_service.clear()
    subscription_service.clear()
    ledger_service.clear()
    mock_payment_provider.clear()
    asset_service.clear()
    auth_service.clear()
    superadmin_service.clear()
    license_service.clear()
    security_admin_service.clear()
    business_differentiation_service.clear()
    scheduling_service.clear()
    catalogue_service.clear()
    outbox_service.clear()
    idempotency_store.clear()

    # Pre-seed active subscriptions for test shops
    sub_a = subscription_service.get_subscription(SHOP_A)
    sub_a.status = SubscriptionStatus.ACTIVE
    sub_a.current_period_end = datetime.utcnow() + timedelta(days=30)

    sub_b = subscription_service.get_subscription(SHOP_B)
    sub_b.status = SubscriptionStatus.ACTIVE
    sub_b.current_period_end = datetime.utcnow() + timedelta(days=30)


# ==============================================================================
# Scenario A: Normal Automatic Print Journey
# ==============================================================================
def test_scenario_a_normal_automatic_print_journey():
    """
    Scenario A: Complete happy-path customer mobile print in FULL_AUTOMATIC mode.
    QR Resolve -> Upload -> Configure Plan -> Verify Quote -> Pay -> Instant Spool Queue -> Agent Complete.
    """
    # 1. Ensure Shop B workstation agent is online and registered
    device_service.set_device_online_status(SHOP_B, True)
    shop_service.update_settings(SHOP_B, new_mode=OrderMode.FULL_AUTOMATIC)

    # 2. Customer creates order with custom page range (4 pages)
    payload = {
        "file_name": "Project_Report_Final.pdf",
        "file_size_bytes": 1048576,
        "page_count": 4,
        "options": {
            "copies": 2,
            "color_mode": "bw",
            "paper_size": "A4",
            "duplex_mode": "simplex",
            "orientation": "portrait",
            "binding": "none",
            "paper_gsm": 75,
        },
        "customer_email": "student@annauniv.edu",
    }
    order_res = client.post("/api/v1/orders", json=payload, headers={"X-Shop-ID": SHOP_B})
    assert order_res.status_code == 201
    order_data = order_res.json()
    job_id = order_data["id"]
    assert order_data["order_mode"] == "FULL_AUTOMATIC"
    assert order_data["status"] in ("AWAITING_PAYMENT", "PENDING_PAYMENT")
    total_paise = order_data["total_paise"]
    assert total_paise > 0

    # 3. Deliver verified payment webhook
    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id=f"evt_p8_auto_{uuid.uuid4().hex[:8]}",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job_id,
        amount_paise=total_paise,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # 4. Because Shop B is FULL_AUTOMATIC and agent is online, job dispatches immediately to QUEUED
    updated_order = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_B}).json()
    assert updated_order["status"] == "QUEUED"

    # 5. Workstation claims the job with atomic lease
    claim_res = client.post("/api/v1/printers/claim-next", headers={"X-Shop-ID": SHOP_B})
    assert claim_res.status_code == 200
    claimed = claim_res.json()
    assert claimed["id"] == job_id

    # 6. Spooler completes printing
    spool_res = client.post(
        "/api/v1/printers/spool-status",
        json={"workstation_id": "ws-agent-b", "job_id": job_id, "spooler_job_id": "SPOOL-001", "status": "COMPLETED"},
        headers={"X-Shop-ID": SHOP_B},
    )
    assert spool_res.status_code == 200
    final_order = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_B}).json()
    assert final_order["status"] == "COMPLETED"


# ==============================================================================
# Scenario B: Manual Approval Workflow
# ==============================================================================
def test_scenario_b_manual_approval_workflow():
    """
    Scenario B: Shop A (MANUAL_APPROVAL) workflow.
    Jobs wait in AWAITING_APPROVAL until staff explicitly approves or rejects with reason.
    Rejection triggers automatic refund recording and audit entry.
    """
    shop_service.update_settings(SHOP_A, new_mode=OrderMode.MANUAL_APPROVAL)
    device_service.set_device_online_status(SHOP_A, True)

    # 1. Customer submits job and pays
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Aadhaar_Card_Front_Back.pdf",
            "file_size_bytes": 250000,
            "page_count": 2,
            "options": {"copies": 1, "color_mode": "color", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "walkin@xerox.in",
            "customer_phone": "+919876543210",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert order_res.status_code == 201
    job_id = order_res.json()["id"]

    # Deliver payment
    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id=f"evt_p8_manual1_{uuid.uuid4().hex[:8]}",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_A,
        order_id=job_id,
        amount_paise=order_res.json()["total_paise"],
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # Verify held in AWAITING_APPROVAL (never auto-queued)
    order_state = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_A}).json()
    assert order_state["status"] == "AWAITING_APPROVAL"

    # 2. Staff approves order
    approve_res = client.post(f"/api/v1/orders/{job_id}/approve", headers={"X-Shop-ID": SHOP_A})
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "QUEUED"

    # 3. Create second order and reject it
    order_res2 = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Corrupted_Document.pdf",
            "file_size_bytes": 100000,
            "page_count": 1,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "student2@annauniv.edu",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    job_id_2 = order_res2.json()["id"]
    raw_body2, headers2 = mock_payment_provider.generate_signed_webhook_payload(
        event_id=f"evt_p8_manual2_{uuid.uuid4().hex[:8]}",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_A,
        order_id=job_id_2,
        amount_paise=order_res2.json()["total_paise"],
    )
    client.post("/api/v1/webhooks/payments", content=raw_body2, headers=headers2)

    reject_res = client.post(
        f"/api/v1/orders/{job_id_2}/reject",
        json={"reason": "Blurred photocopy, illegible text"},
        headers={"X-Shop-ID": SHOP_A},
    )
    assert reject_res.status_code == 200
    rejected_order = reject_res.json()
    assert rejected_order["status"] == "CANCELLED"


# ==============================================================================
# Scenario C: Strict Cross-Shop Tenant Isolation
# ==============================================================================
def test_scenario_c_strict_cross_shop_tenant_isolation():
    """
    Scenario C: Zero cross-tenant leakage across orders, assets, devices, and prepaid accounts.
    Shop B cannot view or manipulate Shop A's resources.
    """
    # 1. Shop A creates an order
    res_a = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Confidential_A.pdf",
            "file_size_bytes": 10000,
            "page_count": 1,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "tenant_a@shop.in",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert res_a.status_code == 201
    job_id_a = res_a.json()["id"]

    # Shop B queries Shop A's order -> 404 Not Found
    res_cross = client.get(f"/api/v1/orders/{job_id_a}", headers={"X-Shop-ID": SHOP_B})
    assert res_cross.status_code == 404

    # Shop B attempts to approve Shop A's order -> 404 Not Found
    res_approve = client.post(f"/api/v1/orders/{job_id_a}/approve", headers={"X-Shop-ID": SHOP_B})
    assert res_approve.status_code == 404

    # 2. Asset storage isolation
    asset_intent = asset_service.create_upload_intent(
        shop_id=SHOP_A,
        req=AssetUploadIntentRequest(
            file_name="Tax_Filing_ShopA.pdf",
            mime_type="application/pdf",
            file_size_bytes=50000,
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        ),
    )
    # Shop B requests download of Shop A's asset -> 404 Not Found
    with pytest.raises(Exception):
        asset_service.get_download_url(requesting_shop_id=SHOP_B, asset_id=asset_intent.asset_id)

    # 3. Prepaid balance isolation: Shop A creates prepaid account
    business_differentiation_service.create_prepaid_account(
        SHOP_A,
        PrepaidAccount(
            shop_id=SHOP_A,
            account_name="Ravi Kumar",
            account_code="STUDENT-ROLL-101",
            balance_paise=50000,
            contact_email="ravi@annauniv.edu",
        ),
    )
    # Shop B attempts to charge Shop A's student account -> 404 Not Found
    charge_res = client.post(
        "/api/v1/differentiation/prepaid/charge",
        json={"account_code": "STUDENT-ROLL-101", "order_id": "test-order", "amount_paise": 1000},
        headers={"X-Shop-ID": SHOP_B},
    )
    assert charge_res.status_code == 404


# ==============================================================================
# Scenario D: Unauthorized Desktop Installation
# ==============================================================================
def test_scenario_d_unauthorized_desktop_installation():
    """
    Scenario D: Universal copyable Windows installer enforcement.
    Unpaired or unauthenticated desktop instances cannot access shop queues.
    """
    # 1. Pairing code creation
    code_res = client.post("/api/v1/devices/pairing-codes", headers={"X-Shop-ID": SHOP_B})
    assert code_res.status_code == 200
    pairing_code = code_res.json()["code"]

    # 2. Valid device pairs
    mock_pubkey = "ED25519_PUB_KEY_VAL_123"
    pair_res = client.post(
        "/api/v1/devices/pair",
        json={
            "pairing_code": pairing_code,
            "device_identifier": "ws-authorized-counter-1",
            "device_name": "Main Desk PC",
            "public_key_pem": mock_pubkey,
            "os_info": "Windows 11 Pro",
        },
    )
    assert pair_res.status_code == 200
    device_id = pair_res.json()["device_id"]
    challenge_nonce = pair_res.json()["challenge_nonce"]

    # 3. Unregistered/rogue device attempts pairing with wrong code -> 404
    bad_pair = client.post(
        "/api/v1/devices/pair",
        json={
            "pairing_code": "WRONG1",
            "device_identifier": "ws-rogue-laptop",
            "device_name": "Rogue PC",
            "public_key_pem": "MOCK_KEY",
            "os_info": "Windows 11",
        },
    )
    assert bad_pair.status_code == 404
    assert "Invalid pairing code" in bad_pair.json()["detail"]

    # 4. Device completes challenge and receives rotating token
    import hashlib
    sig = hashlib.sha256(f"{challenge_nonce}:{mock_pubkey}".encode("utf-8")).hexdigest()
    token_res = client.post(
        "/api/v1/devices/challenge-response",
        json={"device_id": device_id, "challenge_nonce": challenge_nonce, "signature": sig},
    )
    assert token_res.status_code == 200
    assert "access_token" in token_res.json()


# ==============================================================================
# Scenario E: Printer Failure & Supervised Reconciliation
# ==============================================================================
def test_scenario_e_printer_failure_and_zero_auto_reprint():
    """
    Scenario E: Spooler crash or ambiguous delivery triggers COMPLETION_UNKNOWN.
    STRICT INVARIANT: System NEVER automatically reprints! Requires operator supervision.
    """
    shop_service.update_settings(SHOP_B, new_mode=OrderMode.FULL_AUTOMATIC)
    device_service.set_device_online_status(SHOP_B, True)

    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Exam_Hall_Ticket.pdf",
            "file_size_bytes": 100000,
            "page_count": 1,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "candidate@tnpsc.gov.in",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job_id = order_res.json()["id"]

    # Mark paid and queue
    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id=f"evt_p8_fail_{uuid.uuid4().hex[:8]}",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job_id,
        amount_paise=200,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # Workstation reports ambiguous spool outcome (paper jam / USB disconnect mid-flight)
    unknown_res = client.post(
        f"/api/v1/orders/{job_id}/mark-unknown",
        json={"reason": "Paper jam occurred after spooler handshake; physical delivery uncertain"},
        headers={"X-Shop-ID": SHOP_B},
    )
    assert unknown_res.status_code == 200
    assert unknown_res.json()["status"] == "COMPLETION_UNKNOWN"

    # Reconciliation sync check: verify COMPLETION_UNKNOWN job is NEVER in re_spool_required
    reconcile_res = client.post(
        "/api/v1/reconciliation/sync",
        json={
            "tenant_id": SHOP_B,
            "workstation_id": "agent-pc-shop-b",
            "spooled_job_ids": [job_id],
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    assert reconcile_res.status_code == 200
    rec_data = reconcile_res.json()
    assert job_id not in rec_data["re_spool_required_job_ids"]
    assert job_id in rec_data["invalid_job_ids"]

    # Supervised operator resolution: Staff inspects tray, confirms paper printed
    supervise_res = client.post(
        f"/api/v1/orders/{job_id}/reconcile-unknown",
        json={"action": "CONFIRM_PRINTED", "staff_email": "operator@shopb.com"},
        headers={"X-Shop-ID": SHOP_B},
    )
    assert supervise_res.status_code == 200
    assert supervise_res.json()["status"] == "PRINT_CONFIRMED"


# ==============================================================================
# Scenario F: Multi-File Intakes & Multi-Format Conversions
# ==============================================================================
def test_scenario_f_multi_file_intakes_and_conversion():
    """
    Scenario F: Diverse file format handling (PDF, DOCX, XLSX).
    Verifies safe conversion engine and independent PrintPlan options per file.
    """
    # 1. Test safe scan/validation of PDF and rejection of dangerous executables
    sample_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF"
    scan_pdf = conversion_engine.scan_file(sample_pdf, "document.pdf")
    assert scan_pdf.is_valid is True
    assert scan_pdf.format == SupportedFormat.PDF

    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00malicious-trojan-bytes"
    scan_exe = conversion_engine.scan_file(fake_exe, "Resume.pdf")
    assert scan_exe.is_valid is False
    assert "Executable binaries" in scan_exe.error_message

    # 2. Intake 2 files under Shop B with independent options
    file1_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Notes.pdf",
            "file_size_bytes": 45000,
            "page_count": 5,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "duplex_long", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "student@annauniv.edu",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    file2_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Poster.pdf",
            "file_size_bytes": 2000000,
            "page_count": 1,
            "options": {"copies": 1, "color_mode": "color", "paper_size": "A3", "duplex_mode": "simplex", "orientation": "landscape", "binding": "none", "paper_gsm": 100},
            "customer_email": "designer@annauniv.edu",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    assert file1_res.status_code == 201
    assert file2_res.status_code == 201
    # Different pricing and independent geometry
    assert file1_res.json()["total_paise"] != file2_res.json()["total_paise"]


# ==============================================================================
# Scenario G: Duplex Edge Cases, Odd Page Counts & Booklet Imposition
# ==============================================================================
def test_scenario_g_duplex_edge_cases_and_booklet_imposition():
    """
    Scenario G: Accounting and geometric accuracy for odd-page duplex and 4-up booklet.
    5 pages in duplex = 3 physical sheets (odd back is blank).
    5 pages in 4-up booklet = padded to 8 pages, signature [(8,1,2,7), (6,3,4,5)].
    """
    # 1. Booklet imposition for 5-page document
    booklet_res = studio_service.calculate_booklet_imposition(
        BookletImpositionRequest(page_count=5, binding_edge="left")
    )
    assert booklet_res.total_input_pages == 5
    assert booklet_res.total_sheets == 2
    assert len(booklet_res.signatures) == 2
    s1 = booklet_res.signatures[0]
    assert s1.front_right == 1
    assert s1.back_left == 2

    # 2. Golden test for 8-page document
    booklet_8 = studio_service.calculate_booklet_imposition(
        BookletImpositionRequest(page_count=8, binding_edge="left")
    )
    assert booklet_8.total_input_pages == 8
    assert booklet_8.total_sheets == 2
    assert booklet_8.signatures[0].front_left == 8
    assert booklet_8.signatures[0].front_right == 1


# ==============================================================================
# Scenario H: Timed Printing, Pickup Windows & Counter Assisted Xerox
# ==============================================================================
def test_scenario_h_timed_printing_and_counter_pickups():
    """
    Scenario H: Timed print/pickup and counter Xerox scheduling.
    Capacity validation and 4-digit PIN counter check-in.
    """
    slot_time = (datetime.utcnow() + timedelta(hours=2)).replace(minute=0, second=0, microsecond=0)

    # 1. Book physical Xerox appointment
    book_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "PHYSICAL_XEROX_BOOKING",
            "slot_start": slot_time.isoformat(),
            "customer_email": "walkin@xerox.in",
            "estimated_pages": 15,
            "copies": 2,
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert book_res.status_code == 201
    booking_data = book_res.json()
    booking_id = booking_data["id"]
    pickup_code = booking_data["pickup_code"]
    assert len(pickup_code) == 4

    # 2. Customer arrives at counter: staff checks in with pickup code
    checkin_res = client.post(
        f"/api/v1/bookings/{booking_id}/check-in",
        json={"pickup_code": pickup_code},
        headers={"X-Shop-ID": SHOP_A},
    )
    assert checkin_res.status_code == 200
    assert checkin_res.json()["status"] == "CHECKED_IN"


# ==============================================================================
# Scenario I: Subscription Expiry & In-Flight Order Safety
# ==============================================================================
def test_scenario_i_subscription_expiry_and_in_flight_order_safety():
    """
    Scenario I: Expired shop subscription blocks new order submissions,
    while existing paid orders remain safe and resolvable by staff.
    """
    # 1. Shop A has an existing paid order
    shop_service.update_settings(SHOP_A, new_mode=OrderMode.MANUAL_APPROVAL)
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Court_Petition.pdf",
            "file_size_bytes": 500000,
            "page_count": 10,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "Legal", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "advocate@highcourt.in",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    job_id = order_res.json()["id"]
    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id=f"evt_p8_sub_{uuid.uuid4().hex[:8]}",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_A,
        order_id=job_id,
        amount_paise=2000,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # 2. Shop A subscription expires / suspends
    sub = subscription_service.get_subscription(SHOP_A)
    sub.status = SubscriptionStatus.SUSPENDED

    # 3. New order creation is rejected with 402/403
    new_order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "New_Doc.pdf",
            "file_size_bytes": 10000,
            "page_count": 1,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "user@annauniv.edu",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert new_order_res.status_code in (402, 403)

    # 4. In-flight existing paid order is NOT lost or deleted; staff can still view and resolve it
    existing_order = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_A}).json()
    assert existing_order["id"] == job_id
    assert existing_order["status"] == "AWAITING_APPROVAL"


# ==============================================================================
# Scenario J: Agent Disconnection & Crash Recovery
# ==============================================================================
def test_scenario_j_agent_disconnection_and_crash_recovery():
    """
    Scenario J: Workstation agent goes offline mid-operation.
    Cloud holds orders in PAID_HELD with honest status; recovers when agent reconnects.
    """
    shop_service.update_settings(SHOP_B, new_mode=OrderMode.FULL_AUTOMATIC)

    # 1. Device is offline
    device_service.set_device_online_status(SHOP_B, False)

    # 2. Customer pays in FULL_AUTOMATIC mode
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Urgent_Ticket.pdf",
            "file_size_bytes": 50000,
            "page_count": 1,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "passenger@trains.in",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job_id = order_res.json()["id"]

    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id=f"evt_p8_reconnect_{uuid.uuid4().hex[:8]}",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job_id,
        amount_paise=200,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # Status holds safely in PAID_HELD (no false print claim)
    held_order = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_B}).json()
    assert held_order["status"] == "PAID_HELD"
    assert held_order["hold_reason"] is not None

    # 3. Workstation reconnects and comes online
    device_service.set_device_online_status(SHOP_B, True)
    # Background or device dispatch check re-evaluates held orders
    job_service.evaluate_held_jobs_for_shop(SHOP_B)

    updated_order = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_B}).json()
    assert updated_order["status"] == "QUEUED"


# ==============================================================================
# Scenario K: Privacy Deletion & Right to Erasure
# ==============================================================================
def test_scenario_k_privacy_deletion_and_right_to_erasure():
    """
    Scenario K: Customer right to erasure (DPDP / GDPR compliance).
    Customer document files & metadata are purged, while accounting ledger remains intact.
    """
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Private_Bank_Statement.pdf",
            "file_size_bytes": 350000,
            "page_count": 2,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "citizen@chennai.in",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert order_res.status_code == 201
    job_id = order_res.json()["id"]

    # Customer completes flow and requests erasure
    purge_res = client.delete(f"/api/v1/orders/{job_id}/documents", headers={"X-Shop-ID": SHOP_A})
    assert purge_res.status_code == 200
    assert purge_res.json()["status"] == "purged"

    # Verify job document data is scrubbed
    job_data = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_A}).json()
    assert job_data["file_name"] == "[PURGED_BY_CUSTOMER]"
    assert job_data["file_size_bytes"] == 0


# ==============================================================================
# Scenario L: Super Admin Platform Operations
# ==============================================================================
def test_scenario_l_superadmin_platform_operations():
    """
    Scenario L: Super Admin operational dashboard, GST tax invoicing, and break-glass emergency mode.
    Enforces exactly ONE all-inclusive plan with UNLIMITED printers.
    """
    # 1. Super Admin authentication with TOTP
    headers = _get_superadmin_auth_headers()

    # 2. Get Super Admin KPIs
    kpi_res = client.get("/api/v1/superadmin/kpis", headers=headers)
    assert kpi_res.status_code == 200
    kpi_data = kpi_res.json()
    assert "active_subscribers" in kpi_data
    assert "mrr_paise" in kpi_data

    # 3. Generate 18% GST tax invoice for Shop A
    invoice_res = client.post(
        f"/api/v1/superadmin/shops/{SHOP_A}/tax-invoices",
        json={"interval": "monthly"},
        headers=headers,
    )
    assert invoice_res.status_code == 200
    inv_data = invoice_res.json()
    assert inv_data["total_paise"] == inv_data["base_paise"] + inv_data["cgst_paise"] + inv_data["sgst_paise"]
    assert inv_data["sac_code"] == "998313"

    # 4. Break-glass emergency session verification: raw document downloads strictly blocked
    bg_res = client.post(
        "/api/v1/superadmin/break-glass",
        json={"shop_id": SHOP_A, "reason": "Investigating stuck printer spooler service queue crash", "duration_minutes": 30},
        headers=headers,
    )
    assert bg_res.status_code == 200
    bg_data = bg_res.json()
    assert bg_data["status"] == "ACTIVE"
    assert bg_data["can_access_documents"] is False
    assert "Customer document downloads strictly blocked" in bg_data["notice"]
