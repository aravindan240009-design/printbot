"""
FastAPI Router Tests for Document Ingestion, Multi-Format Conversion,
Preview Rendering & PDF Download.
"""

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from services.api.main import app
from services.api.routers.documents import MOCK_ASSET_CACHE


@pytest.fixture
def client():
    return TestClient(app, headers={"X-Shop-ID": "test-shop"})


def test_router_scan_and_convert_txt(client):
    content = b"Welcome to Print Bot! Automatic Multi-Format Document Conversion."
    files = {"file": ("readme.txt", io.BytesIO(content), "text/plain")}
    response = client.post("/api/v1/documents/scan", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["format"] == "txt"
    assert data["page_count"] == 1
    assert data["is_converted"] is True
    assert data["asset_id"] is not None

    asset_id = data["asset_id"]
    assert asset_id in MOCK_ASSET_CACHE
    assert MOCK_ASSET_CACHE[asset_id]["pdf_bytes"] is not None


def test_router_scan_and_convert_image(client):
    # Create 300x300 PNG
    img = Image.new("RGB", (300, 300), color=(16, 185, 129))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    files = {"file": ("banner.png", buf, "image/png")}
    response = client.post("/api/v1/documents/scan", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert data["format"] == "png"
    assert data["page_count"] == 1
    assert data["is_converted"] is True

    asset_id = data["asset_id"]

    # Verify preview returns real JPEG
    prev_res = client.get(f"/api/v1/documents/{asset_id}/preview/1")
    assert prev_res.status_code == 200
    assert prev_res.headers["content-type"] == "image/jpeg"
    assert len(prev_res.content) > 500

    # Verify download normalized PDF
    dl_res = client.get(f"/api/v1/documents/{asset_id}/download-pdf")
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
    assert dl_res.content.startswith(b"%PDF-")


def test_router_custom_convert_options(client):
    # Upload text with multiple lines
    content = "\n".join([f"Line {i} content text." for i in range(1, 100)]).encode("utf-8")
    files = {"file": ("doc.txt", io.BytesIO(content), "text/plain")}
    scan_res = client.post("/api/v1/documents/scan", files=files).json()
    asset_id = scan_res["asset_id"]

    # Request custom conversion: A4 Paper, Landscape, Duplex padding
    req_body = {
        "asset_id": asset_id,
        "options": {
            "paper_size": "A4",
            "orientation": "landscape",
            "duplex_padding": True
        }
    }
    conv_res = client.post("/api/v1/documents/convert", json=req_body)
    assert conv_res.status_code == 200
    cdata = conv_res.json()
    assert cdata["is_success"] is True
    # In duplex padding, total page count must be even
    assert cdata["page_count"] % 2 == 0
    # A4 landscape dimensions: width ~ 841.89 pts, height ~ 595.28 pts
    assert cdata["width_pts"] > cdata["height_pts"]


def test_router_rejects_empty_file(client):
    files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}
    response = client.post("/api/v1/documents/scan", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is False
    assert "Empty file" in data["error_message"]
