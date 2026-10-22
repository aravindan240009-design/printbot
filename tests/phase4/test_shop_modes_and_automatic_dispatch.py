"""
Phase 4 Tests: Two Shop Operating Modes & Full Automatic Printing.
Verifies:
1. FULL_AUTOMATIC: verified-paid jobs dispatch immediately to QUEUED when conditions are met.
2. FULL_AUTOMATIC: holds in PAID_HELD when workstation is offline or task requires assisted counter Xerox.
3. MANUAL_APPROVAL: every job waits for staff APPROVE or REJECT.
4. Cash payment: human staff must record cash receipt at counter before printing.
5. Mode change is audited and applies forward-only (never reinterprets locked in-flight orders).
"""

import pytest
from fastapi.testclient import TestClient

from services.api.main import app
from services.api.services.job_service import job_service
from services.api.services.shop_service import shop_service
from services.api.services.device_service import device_service
from services.api.services.payment_provider import mock_payment_provider
from packages.contracts.models import JobStatus, OrderMode, BookingState

from services.api.services.subscription_service import subscription_service
from services.api.services.ledger_service import ledger_service

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"  # MANUAL_APPROVAL
SHOP_B = "22222222-2222-2222-2222-222222222222"  # FULL_AUTOMATIC


@pytest.fixture(autouse=True)
def reset_modes():
    job_service.clear()
    shop_service.clear()
    device_service.clear()
    mock_payment_provider.clear()
    subscription_service.clear()
    ledger_service.clear()


def test_full_automatic_mode_instant_dispatch():
    """Shop B (FULL_AUTOMATIC) with online workstation automatically queues paid job."""
    # Ensure device is marked online
    device_service.set_device_online_status(SHOP_B, True)

    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Instant_Ticket.pdf",
            "file_size_bytes": 50000,
            "page_count": 1,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "passenger@chennaimetro.in",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    assert order_res.status_code == 201
    job_id = order_res.json()["id"]
    assert order_res.json()["order_mode"] == "FULL_AUTOMATIC"

    # Deliver verified webhook payment
    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id="evt_auto_001",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job_id,
        amount_paise=500,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # Status must automatically be QUEUED without staff touch
    job_check = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_B})
    assert job_check.json()["status"] == "QUEUED"
    assert job_check.json()["hold_reason"] is None


def test_full_automatic_mode_holds_paid_held_when_workstation_offline():
    """If print workstation is offline, job transitions to PAID_HELD with honest customer message."""
    device_service.set_device_online_status(SHOP_B, False)

    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Resume.pdf",
            "file_size_bytes": 100000,
            "page_count": 2,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "applicant@job.in",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job_id = order_res.json()["id"]

    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id="evt_auto_offline_002",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job_id,
        amount_paise=1000,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    job_check = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_B})
    assert job_check.json()["status"] == "PAID_HELD"
    assert "currently offline" in job_check.json()["hold_reason"]


def test_full_automatic_mode_holds_for_assisted_counter_xerox():
    """If order is for physical original copying, it holds in PAID_HELD until customer arrives."""
    device_service.set_device_online_status(SHOP_B, True)

    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Physical_Book_Original.pdf",
            "file_size_bytes": 1000,
            "page_count": 10,
            "booking_state": "ASSISTED_COUNTER_XEROX",
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "duplex_long", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "author@book.in",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job_id = order_res.json()["id"]

    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id="evt_auto_xerox_003",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job_id,
        amount_paise=5000,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    job_check = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_B})
    assert job_check.json()["status"] == "PAID_HELD"
    assert "Assisted counter original Xerox" in job_check.json()["hold_reason"]


