"""
Fake Open-Source Billing Adapter, Tracing Request IDs, and Dashboard Tests.
"""

import pytest
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.services.billing_adapter import fake_billing_adapter
from services.api.services.subscription_service import subscription_service
from services.api.services.auth_service import auth_service, compute_totp_code
from packages.contracts.models import SubscriptionStatus

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"


@pytest.fixture(autouse=True)
def clean_services():
    fake_billing_adapter.clear()
    subscription_service.clear()
    auth_service.clear()


def test_tracing_request_id_injected_on_all_responses():
    # 1. Custom request ID propagated
    custom_id = "trace-test-12345"
    res1 = client.get("/api/v1/health", headers={"X-Request-ID": custom_id})
    assert res1.status_code == 200
    assert res1.headers.get("X-Request-ID") == custom_id

    # 2. Generated request ID present when omitted
    res2 = client.get("/api/v1/health")
    assert res2.status_code == 200
    assert res2.headers.get("X-Request-ID") is not None
    assert res2.headers.get("X-Request-ID").startswith("req_")

    # 3. Security headers present
    assert res2.headers.get("X-Content-Type-Options") == "nosniff"
    assert res2.headers.get("X-Frame-Options") == "DENY"


def test_fake_billing_adapter_simulation_lifecycle():
    assert fake_billing_adapter.pending_production_integration == "PENDING_PRODUCTION_GATEWAY_CERTIFICATION"

    # 1. Simulate recurring payment renewal success
    res_paid = client.post(
        "/api/v1/subscriptions/simulate-webhook",
        json={"shop_id": SHOP_A, "event_type": "renewal_success"}
    )
    assert res_paid.status_code == 200
    assert res_paid.json()["result"]["status"] == "paid"
    assert res_paid.json()["gateway_status"] == "PENDING_PRODUCTION_GATEWAY_CERTIFICATION"

    # 2. Simulate recurring payment failure
    res_fail = client.post(
        "/api/v1/subscriptions/simulate-webhook",
        json={"shop_id": SHOP_A, "event_type": "payment_failure"}
    )
    assert res_fail.status_code == 200
    sub = subscription_service.get_subscription(SHOP_A)
    assert sub.status == SubscriptionStatus.PAST_DUE
    assert sub.grace_period_end is not None

    # 3. Simulate grace period expired -> SUSPENDED
    res_grace = client.post(
        "/api/v1/subscriptions/simulate-webhook",
        json={"shop_id": SHOP_A, "event_type": "grace_expired"}
    )
    assert res_grace.status_code == 200
    assert sub.status == SubscriptionStatus.SUSPENDED


def test_shop_and_superadmin_dashboards():
    # 1. Shop Owner Dashboard
    shop_dash = client.get("/api/v1/shops/dashboard", headers={"X-Shop-ID": SHOP_A})
    assert shop_dash.status_code == 200
    dash_data = shop_dash.json()
    assert dash_data["shop_id"] == SHOP_A
    assert dash_data["subscription"]["plan"] == "ALL_INCLUSIVE"

    # 2. Superadmin Dashboard (requires superadmin login)
    user = auth_service._users["superadmin@printbot.in"]
    totp = compute_totp_code(user.mfa_secret)
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "superadmin@printbot.in", "password": "SuperAdminSecurePassword2026!", "totp_code": totp}
    ).json()
    admin_token = admin_login["session_token"]

    super_dash = client.get(
        "/api/v1/superadmin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert super_dash.status_code == 200
    s_data = super_dash.json()
    assert s_data["single_plan"]["plan_id"] == "ALL_INCLUSIVE"
    assert s_data["single_plan"]["printers_entitlement"] == "UNLIMITED"
