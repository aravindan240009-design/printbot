"""
Phase 1 Single All-Inclusive Plan & Subscription Lifecycle Tests.
"""

from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.services.subscription_service import subscription_service
from services.api.services.job_service import job_service
from services.api.services.audit_service import audit_service
from packages.contracts.models import (
    SubscriptionStatus,
    BillingInterval,
    JobStatus,
    PrintOptions,
    PrintJobCreateRequest,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_services():
    subscription_service.clear()
    job_service.clear()
    audit_service.clear()


def test_single_all_inclusive_plan_structure():
    res = client.get("/api/v1/subscriptions/plan")
    assert res.status_code == 200
    data = res.json()

    assert data["plan_id"] == "ALL_INCLUSIVE"
    assert data["printer_policy"]["printers_allowed"] == "UNLIMITED"
    assert data["printer_policy"]["per_printer_fee_paise"] == 0
    assert data["printer_policy"]["tier_based_printer_limits"] is False

    # Check pricing in Indian paise
    assert data["pricing"]["monthly_paise"] == 99900
    assert data["pricing"]["annual_paise"] == 999000

    # All feature flags true
    features = data["features"]
    assert features["unlimited_printers"] is True
    assert features["automatic_routing"] is True
    assert features["timed_xerox"] is True
    assert features["custom_branding"] is True
    assert features["multi_language"] is True
    assert features["all_paper_sizes"] is True

    # Quotas separate from printer entitlements
    quotas = data["usage_safety_quotas"]
    assert quotas["max_monthly_bandwidth_bytes"] > 0
    assert quotas["max_storage_bytes"] > 0
    assert quotas["max_daily_orders"] == 10000


def test_subscription_state_transitions_and_clock_skew():
    shop_id = "test-shop-state-1"
    sub = subscription_service.get_subscription(shop_id)

    # Initial state is TRIAL
    now = datetime.utcnow()
    assert subscription_service.check_operational_status(shop_id, now) == SubscriptionStatus.TRIAL

    # Transition to ACTIVE
    sub.status = SubscriptionStatus.ACTIVE
    sub.current_period_end = now + timedelta(days=10)
    assert subscription_service.check_operational_status(shop_id, now) == SubscriptionStatus.ACTIVE

    # Clock skew protection: if period ended 2 minutes ago (within 300s skew tolerance), still treated as active
    slightly_past = sub.current_period_end + timedelta(seconds=120)
    assert subscription_service.check_operational_status(shop_id, slightly_past) == SubscriptionStatus.ACTIVE

    # If period ended 10 minutes ago, transitions to GRACE period
    well_past = sub.current_period_end + timedelta(minutes=10)
    assert subscription_service.check_operational_status(shop_id, well_past) == SubscriptionStatus.GRACE

    # If grace period expires (8 days later), transitions to SUSPENDED
    past_grace = sub.current_period_end + timedelta(days=8)
    assert subscription_service.check_operational_status(shop_id, past_grace) == SubscriptionStatus.SUSPENDED


def test_safe_handling_of_paid_jobs_during_suspension():
    shop_id = "test-shop-suspended-1"
    sub = subscription_service.get_subscription(shop_id)

    # 1. Create and pay for a job while ACTIVE
    sub.status = SubscriptionStatus.ACTIVE
    create_req = PrintJobCreateRequest(
        file_name="Resume.pdf",
        file_size_bytes=100000,
        page_count=2,
        options=PrintOptions(),
        customer_email="jobseeker@test.com"
    )
    job = job_service.create_job(shop_id, create_req)
    paid_job = job_service.mark_paid(shop_id, job.id, "pi_test_123")
    assert paid_job.status == JobStatus.QUEUED

    # 2. Shop becomes SUSPENDED
    sub.status = SubscriptionStatus.SUSPENDED

    # 3. New order submissions MUST be rejected with 403
    with pytest.raises(Exception) as exc_info:
        job_service.create_job(shop_id, create_req)
    assert "403" in str(exc_info.value)
    assert "suspended" in str(exc_info.value).lower()

    # 4. Safe handling: Existing paid/queued job CAN still be dispatched/assigned
    claimed_job = job_service.assign_to_workstation(shop_id, paid_job.id, "ws-counter-1")
    assert claimed_job.status == JobStatus.SPOOLING


def test_administrative_override_with_audit():
    shop_id = "test-shop-override-1"
    sub = subscription_service.get_subscription(shop_id)
    sub.status = SubscriptionStatus.SUSPENDED

    # Without override, check returns SUSPENDED
    assert subscription_service.check_operational_status(shop_id) == SubscriptionStatus.SUSPENDED

    # Superadmin applies override with valid reason
    reason = "NEFT transfer verification pending with Bank of Baroda branch."
    override_sub = subscription_service.apply_admin_override(
        shop_id=shop_id,
        reason=reason,
        actor_id="admin-999"
    )
    assert override_sub.admin_override is True
    assert override_sub.admin_override_reason == reason

    # Operational status is now ACTIVE due to override
    assert subscription_service.check_operational_status(shop_id) == SubscriptionStatus.ACTIVE

    # Audit event was recorded
    events = audit_service.list_events(shop_id=shop_id, action="ADMIN_OVERRIDE_SUBSCRIPTION")
    assert len(events) == 1
    assert events[0].actor_id == "admin-999"
    assert events[0].metadata["reason"] == reason
