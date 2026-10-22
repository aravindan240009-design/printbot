"""
Staff & Superadmin Authentication, MFA, RBAC, and Impersonation Tests.
"""

import pytest
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.services.auth_service import (
    auth_service,
    hash_password,
    verify_password,
    generate_totp_secret,
    compute_totp_code,
    verify_totp,
)
from services.api.services.asset_service import asset_service
from services.api.services.audit_service import audit_service
from packages.contracts.models import AssetUploadIntentRequest

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"


@pytest.fixture(autouse=True)
def clean_services():
    auth_service.clear()
    asset_service.clear()
    audit_service.clear()


def test_password_hashing_and_constant_time_verification():
    raw_pass = "SecureSecretPassword123!"
    hashed = hash_password(raw_pass)

    assert hashed.startswith("pbkdf2_sha256$600000$")
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


def test_rfc6238_totp_mfa_generation_and_verification():
    secret = generate_totp_secret()
    valid_code = compute_totp_code(secret)

    assert len(valid_code) == 6
    assert valid_code.isdigit()
    assert verify_totp(secret, valid_code) is True
    assert verify_totp(secret, "000000") is False


def test_superadmin_login_requires_mfa():
    # 1. Attempt login without MFA code -> Expect 403 Forbidden
    res_no_mfa = client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@printbot.in", "password": "SuperAdminSecurePassword2026!"}
    )
    assert res_no_mfa.status_code == 403
    assert "MFA_REQUIRED" in res_no_mfa.json()["detail"]

    # 2. Login with valid TOTP code
    user = auth_service._users["superadmin@printbot.in"]
    totp_code = compute_totp_code(user.mfa_secret)

    res_mfa = client.post(
        "/api/v1/auth/login",
        json={
            "email": "superadmin@printbot.in",
            "password": "SuperAdminSecurePassword2026!",
            "totp_code": totp_code
        }
    )
    assert res_mfa.status_code == 200
    assert res_mfa.json()["status"] == "success"
    assert res_mfa.json()["user"]["is_superadmin"] is True


def test_support_impersonation_blocks_document_download():
    # 1. Login superadmin with MFA
    user = auth_service._users["superadmin@printbot.in"]
    totp_code = compute_totp_code(user.mfa_secret)
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@printbot.in", "password": "SuperAdminSecurePassword2026!", "totp_code": totp_code}
    ).json()
    admin_token = admin_login["session_token"]

    # 2. Shop A has uploaded an asset
    intent = asset_service.create_upload_intent(
        SHOP_A,
        AssetUploadIntentRequest(
            file_name="Confidential_Legal_Agreement.pdf",
            file_size_bytes=400000,
            mime_type="application/pdf",
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        )
    )
    asset_id = intent.asset_id

    # 3. Superadmin initiates support impersonation for Shop A
    imp_res = client.post(
        "/api/v1/auth/impersonate",
        json={
            "target_shop_id": SHOP_A,
            "reason": "Customer ticket #88412: troubleshooting print queue dispatch delay",
            "duration_minutes": 15
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert imp_res.status_code == 200
    imp_token = imp_res.json()["impersonation_token"]
    assert imp_res.json()["can_access_documents"] is False

    # 4. Impersonator attempts to download customer document WITHOUT explicit consent -> Expect 403 Forbidden
    doc_res = client.get(
        f"/api/v1/assets/{asset_id}/download",
        headers={
            "Authorization": f"Bearer {imp_token}",
            "X-Shop-ID": SHOP_A
        }
    )
    assert doc_res.status_code == 403
    assert "Support impersonation cannot download customer documents" in doc_res.json()["detail"]

    # 5. Impersonator WITH explicit consent flag can download
    doc_with_consent = client.get(
        f"/api/v1/assets/{asset_id}/download?explicit_tenant_consent=true",
        headers={
            "Authorization": f"Bearer {imp_token}",
            "X-Shop-ID": SHOP_A
        }
    )
    assert doc_with_consent.status_code == 200
    assert "download_url" in doc_with_consent.json()
