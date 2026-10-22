"""
Windows Device Cryptographic Enrollment Protocol Tests.
"""

import hashlib
import pytest
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.services.device_service import device_service
from services.api.services.job_service import job_service
from services.api.services.subscription_service import subscription_service
from services.api.services.audit_service import audit_service
from packages.contracts.models import (
    PrintJobCreateRequest,
    PrintOptions,
    JobStatus,
    SubscriptionStatus,
)

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"


@pytest.fixture(autouse=True)
def clean_services():
    device_service.clear()
    job_service.clear()
    subscription_service.clear()
    audit_service.clear()


def test_full_device_enrollment_protocol_handshake():
    # 1. Shop staff creates a pairing code in portal
    code_res = client.post(
        "/api/v1/devices/pairing-codes",
        headers={"X-Shop-ID": SHOP_A}
    )
    assert code_res.status_code == 200
    pairing_code = code_res.json()["code"]
    assert len(pairing_code) == 6
    assert code_res.json()["ttl_seconds"] == 600

    # 2. Device presents pairing code, identifier, and public key
    mock_pubkey = "ED25519_PUB_KEY_MOCK_VAL_771"
    pair_res = client.post(
        "/api/v1/devices/pair",
        json={
            "pairing_code": pairing_code,
            "device_identifier": "ws-counter-anna-main",
            "device_name": "Main Desk Windows PC",
            "public_key_pem": mock_pubkey,
            "os_info": "Windows 11 Pro"
        }
    )
    assert pair_res.status_code == 200
    device_id = pair_res.json()["device_id"]
    challenge_nonce = pair_res.json()["challenge_nonce"]
    assert len(challenge_nonce) == 64

    # 3. Pairing code cannot be reused (single-use protection)
    reuse_res = client.post(
        "/api/v1/devices/pair",
        json={
            "pairing_code": pairing_code,
            "device_identifier": "ws-rogue-2",
            "device_name": "Second PC",
            "public_key_pem": "ANOTHER_KEY",
            "os_info": "Windows 10"
        }
    )
    assert reuse_res.status_code == 400
    assert "already used" in reuse_res.json()["detail"]

    # 4. Device computes signature over challenge nonce
    signature = hashlib.sha256(f"{challenge_nonce}:{mock_pubkey}".encode("utf-8")).hexdigest()

    # 5. Device submits challenge proof and receives rotating device token
    token_res = client.post(
        "/api/v1/devices/challenge-response",
        json={
            "device_id": device_id,
            "challenge_nonce": challenge_nonce,
            "signature": signature
        }
    )
    assert token_res.status_code == 200
    device_token = token_res.json()["access_token"]
    assert device_token.startswith("devtok_")

    # 6. Device sends periodic heartbeat
    hb_res = client.post(
        "/api/v1/devices/heartbeat",
        json={
            "device_id": device_id,
            "agent_version": "1.0.0",
            "status": "ONLINE",
            "metrics": {"cpu_pct": 12.5, "spooler_ok": True}
        },
        headers={"Authorization": f"Bearer {device_token}"}
    )
    assert hb_res.status_code == 200
    assert hb_res.json()["acknowledged"] is True

    # 7. Device polls for jobs
    # Create and queue a job first
    job = job_service.create_job(
        SHOP_A,
        PrintJobCreateRequest(
            file_name="Thesis_Final.pdf",
            file_size_bytes=2000000,
            page_count=50,
            options=PrintOptions(),
            customer_email="student@annauniv.edu"
        )
    )
    job_service.mark_paid(SHOP_A, job.id, "pi_mock_thesis")

    poll_res = client.get(
        "/api/v1/devices/jobs/next",
        headers={"Authorization": f"Bearer {device_token}"}
    )
    assert poll_res.status_code == 200
    assert poll_res.json()["has_job"] is True
    assert poll_res.json()["job"]["id"] == job.id

    # 8. Device Revocation: Shop owner revokes this device
    revoke_res = client.post(
        f"/api/v1/devices/{device_id}/revoke",
        json={"reason": "PC sent for counter hardware servicing"},
        headers={"X-Shop-ID": SHOP_A}
    )
    assert revoke_res.status_code == 200
    assert revoke_res.json()["status"] == "revoked"

    # 9. Revoked device token CANNOT fetch any future jobs
    revoked_poll = client.get(
        "/api/v1/devices/jobs/next",
        headers={"Authorization": f"Bearer {device_token}"}
    )
    assert revoked_poll.status_code in (401, 403)
    assert "revoked" in revoked_poll.json()["detail"].lower()
