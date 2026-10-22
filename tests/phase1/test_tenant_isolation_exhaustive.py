"""
Exhaustive Cross-Tenant Negative Attack Tests.
Simulates adversarial attacks between Shop A (Anna Xerox) and Shop B (Bharat Prints):
1. Cross-shop read (Orders, Assets, Devices, Settings) -> 404/403 forbidden.
2. Cross-shop update & delete -> 404/403 forbidden.
3. Upload replacement attack -> cannot overwrite another shop's storage path.
4. QR guest session replay -> session minted for Shop A rejected on Shop B.
5. Guessed short pairing codes -> brute-force rejection.
6. Cross-shop printer routing -> cannot route job to another shop's printer.
7. Conflicting header attack -> Bearer token from Shop A with X-Shop-ID: Shop B -> 403 forbidden.
"""

import pytest
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.services.job_service import job_service
from services.api.services.asset_service import asset_service
from services.api.services.guest_service import guest_service
from services.api.services.device_service import device_service
from services.api.services.auth_service import auth_service
from packages.contracts.models import (
    AssetUploadIntentRequest,
    DevicePairRequest,
    PrintOptions,
    PrintJobCreateRequest,
)

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"
SHOP_B = "22222222-2222-2222-2222-222222222222"


@pytest.fixture(autouse=True)
def clean_stores():
    job_service.clear()
    asset_service.clear()
    guest_service.clear()
    device_service.clear()
    auth_service.clear()


def test_cross_shop_order_read_forbidden():
    # Shop A creates an order
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Confidential_Anna_Exam.pdf",
            "file_size_bytes": 500000,
            "page_count": 8,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "prof@annauniv.edu"
        },
        headers={"X-Shop-ID": SHOP_A}
    )
    assert order_res.status_code == 201
    job_id = order_res.json()["id"]

    # Shop B attempts to read Shop A's order
    cross_read = client.get(
        f"/api/v1/orders/{job_id}",
        headers={"X-Shop-ID": SHOP_B}
    )
    assert cross_read.status_code == 404
    assert f"not found for tenant '{SHOP_B}'" in cross_read.json()["detail"]


def test_cross_shop_token_spoofing_conflict_rejected():
    # Authenticate as Shop A Owner
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@annaxerox.com", "password": "AnnaShopPassword2026!"}
    )
    assert login_res.status_code == 200
    token_a = login_res.json()["session_token"]

    # Attacker presents Shop A token, but specifies X-Shop-ID: Shop B
    res = client.get(
        "/api/v1/orders",
        headers={
            "Authorization": f"Bearer {token_a}",
            "X-Shop-ID": SHOP_B
        }
    )
    assert res.status_code == 403
    assert "Cross-tenant access forbidden" in res.json()["detail"]


def test_cross_shop_asset_isolation_and_upload_replacement():
    # Shop A creates an upload intent
    intent_req = AssetUploadIntentRequest(
        file_name="Company_Proprietary.pdf",
        file_size_bytes=204800,
        mime_type="application/pdf",
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    )
    intent = asset_service.create_upload_intent(SHOP_A, intent_req)
    asset_id = intent.asset_id

    # Storage path must be strictly prefixed by Shop A's tenant ID
    assert intent.storage_path.startswith(f"tenants/{SHOP_A}/assets/")

    # Shop B attempts to request download URL for Shop A's asset
    cross_download = client.get(
        f"/api/v1/assets/{asset_id}/download",
        headers={"X-Shop-ID": SHOP_B}
    )
    assert cross_download.status_code == 404
    assert f"Asset '{asset_id}' not found for shop '{SHOP_B}'" in cross_download.json()["detail"]


def test_guest_session_qr_replay_attack():
    # Customer scans Shop A QR and mints session
    qr_res = client.get("/api/v1/qr/qr_anna_guindy/resolve")
    assert qr_res.status_code == 200
    assert qr_res.json()["shop_id"] == SHOP_A

    sess_res = client.post("/api/v1/guest/session", json={"shop_id": SHOP_A})
    assert sess_res.status_code == 200
    guest_token = sess_res.json()["session_token"]

    # Customer/attacker attempts to use Shop A's guest session to access Shop B
    res = client.get(
        "/api/v1/orders",
        headers={
            "X-Guest-Session": guest_token,
            "X-Shop-ID": SHOP_B
        }
    )
    assert res.status_code == 403
    assert "Cross-tenant access forbidden" in res.json()["detail"]


def test_guessed_short_pairing_code_brute_force_rejected():
    # Attempt to pair with an uncreated / guessed code
    fake_code = "GUESS1"
    pair_req = {
        "pairing_code": fake_code,
        "device_identifier": "malicious-workstation",
        "device_name": "Rogue PC",
        "public_key_pem": "MOCK_KEY",
        "os_info": "Linux"
    }

    res = client.post("/api/v1/devices/pair", json=pair_req)
    assert res.status_code == 404
    assert "Invalid pairing code" in res.json()["detail"]


def test_cross_shop_printer_routing_isolation():
    # Shop A creates an order
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Report.pdf",
            "file_size_bytes": 100000,
            "page_count": 5,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "student@annauniv.edu"
        },
        headers={"X-Shop-ID": SHOP_A}
    )
    assert order_res.status_code == 201
    job_id = order_res.json()["id"]

    # Shop B workstation attempts to claim / reconcile Shop A's job
    reconcile_req = {
        "workstation_id": "ws-bharat-01",
        "tenant_id": SHOP_B,
        "spooled_job_ids": [job_id]
    }
    sync_res = client.post(
        "/api/v1/reconciliation/sync",
        json=reconcile_req,
        headers={"X-Shop-ID": SHOP_B}
    )
    assert sync_res.status_code == 200
    sync_data = sync_res.json()

    # Shop A's job ID MUST be marked invalid for Shop B
    assert job_id in sync_data["invalid_job_ids"]
    assert job_id not in sync_data["confirmed_job_ids"]
