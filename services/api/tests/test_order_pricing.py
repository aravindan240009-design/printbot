from types import SimpleNamespace
import unittest

from fastapi import HTTPException
from packages.contracts.models import JobStatus, OrderMode, PrintJobCreateRequest, PrintOptions
from services.api.routers.orders import QuoteRequest, calculate_quote, require_order_permission
from services.api.services.job_service import job_service
from services.api.services.shop_service import shop_service
from services.api.services.shop_customization_service import shop_customization_service


class OrderPricingTests(unittest.TestCase):
    def test_customer_quote_matches_created_job_total(self):
        shop_id = "order-pricing-test-shop"
        rates = {
            "bw_per_side_paise": 175,
            "color_per_side_paise": 1000,
            "duplex_discount_percent": 15,
            "staple_paise": 500,
            "spiral_paise": 4000,
            "hard_bind_paise": 15000,
        }
        shop_customization_service.update_config(
            shop_id,
            {"pricing_rates_paise": rates},
        )
        shop_service.update_settings(shop_id, new_mode=OrderMode.MANUAL_APPROVAL)
        options = PrintOptions()
        quote = calculate_quote(
            QuoteRequest(page_count=10, options=options),
            SimpleNamespace(state=SimpleNamespace(tenant_id=shop_id)),
        )
        job = job_service.create_job(
            shop_id,
            PrintJobCreateRequest(
                file_name="sample.pdf",
                file_size_bytes=1000,
                page_count=10,
                options=options,
                customer_email="test@example.com",
                order_mode=OrderMode.FULL_AUTOMATIC,
            ),
        )

        self.assertEqual(quote["total_paise"], 1750)
        self.assertEqual(job.total_paise, quote["total_paise"])
        self.assertEqual(job.currency, "INR")
        self.assertEqual(job.order_mode, OrderMode.MANUAL_APPROVAL)

        with self.assertRaises(HTTPException) as underpayment_error:
            job_service.record_cash_payment(
                shop_id,
                job.id,
                staff_email="staff@example.com",
                amount_paise=0,
            )
        self.assertEqual(underpayment_error.exception.status_code, 400)

        job_service.record_cash_payment(
            shop_id,
            job.id,
            staff_email="staff@example.com",
            amount_paise=job.total_paise,
        )
        with self.assertRaises(HTTPException) as duplicate_cash_error:
            job_service.record_cash_payment(
                shop_id,
                job.id,
                staff_email="staff@example.com",
                amount_paise=job.total_paise,
            )
        self.assertEqual(duplicate_cash_error.exception.status_code, 409)

    def test_order_actions_require_staff_permission(self):
        guest_request = SimpleNamespace(state=SimpleNamespace(tenant_id="shop-a"))
        with self.assertRaises(HTTPException) as guest_error:
            require_order_permission(guest_request, "orders:approve")
        self.assertEqual(guest_error.exception.status_code, 403)

        operator_request = SimpleNamespace(
            state=SimpleNamespace(
                user={"role": "OPERATOR", "permissions": ["orders:read", "orders:approve"]}
            )
        )
        self.assertEqual(
            require_order_permission(operator_request, "orders:approve")["role"],
            "OPERATOR",
        )
        with self.assertRaises(HTTPException) as operator_error:
            require_order_permission(operator_request, "orders:delete")
        self.assertEqual(operator_error.exception.status_code, 403)

    def test_late_payment_for_cancelled_order_is_held_for_review(self):
        shop_id = "late-payment-test-shop"
        shop_service.update_settings(shop_id, new_mode=OrderMode.MANUAL_APPROVAL)
        job = job_service.create_job(
            shop_id,
            PrintJobCreateRequest(
                file_name="late-payment.pdf",
                file_size_bytes=1000,
                page_count=1,
                options=PrintOptions(),
                customer_email="late-payment@example.com",
            ),
        )
        job_service.cancel_order(shop_id, job.id, reason="Customer cancelled before payment.")

        paid_job = job_service.mark_paid(
            shop_id,
            job.id,
            payment_intent_id="rzp_payment_late",
            amount_paise=job.total_paise,
        )

        self.assertEqual(paid_job.status, JobStatus.PAID_HELD)
        self.assertIn("cancelled", paid_job.hold_reason.lower())

        replayed_job = job_service.mark_paid(
            shop_id,
            job.id,
            payment_intent_id="rzp_payment_late",
            amount_paise=job.total_paise,
        )
        self.assertEqual(replayed_job.status, JobStatus.PAID_HELD)

    def test_unpaid_order_cannot_be_approved_for_printing(self):
        shop_id = "unpaid-approval-test-shop"
        shop_service.update_settings(shop_id, new_mode=OrderMode.MANUAL_APPROVAL)
        job = job_service.create_job(
            shop_id,
            PrintJobCreateRequest(
                file_name="unpaid.pdf",
                file_size_bytes=1000,
                page_count=1,
                options=PrintOptions(),
                customer_email="unpaid@example.com",
            ),
        )

        with self.assertRaises(HTTPException) as error:
            job_service.approve_job(shop_id, job.id, staff_email="owner@example.com")

        self.assertEqual(error.exception.status_code, 409)
        self.assertEqual(job.status, JobStatus.PENDING_PAYMENT)

    def test_paid_manual_order_can_be_approved_once_for_printing(self):
        shop_id = "paid-approval-test-shop"
        shop_service.update_settings(shop_id, new_mode=OrderMode.MANUAL_APPROVAL)
        job = job_service.create_job(
            shop_id,
            PrintJobCreateRequest(
                file_name="paid.pdf",
                file_size_bytes=1000,
                page_count=1,
                options=PrintOptions(),
                customer_email="paid@example.com",
            ),
        )
        job_service.mark_paid(
            shop_id,
            job.id,
            payment_intent_id="rzp_payment_paid",
            amount_paise=job.total_paise,
        )

        approved_job = job_service.approve_job(shop_id, job.id, staff_email="owner@example.com")

        self.assertEqual(approved_job.status, JobStatus.QUEUED)


if __name__ == "__main__":
    unittest.main()
