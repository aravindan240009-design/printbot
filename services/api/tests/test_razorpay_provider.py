import hashlib
import hmac
import json
import time
import unittest
import asyncio

from fastapi import HTTPException

from packages.contracts.models import JobStatus, OrderMode, PrintJobCreateRequest, PrintOptions
from services.api.core.idempotency import idempotency_store
from services.api.routers.webhooks import handle_razorpay_webhook
from services.api.services.job_service import job_service
from services.api.services.payment_provider import RazorpayProvider, razorpay_provider
from services.api.services.shop_service import shop_service


class RazorpayProviderTests(unittest.TestCase):
    def setUp(self):
        self.provider = RazorpayProvider()
        self.provider.configure_shop_merchant(
            shop_id="shop-a",
            key_id="key-a",
            key_secret="secret-a",
            webhook_secret="webhook-a",
        )
        self.provider.configure_shop_merchant(
            shop_id="shop-b",
            key_id="key-b",
            key_secret="secret-b",
            webhook_secret="webhook-b",
        )
        self.provider._orders["order-a"] = {
            "id": "order-a",
            "shop_id": "shop-a",
            "order_id": "job-a",
            "amount": 1250,
            "currency": "INR",
            "status": "created",
        }

    def _signed_event(self, payload, secret):
        raw_body = json.dumps(payload, sort_keys=True).encode("utf-8")
        signature = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return raw_body, {"X-Razorpay-Signature": signature}

    @staticmethod
    def _payload(order_id="order-a", shop_id="shop-a", job_id="job-a", created_at=None):
        return {
            "created_at": int(time.time()) if created_at is None else created_at,
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "order_id": order_id,
                        "amount": 1250,
                        "currency": "INR",
                        "notes": {"shop_id": shop_id, "order_id": job_id},
                    }
                }
            },
        }

    def test_webhook_merchant_and_order_come_from_saved_gateway_mapping(self):
        payload = self._payload(shop_id="shop-b", job_id="job-b")
        raw_body, headers = self._signed_event(payload, "webhook-a")

        event = self.provider.verify_webhook(raw_body, headers)

        self.assertEqual(event.shop_id, "shop-a")
        self.assertEqual(event.order_id, "job-a")
        self.assertEqual(event.idempotency_key, hashlib.sha256(raw_body).hexdigest())

    def test_unknown_gateway_order_cannot_select_merchant_from_notes(self):
        payload = self._payload(order_id="unknown-order", shop_id="shop-b", job_id="job-b")
        raw_body, headers = self._signed_event(payload, "webhook-b")

        with self.assertRaises(HTTPException) as error:
            self.provider.verify_webhook(raw_body, headers)

        self.assertEqual(error.exception.status_code, 401)

    def test_delayed_signed_webhook_is_not_rejected_only_for_age(self):
        payload = self._payload(created_at=1)
        raw_body, headers = self._signed_event(payload, "webhook-a")

        event = self.provider.verify_webhook(raw_body, headers)

        self.assertEqual(event.status, "PAID")

    def test_captured_amount_and_currency_must_match_saved_order(self):
        payload = self._payload()
        payload["payload"]["payment"]["entity"]["amount"] = 1249
        raw_body, headers = self._signed_event(payload, "webhook-a")

        with self.assertRaises(HTTPException) as error:
            self.provider.verify_webhook(raw_body, headers)

        self.assertEqual(error.exception.status_code, 400)

    def test_expected_shop_header_only_checks_mapping_after_signature(self):
        payload = self._payload()
        raw_body, headers = self._signed_event(payload, "webhook-a")

        with self.assertRaises(HTTPException) as error:
            self.provider.verify_webhook(raw_body, headers, expected_shop_id="shop-b")

        self.assertEqual(error.exception.status_code, 403)

    def test_missing_shop_credentials_do_not_fall_back_to_platform_keys(self):
        with self.assertRaises(HTTPException) as error:
            self.provider._get_credentials("unconfigured-shop")

        self.assertEqual(error.exception.status_code, 503)


class DelayedRazorpayWebhookTests(unittest.TestCase):
    def test_delayed_capture_is_held_for_reconciliation_not_queued(self):
        shop_id = "delayed-webhook-test-shop"
        shop_service.update_settings(shop_id, new_mode=OrderMode.MANUAL_APPROVAL)
        job = job_service.create_job(
            shop_id,
            PrintJobCreateRequest(
                file_name="delayed.pdf",
                file_size_bytes=1000,
                page_count=1,
                options=PrintOptions(),
                customer_email="delayed@example.com",
            ),
        )
        razorpay_provider.clear()
        self.addCleanup(razorpay_provider.clear)
        razorpay_provider.configure_shop_merchant(
            shop_id=shop_id,
            key_id="key-delayed",
            key_secret="secret-delayed",
            webhook_secret="webhook-delayed",
        )
        razorpay_provider._orders["gateway-order-delayed"] = {
            "id": "gateway-order-delayed",
            "shop_id": shop_id,
            "order_id": job.id,
            "amount": job.total_paise,
            "currency": "INR",
            "status": "created",
        }
        payload = {
            "created_at": 1,
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "order_id": "gateway-order-delayed",
                        "amount": job.total_paise,
                        "currency": "INR",
                        "notes": {"shop_id": "untrusted-shop", "order_id": "untrusted-job"},
                    }
                }
            },
        }
        raw_body = json.dumps(payload, sort_keys=True).encode("utf-8")
        signature = hmac.new(b"webhook-delayed", raw_body, hashlib.sha256).hexdigest()

        class StubRequest:
            headers = {"X-Razorpay-Signature": signature}

            async def body(self):
                return raw_body

        result = asyncio.run(handle_razorpay_webhook(StubRequest(), signature, None))
        held_job = job_service.get_job(shop_id, job.id)

        self.assertEqual(result["status"], "reconciliation_required")
        self.assertEqual(held_job.status, JobStatus.PAYMENT_VERIFYING)
        self.assertIsNone(held_job.payment_intent_id)
        with self.assertRaises(HTTPException) as approval_error:
            job_service.approve_job(shop_id, job.id, staff_email="owner@example.com")
        self.assertEqual(approval_error.exception.status_code, 409)

        replayed_result = asyncio.run(handle_razorpay_webhook(StubRequest(), signature, None))
        self.assertEqual(replayed_result, result)


if __name__ == "__main__":
    unittest.main()
