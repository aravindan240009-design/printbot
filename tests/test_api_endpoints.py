import os

import sys

import hmac

import hashlib

sys.path.insert(0, os.path.abspath("."))



import pytest

from fastapi.testclient import TestClient

from services.api.main import app

from services.api.core.config import settings

from services.api.services.license_service import license_service, CanonicalLicense



client = TestClient(app)



def test_health_check():

    response = client.get("/api/v1/health")

    assert response.status_code == 200

    data = response.json()

    assert data.get("status") in ("healthy", "ok")



def test_license_validation():

    # Compute test key hash

    pepper = getattr(settings, "LICENSE_PEPPER", settings.SECRET_KEY)

    test_key = "TEST-PB-KEY-1234-5678"

    test_hash = hmac.new(pepper.encode("utf-8"), test_key.encode("utf-8"), hashlib.sha256).hexdigest()

    

    # Register a known license in license_service

    license_service.register_canonical_license(CanonicalLicense(

        shop_id="test_shop_1",

        shop_name="Test Xerox Centre",

        slug="test_shop_1",

        license_key_hash=test_hash,

        is_lifetime=True,

    ))

    

    # 1. Valid key

    res = client.post("/api/v1/licenses/validate", json={

        "username": "test_shop_1",

        "license_key": "TEST-PB-KEY-1234-5678",

        "device_id": "station_01",

        "hardware_hash": "hw_hash_01",

    })

    assert res.status_code == 200

    body = res.json()

    assert body["success"] is True

    assert "device_token" in body

    assert body["shop_name"] == "Test Xerox Centre"



    # 2. Invalid key

    res_bad = client.post("/api/v1/licenses/validate", json={

        "username": "test_shop_1",

        "license_key": "WRONG-KEY",

        "device_id": "station_01",

        "hardware_hash": "hw_hash_01",

    })

    assert res_bad.status_code == 200

    body_bad = res_bad.json()

    assert body_bad["success"] is False

    assert "Invalid" in body_bad["error"]



def test_quote_calculation():

    res = client.post("/api/v1/orders/quote", headers={"X-Tenant-ID": "test_shop_1"}, json={

        "page_count": 10,

        "options": {

            "copies": 2,

            "color_mode": "bw",

            "paper_size": "A4",

            "duplex_mode": "simplex",

            "paper_gsm": 75,

            "binding": "none"

        }

    })

    assert res.status_code == 200

    data = res.json()

    assert data["total_sheets"] == 20

    assert data["rendered_sides"] == 20

    assert data["total_paise"] > 0



def test_order_creation_and_webhook():

    order_payload = {

        "customer_email": "student@annauniv.edu",

        "file_name": "Thesis_Final.pdf",

        "file_size_bytes": 1048576,

        "page_count": 5,

        "options": {

            "copies": 1,

            "color_mode": "bw",

            "paper_size": "A4",

            "duplex_mode": "simplex",

            "paper_gsm": 75,

            "binding": "none"

        }

    }

    # 1. Create order

    res = client.post(

        "/api/v1/orders",

        headers={"X-Tenant-ID": "test_shop_1", "Idempotency-Key": "order_test_key_001"},

        json=order_payload

    )

    assert res.status_code == 201

    job = res.json()

    job_id = job["id"]

    assert job["status"] == "PENDING_PAYMENT"

    assert job["file_name"] == "Thesis_Final.pdf"

    assert job["total_paise"] == 2075



    # 2. Query order

    res_get = client.get(f"/api/v1/orders/{job_id}", headers={"X-Tenant-ID": "test_shop_1"})

    assert res_get.status_code == 200

    assert res_get.json()["id"] == job_id



    # 3. Simulate payment confirmation (Razorpay / Gateway webhook execution)

    from services.api.services.job_service import job_service

    updated = job_service.mark_paid(

        tenant_id="test_shop_1",

        job_id=job_id,

        payment_intent_id="pay_rzp_mock_123456",

        amount_paise=2075

    )

    assert updated.status in ("QUEUED", "AWAITING_APPROVAL", "PAID_HELD")







# ------------------------------------------------------------------------------

# Phase 1: Critical Security Hardening Tests

# ------------------------------------------------------------------------------



def test_default_admin_password_backdoor_removed():

    """Proves that hardcoded admin@123 and ADMIN@123 backdoors are rejected."""

    # 1. admin with admin@123

    res1 = client.post("/api/v1/auth/login", json={

        "email": "admin",

        "password": "admin@123"

    })

    assert res1.status_code == 401, f"Expected 401 for admin@123, got {res1.status_code}"

    assert "Invalid email or password" in res1.json().get("detail", "")



    # 2. admin with ADMIN@123

    res2 = client.post("/api/v1/auth/login", json={

        "email": "admin",

        "password": "ADMIN@123"

    })

    assert res2.status_code == 401, f"Expected 401 for ADMIN@123, got {res2.status_code}"

    assert "Invalid email or password" in res2.json().get("detail", "")



    # 3. superadmin@printbot.in with admin@123

    res3 = client.post("/api/v1/auth/login", json={

        "email": "superadmin@printbot.in",

        "password": "admin@123"

    })

    assert res3.status_code == 401, f"Expected 401 for superadmin with backdoor password, got {res3.status_code}"





