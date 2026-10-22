"""
Subscription Service for Print Bot Phase 1.
Implements the single all-inclusive subscription plan, honest usage safety quotas,
lifecycle state machine (trial, active, past_due, grace, suspended, canceled),
clock skew tolerance, safe handling of existing paid jobs during suspension,
and audited administrative overrides.
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from fastapi import HTTPException, status
from packages.contracts.models import (
    SubscriptionDetails,
    SubscriptionStatus,
    BillingInterval,
    PlanFeatures,
    SafetyQuotas,
    JobStatus,
)
from services.api.services.audit_service import audit_service

CLOCK_SKEW_TOLERANCE_SECONDS = 300  # 5 minutes clock skew protection
GRACE_PERIOD_DAYS = 7


class SubscriptionService:
    def __init__(self):
        # Maps shop_id -> SubscriptionDetails
        self._subscriptions: Dict[str, SubscriptionDetails] = {}
        self._init_defaults()

    def _init_defaults(self):
        # Seed default subscriptions for adversarial shops A and B
        now = datetime.utcnow()
        self.set_subscription(
            shop_id="11111111-1111-1111-1111-111111111111",
            details=SubscriptionDetails(
                id=str(uuid.uuid4()),
                shop_id="11111111-1111-1111-1111-111111111111",
                plan_id="ALL_INCLUSIVE",
                billing_interval=BillingInterval.MONTHLY,
                status=SubscriptionStatus.ACTIVE,
                current_period_start=now - timedelta(days=5),
                current_period_end=now + timedelta(days=25),
                features=PlanFeatures(),
                quota_limits=SafetyQuotas(),
            )
        )
        self.set_subscription(
            shop_id="22222222-2222-2222-2222-222222222222",
            details=SubscriptionDetails(
                id=str(uuid.uuid4()),
                shop_id="22222222-2222-2222-2222-222222222222",
                plan_id="ALL_INCLUSIVE",
                billing_interval=BillingInterval.ANNUAL,
                status=SubscriptionStatus.ACTIVE,
                current_period_start=now - timedelta(days=10),
                current_period_end=now + timedelta(days=355),
                features=PlanFeatures(),
                quota_limits=SafetyQuotas(),
            )
        )

    def set_subscription(self, shop_id: str, details: SubscriptionDetails):
        self._subscriptions[shop_id] = details

    def get_subscription(self, shop_id: str) -> SubscriptionDetails:
        sub = self._subscriptions.get(shop_id)
        if not sub:
            # Default to active trial for newly created shops
            now = datetime.utcnow()
            sub = SubscriptionDetails(
                id=str(uuid.uuid4()),
                shop_id=shop_id,
                plan_id="ALL_INCLUSIVE",
                billing_interval=BillingInterval.MONTHLY,
                status=SubscriptionStatus.TRIAL,
                current_period_start=now,
                current_period_end=now + timedelta(days=14),
                trial_end=now + timedelta(days=14),
                features=PlanFeatures(),
                quota_limits=SafetyQuotas(),
            )
            self._subscriptions[shop_id] = sub
        return sub

    def check_operational_status(self, shop_id: str, now: Optional[datetime] = None) -> SubscriptionStatus:
        """
        Calculates effective subscription status considering clock skew tolerance,
        trial expiry, grace period, and administrative override.
        """
        sub = self.get_subscription(shop_id)
        current_time = now or datetime.utcnow()

        if sub.admin_override:
            return SubscriptionStatus.ACTIVE

        # Apply clock skew tolerance
        tolerance = timedelta(seconds=CLOCK_SKEW_TOLERANCE_SECONDS)

        if sub.status == SubscriptionStatus.CANCELED:
            return SubscriptionStatus.CANCELED

        if sub.status == SubscriptionStatus.SUSPENDED:
            return SubscriptionStatus.SUSPENDED

        if sub.status == SubscriptionStatus.TRIAL:
            if sub.trial_end and (current_time - tolerance) > sub.trial_end:
                sub.status = SubscriptionStatus.SUSPENDED
            return sub.status

        # Active or Past Due
        if sub.current_period_end and (current_time - tolerance) > sub.current_period_end:
            # Exceeded period end - check grace period
            if not sub.grace_period_end:
                sub.grace_period_end = sub.current_period_end + timedelta(days=GRACE_PERIOD_DAYS)

            if (current_time - tolerance) > sub.grace_period_end:
                sub.status = SubscriptionStatus.SUSPENDED
            else:
                sub.status = SubscriptionStatus.GRACE

        return sub.status

    def can_submit_order(self, shop_id: str) -> Tuple[bool, Optional[str]]:
        """
        Determines if a shop can accept new incoming orders from customer web.
        Suspended or canceled shops cannot accept new submissions.
        """
        effective_status = self.check_operational_status(shop_id)
        if effective_status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.GRACE):
            return True, None
        return False, f"Shop subscription is currently {effective_status.value}. New orders are temporarily suspended."

    def can_dispatch_job(self, shop_id: str, current_job_status: JobStatus) -> Tuple[bool, Optional[str]]:
        """
        Safe handling of already-paid jobs during suspension:
        Existing paid, queued, or spooling jobs MUST be safely delivered even if shop is suspended.
        New or unpaid jobs are rejected if suspended.
        """
        effective_status = self.check_operational_status(shop_id)
        if effective_status in (SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.GRACE):
            return True, None

        # If suspended, allow already-paid/queued jobs to complete safely
        if current_job_status in (JobStatus.PAID, JobStatus.QUEUED, JobStatus.SPOOLING, JobStatus.PRINTING):
            return True, None

        return False, f"Shop subscription is {effective_status.value}. Unpaid jobs cannot be dispatched."

    def apply_admin_override(
        self,
        shop_id: str,
        reason: str,
        actor_id: str = "superadmin",
        actor_type: str = "SUPERADMIN"
    ) -> SubscriptionDetails:
        if not reason or len(reason.strip()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrative override requires a valid descriptive reason (minimum 5 characters)."
            )
        sub = self.get_subscription(shop_id)
        sub.admin_override = True
        sub.admin_override_reason = reason.strip()

        audit_service.record_event(
            actor_type=actor_type,
            actor_id=actor_id,
            action="ADMIN_OVERRIDE_SUBSCRIPTION",
            resource_type="subscription",
            resource_id=sub.id,
            shop_id=shop_id,
            metadata={"reason": reason, "previous_status": sub.status.value}
        )
        return sub

    def revoke_admin_override(
        self,
        shop_id: str,
        actor_id: str = "superadmin"
    ) -> SubscriptionDetails:
        sub = self.get_subscription(shop_id)
        sub.admin_override = False
        sub.admin_override_reason = None

        audit_service.record_event(
            actor_type="SUPERADMIN",
            actor_id=actor_id,
            action="REVOKE_ADMIN_OVERRIDE",
            resource_type="subscription",
            resource_id=sub.id,
            shop_id=shop_id
        )
        return sub

    def clear(self):
        self._subscriptions.clear()
        self._init_defaults()


subscription_service = SubscriptionService()
