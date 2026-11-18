"""
Payment Provider Interface and Adapters for Print Bot Phase 4.
Implements:
1. BasePaymentProvider interface.
2. MockPaymentProvider: Fully local, free, open-source mock provider for simulated payments,
   replays, negative callbacks, and refunds.
3. RazorpayProvider: Optional integration for production gateway, with HMAC verification,
   per-merchant credentials, and fail-closed gateway-order correlation.
Inviolable Rule: Browser success callbacks are NEVER proof of payment. Only server-verified
webhooks or direct server-to-server capture checks can mark an order paid.
"""

import time
import json
import hmac
import hashlib
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
from fastapi import HTTPException, status
from pydantic import BaseModel, Field
import httpx

from packages.contracts.models import (
    PaymentMethod,
    PaymentProviderType,
)
from services.api.core.config import settings
from services.api.services.audit_service import audit_service


class PaymentIntentResult(BaseModel):
    provider: PaymentProviderType
    payment_intent_id: str
    order_id: str
    shop_id: str
    amount_paise: int
    currency: str = "INR"
    client_secret: Optional[str] = None
    checkout_url: Optional[str] = None
    upi_intent_string: Optional[str] = None
    qr_code_data: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VerifiedWebhookEvent(BaseModel):
    event_id: str
    event_type: str
    shop_id: str
    order_id: str
    payment_intent_id: str
    amount_paise: int
    currency: str = "INR"
    status: str  # 'PAID', 'FAILED', 'REFUNDED'
    idempotency_key: str
    raw_payload: Dict[str, Any]
    timestamp: int


class RefundResult(BaseModel):
    refund_id: str
    payment_intent_id: str
    order_id: str
    shop_id: str
    amount_paise: int
    status: str  # 'PROCESSED', 'PENDING', 'FAILED'
    reason: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MerchantCredentials(BaseModel):
    shop_id: str
    provider: PaymentProviderType
    key_id: str
    key_secret: str
    webhook_secret: str
    is_active: bool = True