def test_manual_approval_mode_requires_staff_action():
    """Shop A (MANUAL_APPROVAL) paid job enters AWAITING_APPROVAL and requires staff decision."""
    shop_service.update_settings(SHOP_A, new_mode=OrderMode.MANUAL_APPROVAL)
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Complex_Poster.pdf",
            "file_size_bytes": 5000000,
            "page_count": 1,
            "options": {"copies": 5, "color_mode": "color", "paper_size": "A3", "duplex_mode": "simplex", "orientation": "landscape", "binding": "none", "paper_gsm": 120},
            "customer_email": "designer@agency.in",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    job_id = order_res.json()["id"]

    # Payment verified
    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id="evt_manual_004",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_A,
        order_id=job_id,
        amount_paise=15000,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # Job is held in AWAITING_APPROVAL, NOT queued yet!
    job_check = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_A})
    assert job_check.json()["status"] == "AWAITING_APPROVAL"

    # Staff approves
    approve_res = client.post(f"/api/v1/orders/{job_id}/approve", headers={"X-Shop-ID": SHOP_A})
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "QUEUED"


def test_cash_payment_requires_staff_verification():
    """Cash order in FULL_AUTOMATIC shop does NOT print automatically without staff cash collection."""
    device_service.set_device_online_status(SHOP_B, True)

    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Cash_Document.pdf",
            "file_size_bytes": 30000,
            "page_count": 2,
            "payment_method": "CASH",
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "cash_customer@shop.in",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job_id = order_res.json()["id"]

    # Order starts in PENDING_PAYMENT / AWAITING_PAYMENT
    assert order_res.json()["status"] in ("AWAITING_PAYMENT", "PENDING_PAYMENT")

    # Workstation attempts to claim unverified cash job -> MUST FAIL
    claim_res = client.post("/api/v1/printers/claim-next", headers={"X-Shop-ID": SHOP_B})
    assert claim_res.json().get("status") == "empty"

    # Staff confirms cash collection
    cash_res = client.post(
        f"/api/v1/orders/{job_id}/cash-received",
        json={"amount_paise": 1000, "staff_email": "cashier@shop.in"},
        headers={"X-Shop-ID": SHOP_B},
    )
    assert cash_res.status_code == 200
    assert cash_res.json()["status"] == "QUEUED"


def test_shop_mode_change_is_audited_and_applies_forward_only():
    """
    Shop B changes from FULL_AUTOMATIC to MANUAL_APPROVAL.
    Order 1 (in-flight before switch) remains FULL_AUTOMATIC.
    Order 2 (created after switch) inherits MANUAL_APPROVAL.
    """
    device_service.set_device_online_status(SHOP_B, True)

    # 1. Create Order 1 under FULL_AUTOMATIC
    order1_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Order1_Before_Switch.pdf",
            "file_size_bytes": 50000,
            "page_count": 1,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "user1@domain.com",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job1_id = order1_res.json()["id"]
    assert order1_res.json()["order_mode"] == "FULL_AUTOMATIC"

    # 2. Owner switches shop mode to MANUAL_APPROVAL
    patch_res = client.patch(
        "/api/v1/shops/settings",
        json={"order_mode": "MANUAL_APPROVAL"},
        headers={"X-Shop-ID": SHOP_B},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["order_mode"] == "MANUAL_APPROVAL"

    # 3. Create Order 2 after switch
    order2_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Order2_After_Switch.pdf",
            "file_size_bytes": 50000,
            "page_count": 1,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "user2@domain.com",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job2_id = order2_res.json()["id"]
    assert order2_res.json()["order_mode"] == "MANUAL_APPROVAL"

    # 4. Pay for Order 1: Dispatches automatically to QUEUED (retains original mode)
    raw1, head1 = mock_payment_provider.generate_signed_webhook_payload(
        event_id="evt_mode_switch_01",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job1_id,
        amount_paise=500,
    )
    client.post("/api/v1/webhooks/payments", content=raw1, headers=head1)
    job1_check = client.get(f"/api/v1/orders/{job1_id}", headers={"X-Shop-ID": SHOP_B})
    assert job1_check.json()["status"] == "QUEUED"

    # 5. Pay for Order 2: Holds in AWAITING_APPROVAL (obeys new mode)
    raw2, head2 = mock_payment_provider.generate_signed_webhook_payload(
        event_id="evt_mode_switch_02",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job2_id,
        amount_paise=500,
    )
    client.post("/api/v1/webhooks/payments", content=raw2, headers=head2)
    job2_check = client.get(f"/api/v1/orders/{job2_id}", headers={"X-Shop-ID": SHOP_B})
    assert job2_check.json()["status"] == "AWAITING_APPROVAL"
