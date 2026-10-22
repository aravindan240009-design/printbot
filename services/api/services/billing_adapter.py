"""
Fake Open-Source Billing Adapter for Print Bot Phase 1.
Simulates subscription gateway webhooks, renewals, payment failures, and cancellations locally.
Production Razorpay / Stripe gateway integration is labeled as PENDING.
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from packages.contracts.models import (
    SubscriptionStatus,
    BillingInterval,
)
from services.api.services.subscription_service import (
    subscription_service,
    GRACE_PERIOD_DAYS,
)
from services.api.services.audit_service import audit_service


class BillingInvoice(dict):
    pass


class FakeBillingAdapter:
    """
    Open-Source In-Memory Billing Adapter for test automation and local development.
    Emulates subscription lifecycle webhooks without external commercial APIs.
    """
    def __init__(self):
        self.pending_production_integration = "PENDING_PRODUCTION_GATEWAY_CERTIFICATION"
        self._invoices: List[Dict[str, Any]] = []
        self._billing_events: List[Dict[str, Any]] = []

    def simulate_renewal_success(self, shop_id: str) -> Dict[str, Any]:
        """Simulates successful monthly/annual subscription payment renewal."""
        sub = subscription_service.get_subscription(shop_id)
        now = datetime.utcnow()
        days_to_add = 365 if sub.billing_interval == BillingInterval.ANNUAL else 30

        sub.status = SubscriptionStatus.ACTIVE
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=days_to_add)
        sub.grace_period_end = None

        invoice_id = f"inv_sim_{uuid.uuid4().hex[:8]}"
        amount_paise = 999_000 if sub.billing_interval == BillingInterval.ANNUAL else 99_900

        invoice = {
            "id": invoice_id,
            "shop_id": shop_id,
            "subscription_id": sub.id,
            "amount_paise": amount_paise,
            "currency": "INR",
            "status": "paid",
            "created_at": now
        }
        self._invoices.append(invoice)

        event = {
            "id": str(uuid.uuid4()),
            "shop_id": shop_id,
            "event_type": "invoice.paid",
            "payload": invoice,
            "timestamp": now.isoformat()
        }
        self._billing_events.append(event)

        audit_service.record_event(
            actor_type="SYSTEM",
            action="SUBSCRIPTION_RENEWAL_PAID",
            resource_type="subscription",
            resource_id=sub.id,
            shop_id=shop_id,
            metadata={"amount_paise": amount_paise, "invoice_id": invoice_id}
        )
        return invoice

    def simulate_payment_failure(self, shop_id: str) -> Dict[str, Any]:
        """Simulates failed recurring card/UPI charge; transitions shop to PAST_DUE and sets GRACE."""
        sub = subscription_service.get_subscription(shop_id)
        now = datetime.utcnow()

        sub.status = SubscriptionStatus.PAST_DUE
        sub.grace_period_end = now + timedelta(days=GRACE_PERIOD_DAYS)

        event = {
            "id": str(uuid.uuid4()),
            "shop_id": shop_id,
            "event_type": "invoice.payment_failed",
            "payload": {"reason": "Card declined / Insufficient funds in bank account"},
            "timestamp": now.isoformat()
        }
        self._billing_events.append(event)

        audit_service.record_event(
            actor_type="SYSTEM",
            action="SUBSCRIPTION_PAYMENT_FAILED",
            resource_type="subscription",
            resource_id=sub.id,
            shop_id=shop_id,
            metadata={"status": "past_due", "grace_period_days": GRACE_PERIOD_DAYS}
        )
        return event

    def simulate_grace_period_expired(self, shop_id: str) -> Dict[str, Any]:
        """Simulates grace period expiration without payment; shop becomes SUSPENDED."""
        sub = subscription_service.get_subscription(shop_id)
        sub.status = SubscriptionStatus.SUSPENDED

        event = {
            "id": str(uuid.uuid4()),
            "shop_id": shop_id,
            "event_type": "subscription.suspended",
            "payload": {"reason": "Grace period expired without settlement"},
            "timestamp": datetime.utcnow().isoformat()
        }
        self._billing_events.append(event)

        audit_service.record_event(
            actor_type="SYSTEM",
            action="SUBSCRIPTION_SUSPENDED",
            resource_type="subscription",
            resource_id=sub.id,
            shop_id=shop_id
        )
        return event

    def simulate_cancellation(self, shop_id: str) -> Dict[str, Any]:
        """Simulates customer voluntary subscription cancellation."""
        sub = subscription_service.get_subscription(shop_id)
        sub.status = SubscriptionStatus.CANCELED

        event = {
            "id": str(uuid.uuid4()),
            "shop_id": shop_id,
            "event_type": "subscription.canceled",
            "payload": {"reason": "Shop owner requested termination"},
            "timestamp": datetime.utcnow().isoformat()
        }
        self._billing_events.append(event)

        audit_service.record_event(
            actor_type="STAFF",
            action="SUBSCRIPTION_CANCELED",
            resource_type="subscription",
            resource_id=sub.id,
            shop_id=shop_id
        )
        return event

    def clear(self):
        self._invoices.clear()
        self._billing_events.clear()


fake_billing_adapter = FakeBillingAdapter()
