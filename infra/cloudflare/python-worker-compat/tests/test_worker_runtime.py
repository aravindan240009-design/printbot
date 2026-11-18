import io
import os
import unittest

import httpx
from PIL import Image
from pypdf import PdfWriter


BASE_URL = os.environ.get("WORKER_COMPAT_URL", "http://127.0.0.1:8787")


class WorkerRuntimeTests(unittest.TestCase):
    def test_fastapi_and_package_imports(self):
        response = httpx.get(f"{BASE_URL}/compatibility", timeout=5)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "fastapi": "0.136.1",
                "httpx": "0.28.1",
                "pydantic": "2.12.5",
                "python_multipart": "0.0.12",
                "pillow": "12.2.0",
                "pypdf": "6.19.0",
                "email_validation": "ok",
            },
        )

    def test_multipart_image_and_pdf_parsing(self):
        image_buffer = io.BytesIO()
        Image.new("RGB", (1, 1), color="white").save(image_buffer, format="PNG")
        image_response = httpx.post(
            f"{BASE_URL}/inspect-image",
            files={"file": ("probe.png", image_buffer.getvalue(), "image/png")},
            timeout=5,
        )

        pdf_writer = PdfWriter()
        pdf_writer.add_blank_page(width=72, height=72)
        pdf_buffer = io.BytesIO()
        pdf_writer.write(pdf_buffer)
        pdf_response = httpx.post(
            f"{BASE_URL}/inspect-pdf",
            files={"file": ("probe.pdf", pdf_buffer.getvalue(), "application/pdf")},
            timeout=5,
        )

        self.assertEqual(image_response.status_code, 200)
        self.assertEqual(
            image_response.json(),
            {"format": "PNG", "width": 1, "height": 1},
        )
        self.assertEqual(pdf_response.status_code, 200)
        self.assertEqual(pdf_response.json(), {"pages": 1})


if __name__ == "__main__":
    unittest.main()
