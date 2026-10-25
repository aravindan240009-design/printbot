"""
Tests for Document Preview, Photo Layout Presets & Tenant Scoping.
"""

import io
from PIL import Image
from fastapi.testclient import TestClient

from services.api.main import app
from services.api.services.preview_service import preview_service
from services.api.routers.documents import MOCK_ASSET_CACHE
from packages.contracts.models import SupportedFormat, FileScanResult

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"
SHOP_B = "22222222-2222-2222-2222-222222222222"


def test_preview_service_thumbnail_generation():
    # Create sample 1000x800 image
    img = Image.new("RGB", (1000, 800), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")

    thumb = preview_service.generate_image_thumbnail(buf.getvalue(), max_width=400)
    with Image.open(io.BytesIO(thumb)) as thumb_img:
        assert thumb_img.size[0] == 400
        assert thumb_img.size[1] == 320


def test_passport_8up_grid_generation():
    # Create sample portrait photo
    img = Image.new("RGB", (300, 400), color="#87CEEB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")

    sheet_bytes = preview_service.generate_passport_8up_grid(buf.getvalue())
    with Image.open(io.BytesIO(sheet_bytes)) as sheet:
        # Standard 4x6 inch photo at 300 DPI = 1800 x 1200 px
        assert sheet.size == (1800, 1200)


def test_id_front_back_composite_generation():
    # Create sample front photo
    front = Image.new("RGB", (500, 300), color="#FDE047")
    buf = io.BytesIO()
    front.save(buf, format="JPEG")

    composite_bytes = preview_service.generate_id_front_back_composite(buf.getvalue())
    with Image.open(io.BytesIO(composite_bytes)) as sheet:
        # A4 at 300 DPI = 2480 x 3508 px
        assert sheet.size == (2480, 3508)


def test_cross_tenant_preview_isolation():
    # Cache an asset belonging to Shop A
    asset_id = "test-asset-shop-a-999"
    img = Image.new("RGB", (200, 200), color="red")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")

    MOCK_ASSET_CACHE[asset_id] = {
        "tenant_id": SHOP_A,
        "filename": "Classified_ShopA.jpg",
        "content": buf.getvalue(),
        "scan": FileScanResult(
            is_valid=True,
            format=SupportedFormat.JPEG,
            mime_type="image/jpeg",
            file_size_bytes=len(buf.getvalue()),
            page_count=1
        )
    }

    # Shop A can fetch preview
    res_a = client.get(
        f"/api/v1/documents/{asset_id}/preview/1",
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res_a.status_code == 200

    # Shop B receives an indistinguishable not-found response so the asset
    # identifier cannot be used as a cross-tenant oracle.
    res_b = client.get(
        f"/api/v1/documents/{asset_id}/preview/1",
        headers={"X-Shop-ID": SHOP_B}
    )
    assert res_b.status_code == 404
    assert res_b.json()["detail"] == "Document asset not found."