def test_admin_authentication_and_superadmin_privileges():

    """Proves server-verified administrative authentication issues a valid superadmin session."""

    res = client.post("/api/v1/auth/login", json={

        "email": "admin",

        "password": "SuperAdminSecurePassword2026!"

    })

    assert res.status_code == 200, f"Expected 200 for valid admin credentials, got {res.status_code}"

    body = res.json()

    assert body["status"] == "success"

    assert "session_token" in body

    assert body["user"]["is_superadmin"] is True

    assert body["user"]["role"] == "SUPERADMIN"



    admin_token = body["session_token"]



    # Verify access to superadmin endpoints

    kpi_res = client.get("/api/v1/superadmin/kpis", headers={"Authorization": f"Bearer {admin_token}"})

    assert kpi_res.status_code == 200

    assert "active_subscribers" in kpi_res.json()





def test_unauthenticated_superadmin_access_rejected():
    """Proves unauthenticated requests cannot access Super Admin operations."""
    # 1. KPIs endpoint without token (blocked by tenant middleware)
    res1 = client.get("/api/v1/superadmin/kpis")
    assert res1.status_code in (400, 401, 403)

    # 2. Attempt header-only bypass without authentication -> 403 Forbidden
    res2 = client.get("/api/v1/superadmin/kpis", headers={"X-Tenant-ID": "test_shop_1"})
    assert res2.status_code == 403
    assert "Superadmin privileges required" in res2.json().get("detail", "")

    # 3. Shops list with header-only bypass -> 403 Forbidden
    res3 = client.get("/api/v1/superadmin/shops", headers={"X-Tenant-ID": "test_shop_1"})
    assert res3.status_code == 403

    # 4. Applications list with header-only bypass -> 403 Forbidden
    res4 = client.get("/api/v1/superadmin/applications", headers={"X-Tenant-ID": "test_shop_1"})
    assert res4.status_code == 403

    # 5. Invalid / spoofed token -> 401 Unauthorized
    res5 = client.get("/api/v1/superadmin/kpis", headers={"Authorization": "Bearer sess_invalid_spoofed_token_12345"})
    assert res5.status_code == 401


def test_ordinary_shop_operator_cannot_access_superadmin():

    """Proves ordinary shop operators (role: OWNER/OPERATOR) are forbidden from Super Admin endpoints."""

    # 1. Log in as shop owner

    res = client.post("/api/v1/auth/login", json={

        "email": "owner@annaxerox.com",

        "password": "AnnaShopPassword2026!"

    })

    assert res.status_code == 200

    body = res.json()

    operator_token = body["session_token"]

    assert body["user"]["is_superadmin"] is False

    assert body["user"]["role"] == "OWNER"



    headers = {"Authorization": f"Bearer {operator_token}"}



    # 2. Operator attempts to access Super Admin KPIs -> 403 Forbidden

    kpis_res = client.get("/api/v1/superadmin/kpis", headers=headers)

    assert kpis_res.status_code == 403

    assert "Superadmin privileges required" in kpis_res.json().get("detail", "")



    # 3. Operator attempts to access Super Admin shops -> 403 Forbidden

    shops_res = client.get("/api/v1/superadmin/shops", headers=headers)

    assert shops_res.status_code == 403



    # 4. Operator attempts to access Super Admin applications -> 403 Forbidden

    apps_res = client.get("/api/v1/superadmin/applications", headers=headers)

    assert apps_res.status_code == 403



    # 5. Operator attempts to onboard a shop via superadmin endpoint -> 403 Forbidden

    onboard_res = client.post("/api/v1/superadmin/shops/onboard", headers=headers, json={

        "name": "Unauthorized Shop",

        "slug": "unauthorized-shop",

        "owner_email": "unauth@shop.com",

        "owner_name": "Unauth Owner"

    })

    assert onboard_res.status_code == 403



    # 6. Operator attempts to issue license via superadmin endpoint -> 403 Forbidden

    issue_res = client.post("/api/v1/superadmin/licenses/issue", headers=headers, json={

        "shop_name": "Hacked Shop",

        "username": "hacked",

        "license_key": "PB-KEY-HACK-0001"

    })

    assert issue_res.status_code == 403





