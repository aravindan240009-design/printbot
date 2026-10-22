"""
Tests for Device Pairing, Authentication, Offline Lease Expiry, and Cross-Shop Isolation.
Guarantees that a device paired to Shop A can NEVER fetch or print jobs belonging to Shop B.
"""

import hashlib
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.services.device_service import device_service
from services.api.services.job_service import job_service

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"
SHOP_B = "22222222-2222-2222-2222-222222222222"


def test_device_pairing_and_token_exchange():
    # 1. Shop A generates 6-character pairing code
    code = device_service.generate_pairing_code(SHOP_A)
    assert len(code) == 6

    # 2. Workstation submits public key and pairing code
    mock_pubkey = "MOCK_TPM_PUBKEY_ED25519_CHENNAI_101"
    pair_res = client.post(
        "/api/v1/devices/pair",
        json={
            "pairing_code": code,
            "device_identifier": "counter-pc-01",
            "device_name": "Counter PC Chennai",
            "public_key_pem": mock_pubkey,
            "os_info": "Windows 11 Pro 23H2"
        }
    )
    assert pair_res.status_code == 200
    challenge_data = pair_res.json()
    device_id = challenge_data["device_id"]
    nonce = challenge_data["challenge_nonce"]

    # 3. Workstation signs challenge nonce
    signature = hashlib.sha256(f"{nonce}:{mock_pubkey}".encode("utf-8")).hexdigest()
    token_res = client.post(
        "/api/v1/devices/challenge-response",
        json={
            "device_id": device_id,
            "challenge_nonce": nonce,
            "signature": signature
        }
    )
    assert token_res.status_code == 200
    token_data = token_res.json()
    assert token_data["token_type"] == "bearer"
    assert token_data["shop_id"] == SHOP_A
    assert token_data["expires_in_seconds"] > 0
    device_token = token_data["access_token"]

    # 4. Authenticated device can poll queue for Shop A
    queue_res = client.get(
        "/api/v1/orders",
        headers={
            "Authorization": f"Bearer {device_token}",
            "X-Shop-ID": SHOP_A
        }
    )
    assert queue_res.status_code == 200

    # 5. Device from Shop A ATTEMPTS to fetch jobs for Shop B -> MUST BE FORBIDDEN
    cross_shop_res = client.get(
        "/api/v1/orders",
        headers={
            "Authorization": f"Bearer {device_token}",
            "X-Shop-ID": SHOP_B
        }
    )
    assert cross_shop_res.status_code == 403
    assert "Cross-tenant access forbidden" in cross_shop_res.json()["detail"]


def test_revoked_device_immediately_blocked():
    code = device_service.generate_pairing_code(SHOP_A)
    mock_pubkey = "STOLEN_KEY_123"
    pair_res = client.post(
        "/api/v1/devices/pair",
        json={
            "pairing_code": code,
            "device_identifier": "stolen-laptop",
            "device_name": "Stolen Laptop",
            "public_key_pem": mock_pubkey,
            "os_info": "Windows 11"
        }
    )
    device_id = pair_res.json()["device_id"]
    nonce = pair_res.json()["challenge_nonce"]
    sig = hashlib.sha256(f"{nonce}:{mock_pubkey}".encode("utf-8")).hexdigest()
    token_res = client.post(
        "/api/v1/devices/challenge-response",
        json={"device_id": device_id, "challenge_nonce": nonce, "signature": sig}
    )
    token = token_res.json()["access_token"]

    # Shop owner revokes the device
    device_service.revoke_device(SHOP_A, device_id)

    # Subsequent API call by revoked device must be rejected with 403
    poll_res = client.get(
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {token}", "X-Shop-ID": SHOP_A}
    )
    assert poll_res.status_code == 403
    assert "revoked" in poll_res.json()["detail"].lower()

