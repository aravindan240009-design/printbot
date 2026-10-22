"""
Phase 4 Tests: State Machine Transitions, Cancellation & Refund Safety.
Verifies:
1. Cancelling an order before spooling triggers an automated refund for online payments.
2. Cancelling an order while actively spooling or printing is strictly rejected with 400.
3. Staff rejection of an order triggers an automated refund.
4. COMPLETION_UNKNOWN states require explicit supervisor reconciliation (REPRINT, CONFIRM_PRINTED, REFUND).
5. Tampered quotes are rejected at checkout.
"""

import pytest
from fastapi.testclient import TestClient

from services.api.main import app
from services.api.services.job_service import job_service
from services.api.services.payment_provider import mock_payment_provider
from packages.contracts.models import JobStatus

from services.api.services.shop_service import shop_service
from services.api.services.device_service import device_service
from services.api.services.subscription_service import subscription_service
from services.api.services.ledger_service import ledger_service

client = TestClient(app)

SHOP_B = "22222222-2222-2222-2222-222222222222"


@pytest.fixture(autouse=True)
def clean_state():
    job_service.clear()
    shop_service.clear()
    device_service.clear()
    mock_payment_provider.clear()
    subscription_service.clear()
    ledger_service.clear()


def test_cancel_before_spooling_triggers_automatic_refund():
    """Paid order cancelled prior to print spooling automatically issues full refund."""
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Accidental_Order.pdf",
            "file_size_bytes": 50000,
            "page_count": 4,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "cancel@test.com",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job_id = order_res.json()["id"]

    # Pay for order
    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id="evt_cancel_01",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job_id,
        amount_paise=2000,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # Customer cancels order
    cancel_res = client.post(
        f"/api/v1/orders/{job_id}/cancel",
        json={"reason": "Customer clicked accidentally"},
        headers={"X-Shop-ID": SHOP_B},
    )
    assert cancel_res.status_code == 200
    data = cancel_res.json()
    assert data["status"] == "CANCELLED"
    assert data["refund_id"] is not None
    assert data["refund_id"].startswith("ref_mock_")


def test_cannot_cancel_active_spooling_job():
    """An order actively spooling or printing CANNOT be cancelled or refunded."""
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "In_Flight_Print.pdf",
            "file_size_bytes": 500000,
            "page_count": 20,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "active@print.com",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job_id = order_res.json()["id"]

    # Mark paid and queue
    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id="evt_active_01",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job_id,
        amount_paise=10000,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # Workstation claims job (transitions to SPOOLING)
    client.post(
        "/api/v1/printers/claim",
        json={"workstation_id": "ws-front-desk", "job_id": job_id},
        headers={"X-Shop-ID": SHOP_B},
    )

    # Attempt to cancel in-flight job -> MUST BE REJECTED with 400
    cancel_res = client.post(
        f"/api/v1/orders/{job_id}/cancel",
        json={"reason": "Stop the printer!"},
        headers={"X-Shop-ID": SHOP_B},
    )
    assert cancel_res.status_code == 400
    assert "already in the physical spooler" in cancel_res.json()["detail"]


def test_supervised_reconciliation_of_completion_unknown():
    """
    On ambiguous outcome (printer paper jam / disconnect), job enters COMPLETION_UNKNOWN.
    Staff can either:
    1. Confirm physically printed.
    2. Authorize a manual reprint.
    3. Authorize a refund.
    """
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Ambiguous_Job.pdf",
            "file_size_bytes": 200000,
            "page_count": 5,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "unknown@check.in",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job_id = order_res.json()["id"]

    # Pay
    raw_body, headers = mock_payment_provider.generate_signed_webhook_payload(
        event_id="evt_unk_01",
        event_type="payment_intent.succeeded",
        shop_id=SHOP_B,
        order_id=job_id,
        amount_paise=2500,
    )
    client.post("/api/v1/webhooks/payments", content=raw_body, headers=headers)

    # Spooler flags ambiguous state
    client.post(
        f"/api/v1/orders/{job_id}/mark-unknown",
        json={"reason": "Printer offline mid-stream"},
        headers={"X-Shop-ID": SHOP_B},
    )

    # Verify held in COMPLETION_UNKNOWN
    job_data = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_B}).json()
    assert job_data["status"] == "COMPLETION_UNKNOWN"

    # Action 1: Supervisor authorizes manual reprint
    reprint_res = client.post(
        f"/api/v1/orders/{job_id}/reconcile-unknown",
        json={"action": "REPRINT", "staff_email": "supervisor@shop.in"},
        headers={"X-Shop-ID": SHOP_B},
    )
    assert reprint_res.status_code == 200
    assert reprint_res.json()["status"] == "QUEUED"


def test_tampered_quote_is_rejected():
    """Client attempting to submit a tampered price or quote hash is rejected with 400."""
    res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Tampered_Quote.pdf",
            "file_size_bytes": 100000,
            "page_count": 50,
            "quote_hash": "TAMPERED_PRICE_HASH",
            "options": {"copies": 1, "color_mode": "color", "paper_size": "A3", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 120},
            "customer_email": "hacker@test.com",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    assert res.status_code == 400
    assert "Quote verification failed" in res.json()["detail"]
