import time
import json
import hmac
import hashlib
import pytest
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.core.config import settings
from services.api.core.idempotency import idempotency_store
from services.api.services.job_service import job_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_state():
    job_service.clear()
    idempotency_store.clear()


def make_signature(raw_body: bytes, timestamp: int, secret: str = settings.WEBHOOK_SIGNING_SECRET) -> str:
    payload_to_sign = f"{timestamp}.".encode("utf-8") + raw_body
    return hmac.new(secret.encode("utf-8"), payload_to_sign, hashlib.sha256).hexdigest()


def test_payment_webhook_idempotency_and_replay_protection():
    tenant_id = "tenant-downtown"

    # 1. Create a pending order first
    create_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Course_Packet.pdf",
            "file_size_bytes": 500000,
            "page_count": 20,
            "options": {
                "copies": 1,
                "color_mode": "bw",
                "paper_size": "A4",
                "duplex_mode": "simplex",
                "orientation": "portrait",
                "binding": "none",
                "paper_gsm": 75
            },
            "customer_email": "student@university.edu"
        },
        headers={"X-Tenant-ID": tenant_id}
    )
    assert create_res.status_code == 201
    job_id = create_res.json()["id"]

    # 2. Build signed payment webhook payload
    timestamp = int(time.time())
    webhook_payload = {
        "event_id": "evt_test_payment_success_99812",
        "event_type": "payment_intent.succeeded",
        "tenant_id": tenant_id,
        "payment_intent_id": f"pi_mock_{job_id}",
        "amount_cents": 100,
        "currency": "USD",
        "timestamp": timestamp
    }
    raw_body = json.dumps(webhook_payload, sort_keys=True).encode("utf-8")
    valid_signature = make_signature(raw_body, timestamp)

    # 3. First delivery: Success -> job marks PAID and QUEUED
    res1 = client.post(
        "/api/v1/webhooks/payments",
        content=raw_body,
        headers={
            "Content-Type": "application/json",
            "X-Signature": valid_signature,
            "X-Timestamp": str(timestamp)
        }
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "success"
    assert res1.json()["new_status"] == "QUEUED"

    # Verify job status in API
    job_status = client.get(f"/api/v1/orders/{job_id}", headers={"X-Tenant-ID": tenant_id})
    assert job_status.json()["status"] == "QUEUED"

    # 4. Immediate Replay (exact same event_id): must return cached response without duplicate execution
    res2 = client.post(
        "/api/v1/webhooks/payments",
        content=raw_body,
        headers={
            "Content-Type": "application/json",
            "X-Signature": valid_signature,
            "X-Timestamp": str(timestamp)
        }
    )
    assert res2.status_code == 200
    assert res2.json() == res1.json()

    # 5. Replay attack prevention: Expired timestamp (> 300s old)
    old_timestamp = timestamp - 305
    old_signature = make_signature(raw_body, old_timestamp)
    res_expired = client.post(
        "/api/v1/webhooks/payments",
        content=raw_body,
        headers={
            "Content-Type": "application/json",
            "X-Signature": old_signature,
            "X-Timestamp": str(old_timestamp)
        }
    )
    assert res_expired.status_code == 400
    assert "replay attack prevention" in res_expired.json()["detail"]

    # 6. Tampered signature verification: Fake signature must be rejected (401)
    res_fake = client.post(
        "/api/v1/webhooks/payments",
        content=raw_body,
        headers={
            "Content-Type": "application/json",
            "X-Signature": "fake_invalid_hex_signature_9999",
            "X-Timestamp": str(timestamp)
        }
    )
    assert res_fake.status_code == 401
    assert "signature verification failed" in res_fake.json()["detail"]