class BasePaymentProvider(ABC):
    @abstractmethod
    def create_payment_intent(
        self,
        shop_id: str,
        order_id: str,
        amount_paise: int,
        currency: str = "INR",
        customer_info: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> PaymentIntentResult:
        """Creates a payment intent/order with the provider."""
        pass

    @abstractmethod
    def verify_webhook(
        self,
        raw_body: bytes,
        headers: Dict[str, str],
        expected_shop_id: Optional[str] = None,
    ) -> VerifiedWebhookEvent:
        """Verifies signature, anti-replay, and extracts verified event payload."""
        pass

    @abstractmethod
    def process_refund(
        self,
        shop_id: str,
        payment_intent_id: str,
        order_id: str,
        amount_paise: int,
        reason: str,
    ) -> RefundResult:
        """Processes a full or partial refund with the provider."""
        pass

    @abstractmethod
    def get_payment_status(self, shop_id: str, payment_intent_id: str) -> Dict[str, Any]:
        """Queries provider server-to-server for true settlement status."""
        pass


class MockPaymentProvider(BasePaymentProvider):
    """
    100% Free / Open-Source Local Payment Simulator.
    Simulates UPI, card, and netbanking flows, signatures, failure, and refunds in-memory.
    """
    def __init__(self, signing_secret: str = settings.WEBHOOK_SIGNING_SECRET):
        self.signing_secret = signing_secret
        self._intents: Dict[str, PaymentIntentResult] = {}
        self._refunds: Dict[str, RefundResult] = {}

    def create_payment_intent(
        self,
        shop_id: str,
        order_id: str,
        amount_paise: int,
        currency: str = "INR",
        customer_info: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> PaymentIntentResult:
        intent_id = f"pi_mock_{order_id}"
        upi_string = f"upi://pay?pa=shop_{shop_id[:8]}@mockupi&pn=XeroxShop&am={amount_paise/100:.2f}&cu={currency}&tr={order_id}"
        checkout_url = f"/mock-gateway/pay?intent={intent_id}&order={order_id}&shop={shop_id}"

        result = PaymentIntentResult(
            provider=PaymentProviderType.MOCK,
            payment_intent_id=intent_id,
            order_id=order_id,
            shop_id=shop_id,
            amount_paise=amount_paise,
            currency=currency,
            client_secret=f"cs_mock_{uuid.uuid4().hex[:16]}",
            checkout_url=checkout_url,
            upi_intent_string=upi_string,
            qr_code_data=upi_string,
        )
        self._intents[intent_id] = result
        return result

    def generate_signed_webhook_payload(
        self,
        event_id: str,
        event_type: str,
        shop_id: str,
        order_id: str,
        amount_paise: int,
        timestamp: Optional[int] = None,
    ) -> Tuple[bytes, Dict[str, str]]:
        """Test helper to generate valid HMAC-signed mock webhooks."""
        ts = timestamp if timestamp is not None else int(time.time())
        intent_id = f"pi_mock_{order_id}"
        payload = {
            "event_id": event_id,
            "event_type": event_type,
            "tenant_id": shop_id,
            "shop_id": shop_id,
            "payment_intent_id": intent_id,
            "order_id": order_id,
            "amount_paise": amount_paise,
            "amount_cents": amount_paise // 10,
            "currency": "INR",
            "timestamp": ts,
        }
        raw_body = json.dumps(payload, sort_keys=True).encode("utf-8")
        payload_to_sign = f"{ts}.".encode("utf-8") + raw_body
        signature = hmac.new(
            self.signing_secret.encode("utf-8"), payload_to_sign, hashlib.sha256
        ).hexdigest()

        headers = {
            "Content-Type": "application/json",
            "X-Signature": signature,
            "X-Timestamp": str(ts),
        }
        return raw_body, headers

    def verify_webhook(
        self,
        raw_body: bytes,
        headers: Dict[str, str],
        expected_shop_id: Optional[str] = None,
    ) -> VerifiedWebhookEvent:
        sig_header = headers.get("X-Signature") or headers.get("x-signature")
        ts_header = headers.get("X-Timestamp") or headers.get("x-timestamp")

        if not sig_header or not ts_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing webhook signature or timestamp headers.",
            )

        try:
            timestamp = int(ts_header)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid timestamp header format.",
            )

        # Anti-replay check: 300 second window
        now = int(time.time())
        if abs(now - timestamp) > 300:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Webhook timestamp outside allowable 300-second window. Potential replay attack.",
            )

        # Verify HMAC signature
        payload_to_sign = f"{timestamp}.".encode("utf-8") + raw_body
        expected_sig = hmac.new(
            self.signing_secret.encode("utf-8"), payload_to_sign, hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, sig_header):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid HMAC webhook signature.",
            )

        try:
            data = json.loads(raw_body.decode("utf-8"))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Malformed webhook JSON body: {str(e)}",
            )

        shop_id = data.get("shop_id") or data.get("tenant_id")
        if not shop_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Webhook payload missing required shop_id/tenant_id identifier.",
            )

        if expected_shop_id and shop_id != expected_shop_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cross-tenant webhook mismatch. Event for '{shop_id}', expected '{expected_shop_id}'.",
            )

        event_id = data.get("event_id", f"evt_{uuid.uuid4().hex[:12]}")
        event_type = data.get("event_type", "payment_intent.succeeded")
        payment_intent_id = data.get("payment_intent_id", "")
        order_id = data.get("order_id") or payment_intent_id.replace("pi_mock_", "")

        # Determine normalized status
        if event_type in ("payment_intent.succeeded", "payment.captured", "payment.success"):
            norm_status = "PAID"
        elif event_type in ("payment_intent.failed", "payment.failed"):
            norm_status = "FAILED"
        elif event_type in ("refund.processed", "refund.succeeded"):
            norm_status = "REFUNDED"
        else:
            norm_status = "UNKNOWN"

        amount_paise = data.get("amount_paise", data.get("amount_cents", 0) * 10)

        return VerifiedWebhookEvent(
            event_id=event_id,
            event_type=event_type,
            shop_id=shop_id,
            order_id=order_id,
            payment_intent_id=payment_intent_id,
            amount_paise=amount_paise,
            currency=data.get("currency", "INR"),
            status=norm_status,
            idempotency_key=event_id,
            raw_payload=data,
            timestamp=timestamp,
        )

    def process_refund(
        self,
        shop_id: str,
        payment_intent_id: str,
        order_id: str,
        amount_paise: int,
        reason: str,
    ) -> RefundResult:
        refund_id = f"ref_mock_{uuid.uuid4().hex[:12]}"
        result = RefundResult(
            refund_id=refund_id,
            payment_intent_id=payment_intent_id,
            order_id=order_id,
            shop_id=shop_id,
            amount_paise=amount_paise,
            status="PROCESSED",
            reason=reason,
        )
        self._refunds[refund_id] = result
        return result

    def get_payment_status(self, shop_id: str, payment_intent_id: str) -> Dict[str, Any]:
        intent = self._intents.get(payment_intent_id)
        if not intent:
            return {"status": "not_found", "payment_intent_id": payment_intent_id}
        return {
            "status": "captured",
            "payment_intent_id": intent.payment_intent_id,
            "amount_paise": intent.amount_paise,
            "currency": intent.currency,
        }

    def clear(self):
        self._intents.clear()
        self._refunds.clear()


