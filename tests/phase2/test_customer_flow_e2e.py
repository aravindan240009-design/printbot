"""
End-to-End API Integration test for the 3-Screen Customer Mobile QR PWA flow.
Verifies no-login, no-OTP walk-in guest journey:
Screen 1: Scan QR -> Resolve Shop -> Upload Document.
Screen 2: Configure Settings -> Live Multi-File Quote in Indian Paise.
Screen 3: Confirm Order -> Status Stepper Tracking.
"""

import io
from fastapi.testclient import TestClient
from PIL import Image

from services.api.main import app
from packages.contracts.models import ColorMode, DuplexMode, PaperSize

client = TestClient(app)
SHOP_A = "11111111-1111-1111-1111-111111111111"


def test_complete_customer_mobile_guest_flow():
    # --------------------------------------------------------------------------
    # Step 1: Scan QR Code & Mint Anonymous Guest Session
    # --------------------------------------------------------------------------
    qr_res = client.get("/api/v1/qr/qr_anna_guindy/resolve")
    assert qr_res.status_code == 200
    qr_data = qr_res.json()
    assert qr_data["shop_id"] == SHOP_A
    assert "Anna" in qr_data["brand_name"]

    # Mint guest session (no OTP, no phone number required)
    guest_res = client.post("/api/v1/guest/session", json={"shop_id": SHOP_A})
    assert guest_res.status_code == 200
    guest_token = guest_res.json()["session_token"]
    assert guest_token.startswith("gst_")

    headers = {
        "X-Guest-Session": guest_token,
        "X-Shop-ID": SHOP_A
    }

    # --------------------------------------------------------------------------
    # Step 2: Upload & Scan Document
    # --------------------------------------------------------------------------
    img = Image.new("RGB", (800, 600), color="white")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    file_bytes = buf.getvalue()

    scan_res = client.post(
        "/api/v1/documents/scan",
        files={"file": ("College_Notes.jpg", file_bytes, "image/jpeg")},
        headers=headers
    )
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["is_valid"] is True
    assert scan_data["format"] == "jpeg"
    assert scan_data["page_count"] == 1

    # --------------------------------------------------------------------------
    # Step 3: Configure Settings & Receive Locked Indian Paise Quote
    # --------------------------------------------------------------------------
    quote_req = {
        "shop_id": SHOP_A,
        "items": [
            {
                "file_id": "file-101",
                "file_name": "College_Notes.jpg",
                "page_count": 1,
                "options": {
                    "copies": 3,
                    "color_mode": "bw",
                    "paper_size": "A4",
                    "duplex_mode": "simplex",
                    "orientation": "portrait",
                    "binding": "none",
                    "paper_gsm": 75,
                    "pages_per_sheet": 1
                }
            }
        ]
    }
    quote_res = client.post("/api/v1/documents/quote", json=quote_req, headers=headers)
    assert quote_res.status_code == 200
    quote_data = quote_res.json()
    assert quote_data["currency"] == "INR"
    assert quote_data["total_logical_pages"] == 1
    assert quote_data["total_rendered_sides"] == 3
    assert quote_data["total_physical_sheets"] == 3
    assert quote_data["total_paise"] == 450  # 3 copies * 150 paise = 450 paise (₹4.50)
    assert quote_data["total_rupees"] == 4.50
    assert len(quote_data["quote_hash"]) == 64

    # --------------------------------------------------------------------------
    # Step 4: Confirm Order & Place in Queue
    # --------------------------------------------------------------------------
    order_req = {
        "file_name": "College_Notes.jpg",
        "file_size_bytes": len(file_bytes),
        "page_count": 1,
        "options": {
            "copies": 3,
            "color_mode": "bw",
            "paper_size": "A4",
            "duplex_mode": "simplex",
            "orientation": "portrait",
            "binding": "none",
            "paper_gsm": 75,
            "pages_per_sheet": 1
        },
        "customer_email": "walkin.guest@printbot.in"
    }
    order_res = client.post("/api/v1/orders", json=order_req, headers=headers)
    assert order_res.status_code == 201
    order_data = order_res.json()
    job_id = order_data["id"]
    # Initial state is strictly PENDING_PAYMENT until payment or counter confirmation
    assert order_data["status"] == "PENDING_PAYMENT"

    # --------------------------------------------------------------------------
    # Step 5: Anonymous Order Status Tracking
    # --------------------------------------------------------------------------
    track_res = client.get(f"/api/v1/orders/{job_id}", headers=headers)
    assert track_res.status_code == 200
    assert track_res.json()["id"] == job_id
    assert track_res.json()["status"] == "PENDING_PAYMENT"
