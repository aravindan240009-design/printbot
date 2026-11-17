from types import SimpleNamespace
import unittest

from packages.contracts.models import PrintJobCreateRequest, PrintOptions
from services.api.routers.orders import QuoteRequest, calculate_quote
from services.api.services.job_service import job_service
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
            ),
        )

        self.assertEqual(quote["total_paise"], 1750)
        self.assertEqual(job.total_paise, quote["total_paise"])
        self.assertEqual(job.currency, "INR")


if __name__ == "__main__":
    unittest.main()