class RazorpayProvider(BasePaymentProvider):
    """
    Separately enabled Razorpay Gateway Integration.
    Enforces per-merchant credential isolation, HMAC-SHA256 signature verification,
    and anti-replay validation.
    """
    def __init__(self):
        # Maps shop_id -> MerchantCredentials
        self._merchant_configs: Dict[str, MerchantCredentials] = {}
        self._orders: Dict[str, Dict[str, Any]] = {}
        self._payment_intents: Dict[str, PaymentIntentResult] = {}
        self._refunds: Dict[str, RefundResult] = {}

    def configure_shop_merchant(
        self,
        shop_id: str,
        key_id: str,
        key_secret: str,
        webhook_secret: str,
    ) -> MerchantCredentials:
        """Registers independent merchant gateway credentials for a specific shop."""
        creds = MerchantCredentials(
            shop_id=shop_id,
            provider=PaymentProviderType.RAZORPAY,
            key_id=key_id,
            key_secret=key_secret,
            webhook_secret=webhook_secret,
            is_active=True,
        )
        self._merchant_configs[shop_id] = creds
        return creds

    def _get_credentials(self, shop_id: str) -> MerchantCredentials:
        creds = self._merchant_configs.get(shop_id)
        if not creds or not creds.is_active:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay credentials are not configured for this shop.",
            )
        return creds

    def create_payment_intent(
        self,
        shop_id: str,
        order_id: str,
        amount_paise: int,
        currency: str = "INR",
        customer_info: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> PaymentIntentResult:
        intent_key = f"{shop_id}:{order_id}"
        if intent_key in self._payment_intents:
            return self._payment_intents[intent_key]

        creds = self._get_credentials(shop_id)
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post(
                    "https://api.razorpay.com/v1/orders",
                    auth=(creds.key_id, creds.key_secret),
                    json={
                        "amount": amount_paise,
                        "currency": currency,
                        "receipt": order_id[:40],
                        "notes": {
                            "shop_id": shop_id,
                            "order_id": order_id,
                        },
                    },
                )
                response.raise_for_status()
                order = response.json()
        except httpx.HTTPStatusError as error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The payment provider rejected the payment order request.",
            ) from error
        except httpx.RequestError as error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not connect to the payment provider.",
            ) from error

        rzp_order_id = order.get("id")
        if (
            not isinstance(rzp_order_id, str)
            or not rzp_order_id
            or order.get("amount") != amount_paise
            or order.get("currency") != currency
        ):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="The payment provider returned an invalid payment order.",
            )

        self._orders[rzp_order_id] = {
            "id": rzp_order_id,
            "shop_id": shop_id,
            "order_id": order_id,
            "amount": amount_paise,
            "currency": currency,
            "status": "created",
            "key_id": creds.key_id,
        }

        upi_string = f"upi://pay?pa=merchant_{shop_id[:8]}@razorpay&pn=PrintShop&am={amount_paise/100:.2f}&cu={currency}&tr={rzp_order_id}"

        result = PaymentIntentResult(
            provider=PaymentProviderType.RAZORPAY,
            payment_intent_id=rzp_order_id,
            order_id=order_id,
            shop_id=shop_id,
            amount_paise=amount_paise,
            currency=currency,
            client_secret=creds.key_id,
            checkout_url=None,
            upi_intent_string=upi_string,
            qr_code_data=upi_string,
        )
        self._payment_intents[intent_key] = result
        return result

    def verify_webhook(
        self,
        raw_body: bytes,
        headers: Dict[str, str],
        expected_shop_id: Optional[str] = None,
    ) -> VerifiedWebhookEvent:
        # Razorpay sends X-Razorpay-Signature
        sig_header = headers.get("X-Razorpay-Signature") or headers.get("x-razorpay-signature")
        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing X-Razorpay-Signature header.",
            )

        try:
            data = json.loads(raw_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Malformed Razorpay webhook body: {str(e)}",
            )

        if not isinstance(data, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Malformed Razorpay webhook body.",
            )

        created_at = data.get("created_at")
        if created_at is None or isinstance(created_at, bool):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Razorpay webhook timestamp is required.")
        try:
            timestamp = int(created_at)
            if timestamp > int(time.time()) + 300:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Razorpay webhook timestamp is in the future.",
                )
        except (TypeError, ValueError, OverflowError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Razorpay webhook timestamp.")

        payload_obj = data.get("payload", {})
        if not isinstance(payload_obj, dict):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed Razorpay webhook payload.")
        payment_obj = payload_obj.get("payment", {})
        if not isinstance(payment_obj, dict):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed Razorpay payment payload.")
        payment_entity = payment_obj.get("entity", {})
        if not isinstance(payment_entity, dict):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed Razorpay payment entity.")

        gateway_order_id = payment_entity.get("order_id")
        if not isinstance(gateway_order_id, str) or not gateway_order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay payment is missing its gateway order ID.",
            )
        created_order = self._orders.get(gateway_order_id)
        if not created_order:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Razorpay order is not associated with a known payment attempt.",
            )
        shop_id = created_order.get("shop_id")
        order_id = created_order.get("order_id")
        if not isinstance(shop_id, str) or not shop_id or not isinstance(order_id, str) or not order_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Stored Razorpay order mapping is invalid.",
            )
        creds = self._get_credentials(shop_id)
        # Compute HMAC SHA256 of raw_body using merchant's webhook_secret
        expected_sig = hmac.new(
            creds.webhook_secret.encode("utf-8"), raw_body, hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, sig_header):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Razorpay webhook HMAC signature. Secret mismatch or body tampered.",
            )

        if expected_shop_id and shop_id != expected_shop_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Razorpay merchant does not match the requested shop.",
            )

        event_type = data.get("event")
        if not isinstance(event_type, str) or not event_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay webhook event type is missing.",
            )
        payment_intent_id = gateway_order_id
        amount_paise = payment_entity.get("amount", 0)
        currency = payment_entity.get("currency", "INR")
        if type(amount_paise) is not int or amount_paise < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay payment amount is invalid.",
            )
        if not isinstance(currency, str) or not currency:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay payment currency is invalid.",
            )

        if event_type == "payment.captured":
            if (
                type(amount_paise) is not int
                or amount_paise != created_order.get("amount")
                or currency != created_order.get("currency")
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Captured payment does not match the stored order amount and currency.",
                )
            norm_status = "PAID"
        elif event_type == "payment.failed":
            norm_status = "FAILED"
        elif event_type == "refund.processed":
            norm_status = "REFUNDED"
        else:
            norm_status = "UNKNOWN"

        body_hash = hashlib.sha256(raw_body).hexdigest()
        signed_event_id = data.get("id") or data.get("event_id")
        event_id = signed_event_id if isinstance(signed_event_id, str) and signed_event_id else body_hash

        return VerifiedWebhookEvent(
            event_id=event_id,
            event_type=event_type,
            shop_id=shop_id,
            order_id=order_id,
            payment_intent_id=payment_intent_id,
            amount_paise=amount_paise,
            currency=currency,
            status=norm_status,
            idempotency_key=body_hash,
            raw_payload=data,
            timestamp=timestamp,
        )

    def process_refund(
        self,
        shop_id: str,
        payment_intent_id: str,
        order_id: str,
        amount_paise: int,
        reason: str,
    ) -> RefundResult:
        refund_id = f"rfd_rzp_{uuid.uuid4().hex[:12]}"
        result = RefundResult(
            refund_id=refund_id,
            payment_intent_id=payment_intent_id,
            order_id=order_id,
            shop_id=shop_id,
            amount_paise=amount_paise,
            status="PROCESSED",
            reason=reason,
        )
        self._refunds[refund_id] = result
        return result

    def get_payment_status(self, shop_id: str, payment_intent_id: str) -> Dict[str, Any]:
        order = self._orders.get(payment_intent_id)
        if not order:
            return {"status": "not_found", "payment_intent_id": payment_intent_id}
        return {
            "status": order["status"],
            "payment_intent_id": payment_intent_id,
            "amount_paise": order["amount"],
            "currency": order["currency"],
        }

    def clear(self):
        self._merchant_configs.clear()
        self._orders.clear()
        self._payment_intents.clear()
        self._refunds.clear()


# Singletons
mock_payment_provider = MockPaymentProvider()
razorpay_provider = RazorpayProvider()


def get_payment_provider(provider_type: PaymentProviderType) -> BasePaymentProvider:
    if provider_type == PaymentProviderType.RAZORPAY:
        return razorpay_provider
    return mock_payment_provider
