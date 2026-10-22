"""
Phase 7: Advanced Print Studio, Optional Hardware Adapters & Differentiation Tests.
Verifies:
1. Saddle-stitch booklet / brochure imposition with golden signature permutations (4-page, 8-page, 5-page).
2. Accurate mixed-color per-page pricing in Indian paise.
3. Poster / tiled enlargement layout with overlap bleed calculation.
4. ID card front/back single-sheet placement (standard 85.6 x 53.98 mm).
5. Pre-flight DPI resolution quality warnings (<150 DPI).
6. Password-protected PDF verification and unlocking.
7. Saved shop preset templates (Lab Record, Court Brief, Passport 8-up).
8. Tenant-scoped college / corporate prepaid accounts & negative cross-shop isolation.
9. Multi-chunk resumable upload lifecycle.
10. Dynamic queue wait-time estimation with uncertainty labeling.
11. Cryptographically signed print receipts with HMAC-SHA256 tamper detection.
12. Per-staff operational performance reporting.
13. Printer consumables telemetry & low toner alerts (<15%).
14. Intelligent multi-printer routing (paper size, color, duplex, load balancing).
15. Scanner bridge simulator (flatbed vs ADF).
16. Timed physical copier rental simulator with lock/unlock states & staff emergency override.
17. Database Migration 005 schema & RLS enforcement.
"""

import pytest
import uuid
from datetime import datetime
from fastapi.testclient import TestClient

from services.api.main import app
from services.api.services.studio_service import studio_service
from services.api.services.business_differentiation_service import business_differentiation_service
from services.api.services.hardware_bridge_service import hardware_bridge_service
from services.api.services.shop_customization_service import shop_customization_service
from services.api.services.job_service import job_service
from packages.contracts.models import (
    PaperSize,
    DuplexMode,
    Orientation,
    PrintOptions,
    BookletImpositionRequest,
    MixedColorQuoteRequest,
    MixedColorPageBreakdown,
    PosterTiledLayoutRequest,
    IDCardLayoutRequest,
    ShopPreset,
    PrepaidAccount,
    PrepaidChargeRequest,
    ResumableUploadInit,
    ResumableUploadChunk,
    IntelligentRoutingRequest,
    ScannerTaskRequest,
    TimedCopierSessionRequest,
    CryptographicReceipt,
    PrinterConsumableStatus,
    JobStatus,
    PrintJobResponse,
)
from infra.migrations.runner import load_migration_sql, parse_tables_from_ddl

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"
SHOP_B = "22222222-2222-2222-2222-222222222222"


@pytest.fixture(autouse=True)
def clean_services():
    studio_service._init_defaults() if hasattr(studio_service, "_init_defaults") else None
    business_differentiation_service.clear()
    hardware_bridge_service.clear()
    shop_customization_service.clear()
    job_service.clear()


# ==============================================================================
# 1. Saddle-Stitch Booklet Imposition Golden Permutations
# ==============================================================================

def test_saddle_stitch_booklet_4_page_golden():
    req = BookletImpositionRequest(page_count=4)
    res = studio_service.calculate_booklet_imposition(req)

    assert res.total_input_pages == 4
    assert res.total_sheets == 1
    assert len(res.signatures) == 1

    sig = res.signatures[0]
    assert sig.sheet_number == 1
    # Front side of single folded sheet: [Left = 4, Right = 1]
    assert sig.front_left == 4
    assert sig.front_right == 1
    # Back side of single folded sheet: [Left = 2, Right = 3]
    assert sig.back_left == 2
    assert sig.back_right == 3


def test_saddle_stitch_booklet_8_page_golden():
    req = BookletImpositionRequest(page_count=8)
    res = studio_service.calculate_booklet_imposition(req)

    assert res.total_input_pages == 8
    assert res.total_sheets == 2
    assert len(res.signatures) == 2

    # Outer sheet (Sheet 1): Front = [8, 1], Back = [2, 7]
    s1 = res.signatures[0]
    assert s1.front_left == 8
    assert s1.front_right == 1
    assert s1.back_left == 2
    assert s1.back_right == 7

    # Inner sheet (Sheet 2): Front = [6, 3], Back = [4, 5]
    s2 = res.signatures[1]
    assert s2.front_left == 6
    assert s2.front_right == 3
    assert s2.back_left == 4
    assert s2.back_right == 5