def test_admin_password_change_invalidates_previous_password():

    """Proves changing the administrator password updates hash and invalidates the previous password."""

    # 1. Initial admin login with current password

    login1 = client.post("/api/v1/auth/login", json={

        "email": "admin",

        "password": "SuperAdminSecurePassword2026!"

    })

    assert login1.status_code == 200

    admin_token = login1.json()["session_token"]



    # 2. Change password via authenticated endpoint

    change_res = client.post(

        "/api/v1/auth/change-password",

        headers={"Authorization": f"Bearer {admin_token}"},

        json={

            "current_password": "SuperAdminSecurePassword2026!",

            "new_password": "NewSuperAdminPass2026!#"

        }

    )

    assert change_res.status_code == 200

    assert change_res.json()["status"] == "success"



    # 3. Old password MUST fail immediately (invalidated)

    old_login = client.post("/api/v1/auth/login", json={

        "email": "admin",

        "password": "SuperAdminSecurePassword2026!"

    })

    assert old_login.status_code == 401, "Old password must be invalidated!"



    # 4. Backdoor password MUST fail

    backdoor_login = client.post("/api/v1/auth/login", json={

        "email": "admin",

        "password": "admin@123"

    })

    assert backdoor_login.status_code == 401



    # 5. New password MUST succeed

    new_login = client.post("/api/v1/auth/login", json={

        "email": "admin",

        "password": "NewSuperAdminPass2026!#"

    })

    assert new_login.status_code == 200

    new_token = new_login.json()["session_token"]

    assert new_login.json()["user"]["is_superadmin"] is True



    # 6. Restore original password for clean state

    restore_res = client.post(

        "/api/v1/auth/change-password",

        headers={"Authorization": f"Bearer {new_token}"},

        json={

            "current_password": "NewSuperAdminPass2026!#",

            "new_password": "SuperAdminSecurePassword2026!"

        }

    )

    assert restore_res.status_code == 200





def test_privileged_application_operations_authorized():

    """Proves privileged pilot application operations are protected by Super Admin authorization."""

    # Login as admin

    login_res = client.post("/api/v1/auth/login", json={

        "email": "admin",

        "password": "SuperAdminSecurePassword2026!"

    })

    assert login_res.status_code == 200

    token = login_res.json()["session_token"]

    admin_headers = {"Authorization": f"Bearer {token}"}



    # 1. Update application plan

    plan_res = client.patch(

        "/api/v1/superadmin/applications/APP-PILOT-8492/plan",

        headers=admin_headers,

        json={"plan": "Lifetime Commercial"}

    )

    assert plan_res.status_code == 200

    assert plan_res.json()["application"]["plan"] == "Lifetime Commercial"



    # 2. Approve application

    approve_res = client.post(

        "/api/v1/superadmin/applications/APP-PILOT-8492/approve",

        headers=admin_headers,

        json={

            "generated_username": "raghavendra01",

            "generated_key": "PB-KEY-RAGH-8492",

            "plan": "Lifetime Commercial"

        }

    )

    assert approve_res.status_code == 200

    assert approve_res.json()["application"]["status"] == "APPROVED"



    # 3. Reject application

    reject_res = client.post(

        "/api/v1/superadmin/applications/APP-PILOT-5120/reject",

        headers=admin_headers

    )

    assert reject_res.status_code == 200

    assert reject_res.json()["application"]["status"] == "REJECTED"



    # 4. Issue direct license

    issue_res = client.post(

        "/api/v1/superadmin/licenses/issue",

        headers=admin_headers,

        json={

            "shop_name": "Direct Test Shop",

            "username": "directtest01",

            "license_key": "PB-KEY-TEST-1234",

            "plan": "1 Year"

        }

    )

    assert issue_res.status_code == 200

    assert issue_res.json()["license"]["status"] == "APPROVED"



    # 5. Revoke direct license

    revoke_res = client.post(

        "/api/v1/superadmin/licenses/directtest01/revoke",

        headers=admin_headers

    )

    assert revoke_res.status_code == 200



    # 6. Delete application

    del_res = client.delete(

        "/api/v1/superadmin/applications/APP-PILOT-5120",

        headers=admin_headers

    )

    assert del_res.status_code == 200

    assert del_res.json()["status"] == "deleted"





if __name__ == "__main__":

    test_health_check()

    test_license_validation()

    test_quote_calculation()

    test_order_creation_and_webhook()

    test_default_admin_password_backdoor_removed()

    test_admin_authentication_and_superadmin_privileges()

    test_unauthenticated_superadmin_access_rejected()

    test_ordinary_shop_operator_cannot_access_superadmin()

    test_admin_password_change_invalidates_previous_password()

    test_privileged_application_operations_authorized()

    print("ALL API ENDPOINT & CRITICAL SECURITY INTEGRATION TESTS PASSED (100% SUCCESS)")

    test_health_check()

    test_license_validation()

    test_quote_calculation()

    test_order_creation_and_webhook()

    print("ALL API ENDPOINT INTEGRATION TESTS PASSED (100% SUCCESS)")