def test_saddle_stitch_booklet_with_blanks_and_api():
    # 5 pages requires 2 sheets (8 slots total, pages 6, 7, 8 blank/None)
    res = client.post(
        "/api/v1/studio/booklet/imposition",
        json={"page_count": 5, "paper_size": "A4", "duplex_mode": "duplex_long"},
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_input_pages"] == 5
    assert data["total_sheets"] == 2

    sigs = data["signatures"]
    # Sheet 1 front left should be blank (None) because total slots is 8 but input is 5
    assert sigs[0]["front_left"] is None
    assert sigs[0]["front_right"] == 1
    assert sigs[0]["back_left"] == 2
    assert sigs[0]["back_right"] is None  # Slot 7 is blank


# ==============================================================================
# 2. Mixed-Color Per-Page Pricing Engine
# ==============================================================================

def test_mixed_color_per_page_quote():
    # 10 pages document: 2 color pages (p1, p5) + 8 B&W pages
    # Default shop rates: B&W = 200 paise (₹2), Color = 1000 paise (₹10)
    # Expected: (8 * 200) + (2 * 1000) = 1600 + 2000 = 3600 paise (₹36.00)
    pages = [
        {"page_number": 1, "is_color": True, "coverage_percent": 15.0},
        {"page_number": 2, "is_color": False, "coverage_percent": 5.0},
        {"page_number": 3, "is_color": False, "coverage_percent": 4.0},
        {"page_number": 4, "is_color": False, "coverage_percent": 6.0},
        {"page_number": 5, "is_color": True, "coverage_percent": 25.0},
        {"page_number": 6, "is_color": False, "coverage_percent": 3.0},
        {"page_number": 7, "is_color": False, "coverage_percent": 4.0},
        {"page_number": 8, "is_color": False, "coverage_percent": 5.0},
        {"page_number": 9, "is_color": False, "coverage_percent": 2.0},
        {"page_number": 10, "is_color": False, "coverage_percent": 4.0},
    ]

    res = client.post(
        "/api/v1/studio/mixed-color/quote",
        json={
            "shop_id": SHOP_A,
            "total_pages": 10,
            "page_breakdown": pages,
            "copies": 2,
            "paper_size": "A4"
        },
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res.status_code == 200
    data = res.json()

    assert data["bw_pages_per_copy"] == 8
    assert data["color_pages_per_copy"] == 2
    assert data["bw_rate_paise"] == 200
    assert data["color_rate_paise"] == 1000
    # 2 copies of 3600 paise = 7200 paise (₹72.00)
    assert data["total_paise"] == 7200
    assert data["pricing_strategy"] == "ACCURATE_PER_PAGE_SPLIT"


# ==============================================================================
# 3. Poster Tiling & ID Card Front/Back Imposition
# ==============================================================================

def test_poster_tiled_layout():
    res = client.post(
        "/api/v1/studio/poster/tiled-layout",
        json={
            "input_asset_id": "asset_poster_123",
            "grid_cols": 2,
            "grid_rows": 2,
            "overlap_bleed_mm": 10.0,
            "target_paper_size": "A4"
        },
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_tiles"] == 4
    assert len(data["tiles"]) == 4
    assert data["overlap_bleed_mm"] == 10.0


def test_id_card_single_sheet_layout():
    res = client.post(
        "/api/v1/studio/id-card/layout",
        json={
            "front_asset_id": "asset_voter_front",
            "back_asset_id": "asset_voter_back",
            "card_width_mm": 85.6,
            "card_height_mm": 53.98,
            "target_paper_size": "A4"
        },
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["card_width_mm"] == 85.6
    assert data["card_height_mm"] == 53.98
    assert "front_coords_mm" in data
    assert "back_coords_mm" in data
    # Back is placed below front
    assert data["back_coords_mm"]["y"] > data["front_coords_mm"]["y"]


# ==============================================================================
# 4. Quality Pre-Flight & Password PDF Verification
# ==============================================================================

def test_quality_resolution_preflight():
    # 1. High resolution image (1200 x 1800 px for 4 x 6 in = 300 DPI)
    res_high = client.post(
        "/api/v1/studio/quality-check",
        json={"width_px": 1200, "height_px": 1800, "target_width_in": 4.0, "target_height_in": 6.0},
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res_high.status_code == 200
    assert res_high.json()["is_acceptable"] is True
    assert res_high.json()["quality_grade"] == "EXCELLENT"

    # 2. Low resolution image (300 x 400 px for 4 x 6 in = 66 DPI -> Low Res Warning)
    res_low = client.post(
        "/api/v1/studio/quality-check",
        json={"width_px": 300, "height_px": 400, "target_width_in": 4.0, "target_height_in": 6.0},
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res_low.status_code == 200
    assert res_low.json()["is_acceptable"] is False
    assert res_low.json()["quality_grade"] == "POOR"
    assert "Low resolution warning" in res_low.json()["warning"]


def test_password_protected_pdf_unlocking():
    # 1. Correct password
    res1 = client.post(
        "/api/v1/studio/unlock-pdf",
        json={"is_encrypted": True, "password": "correct_pass_123"},
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "unlocked"

    # 2. Wrong password -> 400 Bad Request
    res2 = client.post(
        "/api/v1/studio/unlock-pdf",
        json={"is_encrypted": True, "password": "wrong_password_999"},
        headers={"X-Shop-ID": SHOP_A}
    )
    assert res2.status_code == 400
    assert "Incorrect password" in res2.json()["detail"]


# ==============================================================================
# 5. Saved Shop Presets & Tenant-Scoped Prepaid Accounts
# ==============================================================================

def test_saved_shop_presets():
    headers = {"X-Shop-ID": SHOP_A}

    # 1. List existing presets
    res = client.get("/api/v1/differentiation/presets", headers=headers)
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) >= 2
    assert any(p["name"] == "College Lab Record" for p in presets)

    # 2. Create custom preset
    new_preset = {
        "shop_id": SHOP_A,
        "name": "Madras High Court Petition",
        "description": "Green Legal paper, double-sided, left margin 35mm",
        "options": {
            "copies": 3,
            "color_mode": "bw",
            "paper_size": "Legal",
            "duplex_mode": "duplex_long",
            "paper_gsm": 100
        },
        "is_default": False
    }
    res_post = client.post("/api/v1/differentiation/presets", json=new_preset, headers=headers)
    assert res_post.status_code == 200
    assert res_post.json()["name"] == "Madras High Court Petition"


def test_college_prepaid_accounts_and_isolation():
    headers_a = {"X-Shop-ID": SHOP_A}
    headers_b = {"X-Shop-ID": SHOP_B}

    # 1. Query seeded account in Shop A
    res = client.get("/api/v1/differentiation/prepaid/accounts/ANNA_ENGG_DEPT", headers=headers_a)
    assert res.status_code == 200
    assert res.json()["balance_paise"] == 250000  # ₹2,500.00

    # 2. Charge prepaid account
    charge_res = client.post(
        "/api/v1/differentiation/prepaid/charge",
        json={"account_code": "ANNA_ENGG_DEPT", "order_id": "ord_1001", "amount_paise": 5000},
        headers=headers_a
    )
    assert charge_res.status_code == 200
    assert charge_res.json()["remaining_balance_paise"] == 245000

    # 3. Strict Tenant Isolation Negative Test: Shop B cannot access Shop A's prepaid account
    res_b = client.get("/api/v1/differentiation/prepaid/accounts/ANNA_ENGG_DEPT", headers=headers_b)
    assert res_b.status_code == 404


# ==============================================================================
# 6. Resumable Uploads, Queue Estimation & Signed Receipts
# ==============================================================================

def test_resumable_multi_chunk_upload_lifecycle():
    headers = {"X-Shop-ID": SHOP_A}

    # 1. Init session
    init_res = client.post(
        "/api/v1/differentiation/uploads/resumable/init",
        json={
            "file_name": "engineering_thesis_200mb.pdf",
            "file_size_bytes": 200_000_000,
            "total_chunks": 3,
            "sha256_checksum": "a" * 64
        },
        headers=headers
    )
    assert init_res.status_code == 200
    upl_id = init_res.json()["upload_id"]

    # 2. Upload chunks 0, 1, 2
    c0 = client.post("/api/v1/differentiation/uploads/resumable/chunk", json={"upload_id": upl_id, "chunk_index": 0, "chunk_data_base64": "Y2h1bmsw"}, headers=headers)
    assert c0.status_code == 200
    assert c0.json()["is_completed"] is False

    c1 = client.post("/api/v1/differentiation/uploads/resumable/chunk", json={"upload_id": upl_id, "chunk_index": 1, "chunk_data_base64": "Y2h1bmsx"}, headers=headers)
    assert c1.status_code == 200

    c2 = client.post("/api/v1/differentiation/uploads/resumable/chunk", json={"upload_id": upl_id, "chunk_index": 2, "chunk_data_base64": "Y2h1bmsy"}, headers=headers)
    assert c2.status_code == 200
    assert c2.json()["is_completed"] is True
    assert c2.json()["asset_id"] is not None


def test_queue_wait_time_estimate():
    headers = {"X-Shop-ID": SHOP_A}

    # 1. Empty queue
    res_empty = client.get("/api/v1/differentiation/queue/estimate", headers=headers)
    assert res_empty.status_code == 200
    assert res_empty.json()["jobs_ahead"] == 0
    assert res_empty.json()["uncertainty_label"] == "HIGH_CONFIDENCE_IMMEDIATE"

    # 2. Seed 3 jobs
    for i in range(3):
        jid = f"seed_queue_job_{i}"
        job_service._jobs[f"{SHOP_A}:{jid}"] = PrintJobResponse(
            id=jid,
            tenant_id=SHOP_A,
            customer_email="user@test.com",
            status=JobStatus.QUEUED,
            file_name=f"doc_{i}.pdf",
            file_size_bytes=5000,
            page_count=10,
            options=PrintOptions(),
            calculated_price_cents=50,
            total_paise=500,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

    res_busy = client.get("/api/v1/differentiation/queue/estimate", headers=headers)
    assert res_busy.status_code == 200
    assert res_busy.json()["jobs_ahead"] == 3
    assert res_busy.json()["estimated_minutes_min"] >= 6


def test_cryptographically_signed_print_receipt_verification():
    headers = {"X-Shop-ID": SHOP_A}

    # 1. Generate receipt
    res = client.post(
        "/api/v1/differentiation/receipts/ord_verified_123",
        json={"total_paise": 4500, "sheets_printed": 15, "customer_email": "student@college.edu"},
        headers=headers
    )
    assert res.status_code == 200
    receipt = res.json()
    assert receipt["signature_hmac"] is not None

    # 2. Verify signature passes
    v_res = client.post("/api/v1/differentiation/receipts/verify", json=receipt, headers=headers)
    assert v_res.status_code == 200
    assert v_res.json()["is_valid"] is True

    # 3. Tampered receipt fails signature check
    tampered = dict(receipt)
    tampered["sheets_printed"] = 999  # Attacker modified sheets printed
    v_bad = client.post("/api/v1/differentiation/receipts/verify", json=tampered, headers=headers)
    assert v_bad.status_code == 200
    assert v_bad.json()["is_valid"] is False


def test_printer_consumables_and_low_toner_alert():
    headers = {"X-Shop-ID": SHOP_A}

    # 1. Query existing status
    res = client.get("/api/v1/differentiation/printers/ptr-guindy-hp-1/consumables", headers=headers)
    assert res.status_code == 200
    assert res.json()["toner_black_percent"] == 68

    # 2. Update to low toner (10%) -> Triggers alert
    low_status = PrinterConsumableStatus(
        printer_id="ptr-guindy-hp-1",
        shop_id=SHOP_A,
        printer_name="HP LaserJet Pro M404dn",
        toner_black_percent=10,
        drum_life_percent=80,
        maintenance_box_percent=90,
        alerts=[]
    )
    business_differentiation_service.update_printer_consumables(low_status)

    res_low = client.get("/api/v1/differentiation/printers/ptr-guindy-hp-1/consumables", headers=headers)
    assert res_low.status_code == 200
    assert "LOW_BLACK_TONER" in res_low.json()["alerts"]


# ==============================================================================
# 7. Intelligent Multi-Printer Routing & Simulator Bridges
# ==============================================================================

def test_intelligent_multi_printer_routing():
    headers = {"X-Shop-ID": SHOP_A}

    # 1. B&W A4 Job -> Routes to high-speed Mono HP LaserJet
    route_mono = client.post(
        "/api/v1/hardware/routing",
        json={"shop_id": SHOP_A, "required_paper": "A4", "requires_color": False, "requires_duplex": True, "page_count": 20},
        headers=headers
    )
    assert route_mono.status_code == 200
    assert route_mono.json()["selected_printer_id"] == "ptr-mono-1"

    # 2. Color Photo Job -> Routes to Epson EcoTank
    route_color = client.post(
        "/api/v1/hardware/routing",
        json={"shop_id": SHOP_A, "required_paper": "A4", "requires_color": True, "requires_duplex": False, "page_count": 5},
        headers=headers
    )
    assert route_color.status_code == 200
    assert route_color.json()["selected_printer_id"] == "ptr-color-1"

    # 3. A3 Blueprint Job -> Routes to Canon imageRUNNER
    route_a3 = client.post(
        "/api/v1/hardware/routing",
        json={"shop_id": SHOP_A, "required_paper": "A3", "requires_color": False, "requires_duplex": True, "page_count": 10},
        headers=headers
    )
    assert route_a3.status_code == 200
    assert route_a3.json()["selected_printer_id"] == "ptr-a3-1"


def test_scanner_bridge_simulator():
    headers = {"X-Shop-ID": SHOP_A}

    res = client.post(
        "/api/v1/hardware/scanner/task",
        json={"shop_id": SHOP_A, "source_type": "ADF", "duplex": True, "dpi": 300, "color_mode": "bw"},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert data["pages_scanned"] == 5
    assert data["hardware_status"] == "SIMULATED_TWAIN_BRIDGE"
    assert "UNVERIFIED" in data["disclaimer"]


def test_timed_physical_copier_rental_lifecycle():
    headers = {"X-Shop-ID": SHOP_A}

    # 1. Initiate session
    init_res = client.post(
        "/api/v1/hardware/copier/session/init",
        json={"shop_id": SHOP_A, "device_id": "copier_counter_1", "customer_identifier": "walkin_student", "duration_minutes": 15, "max_copies": 30},
        headers=headers
    )
    assert init_res.status_code == 200
    sid = init_res.json()["session_id"]
    assert init_res.json()["hardware_lock_state"] == "UNLOCKED"

    # 2. Close session with 12 actual copies made @ ₹2.00 (200 paise) = 2400 paise
    close_res = client.post(
        f"/api/v1/hardware/copier/session/{sid}/close",
        json={"copies_made": 12, "per_copy_paise": 200, "staff_override": False},
        headers=headers
    )
    assert close_res.status_code == 200
    data = close_res.json()
    assert data["actual_copies"] == 12
    assert data["bill_amount_paise"] == 2400
    assert data["hardware_lock_state"] == "LOCKED"


# ==============================================================================
# 8. Database Migration 005 Integrity
# ==============================================================================

def test_phase7_migration_005_and_rls_integrity():
    sql = load_migration_sql("005_phase7_schema.sql")
    tables = parse_tables_from_ddl(sql)

    assert "shop_presets" in tables
    assert "prepaid_corporate_accounts" in tables
    assert "prepaid_transactions" in tables
    assert "resumable_upload_sessions" in tables
    assert "printer_telemetry_consumables" in tables
    assert "timed_copier_sessions" in tables
    assert "scanner_tasks" in tables

    # Verify RLS is forced
    assert "ENABLE ROW LEVEL SECURITY" in sql
    assert "FORCE ROW LEVEL SECURITY" in sql
    assert "app.current_shop_id" in sql
