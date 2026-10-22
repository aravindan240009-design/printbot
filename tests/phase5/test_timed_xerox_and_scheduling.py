"""
Phase 5 Tests: Timed Print/Copy Scheduling, Physical Xerox & Shop Operations.
Verifies:
1. Four distinct service types with explicit customer explanations (physical originals vs digital).
2. Concurrency slot locking: prevents overbooking when slot reaches capacity (409 Conflict).
3. Physical Xerox estimate revision: staff verifies real paper count at counter and updates quote.
4. Counter check-in with 4-digit pickup code / PIN.
5. Scheduled print worker dispatch (respects time window and device online health).
6. Timed self-service copier flag: blocks session when hardware is unverified.
7. Shop A and Shop B booking tenant isolation.
8. Day view timeline and on-time KPI tracking.
9. Phone camera scan-to-PDF multi-page capture.
"""

import io
import base64
from datetime import datetime, timedelta
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from services.api.main import app
from services.api.services.catalogue_service import catalogue_service
from services.api.services.scheduling_service import scheduling_service
from services.api.services.job_service import job_service
from services.api.services.device_service import device_service
from services.api.services.subscription_service import subscription_service
from services.api.services.shop_service import shop_service
from packages.contracts.models import ServiceType, BookingStatus, OrderMode, JobStatus

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"
SHOP_B = "22222222-2222-2222-2222-222222222222"


@pytest.fixture(autouse=True)
def clean_scheduling_state():
    scheduling_service.clear()
    catalogue_service.clear()
    job_service.clear()
    device_service.clear()
    subscription_service.clear()
    shop_service.clear()


def test_four_service_types_and_physical_original_explanation():
    """Verifies all service types and ensures customer is clearly told when bringing paper originals is required."""
    slot_time = (datetime.utcnow() + timedelta(hours=2)).replace(minute=0, second=0, microsecond=0)

    # 1. Physical Xerox Booking: customer brings real paper
    physical_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "PHYSICAL_XEROX_BOOKING",
            "slot_start": slot_time.isoformat(),
            "customer_email": "walkin@xerox.in",
            "estimated_pages": 15,
            "copies": 2,
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert physical_res.status_code == 201
    p_data = physical_res.json()
    assert p_data["is_physical_originals_required"] is True
    assert "Physical paper originals required" in p_data["human_instruction"]
    assert len(p_data["pickup_code"]) == 4

    # 2. Schedule Print: digital document uploaded
    schedule_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "SCHEDULE_PRINT",
            "slot_start": (slot_time + timedelta(minutes=15)).isoformat(),
            "customer_email": "student@annauniv.edu",
            "estimated_pages": 5,
            "copies": 1,
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert schedule_res.status_code == 201
    s_data = schedule_res.json()
    assert s_data["is_physical_originals_required"] is False
    assert "automatically printed" in s_data["human_instruction"]

    # 3. Ready-By / Pickup Slot
    ready_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "READY_BY_SLOT",
            "slot_start": (slot_time + timedelta(minutes=30)).isoformat(),
            "customer_email": "lawyer@court.in",
            "estimated_pages": 20,
            "copies": 1,
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert ready_res.status_code == 201
    assert ready_res.json()["is_physical_originals_required"] is False
    assert "guaranteed ready" in ready_res.json()["human_instruction"]

    # 4. Timed Self-Service Copier: feature flag disabled until hardware validated
    copier_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "TIMED_SELF_SERVICE_COPIER",
            "slot_start": (slot_time + timedelta(minutes=45)).isoformat(),
            "customer_email": "user@kiosk.in",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert copier_res.status_code == 400
    assert "unverified" in copier_res.json()["detail"].lower()


def test_concurrency_overbooking_prevention():
    """
    Shop capacity per slot is 4.
    Four customers successfully reserve slot.
    The 5th customer racing for the same slot is rejected with 409 Conflict.
    """
    cat = catalogue_service.get_catalogue(SHOP_A)
    cat.capacity_per_slot = 4

    slot_time = (datetime.utcnow() + timedelta(hours=3)).replace(minute=0, second=0, microsecond=0)

    # 4 concurrent bookings
    for i in range(4):
        res = client.post(
            "/api/v1/bookings",
            json={
                "shop_id": SHOP_A,
                "service_type": "READY_BY_SLOT",
                "slot_start": slot_time.isoformat(),
                "customer_email": f"cust_{i}@test.com",
            },
            headers={"X-Shop-ID": SHOP_A},
        )
        assert res.status_code == 201

    # 5th booking must fail with 409
    overbook_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "READY_BY_SLOT",
            "slot_start": slot_time.isoformat(),
            "customer_email": "cust_overbook@test.com",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert overbook_res.status_code == 409
    assert "maximum capacity" in overbook_res.json()["detail"]


def test_physical_xerox_estimate_revision_by_staff():
    """Customer estimates 10 pages; staff at counter counts 18 pages and updates quote."""
    slot_time = (datetime.utcnow() + timedelta(hours=2)).isoformat()

    booking_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "PHYSICAL_XEROX_BOOKING",
            "slot_start": slot_time,
            "customer_email": "guest@shop.in",
            "estimated_pages": 10,
            "copies": 1,
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    booking_id = booking_res.json()["id"]
    initial_paise = booking_res.json()["quoted_paise"]

    # Staff counts 18 pages at counter
    revise_res = client.post(
        f"/api/v1/bookings/{booking_id}/revise-estimate",
        json={
            "revised_pages": 18,
            "staff_id": "operator_ramesh@anna.in",
            "reason": "Customer included supplementary annexure pages",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert revise_res.status_code == 200
    r_data = revise_res.json()
    assert r_data["revised_pages"] == 18
    assert r_data["revised_paise"] > initial_paise


def test_counter_check_in_with_pickup_code():
    """Customer arrives at counter and checks in using 4-digit PIN."""
    slot_time = (datetime.utcnow() + timedelta(hours=1)).isoformat()

    booking_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "PHYSICAL_XEROX_BOOKING",
            "slot_start": slot_time,
            "customer_email": "pin_tester@anna.in",
            "estimated_pages": 5,
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    booking_id = booking_res.json()["id"]
    pin = booking_res.json()["pickup_code"]

    # Wrong PIN fails
    bad_res = client.post(
        f"/api/v1/bookings/{booking_id}/check-in",
        json={"pickup_code": "0000"},
        headers={"X-Shop-ID": SHOP_A},
    )
    assert bad_res.status_code == 401

    # Correct PIN succeeds
    good_res = client.post(
        f"/api/v1/bookings/{booking_id}/check-in",
        json={"pickup_code": pin},
        headers={"X-Shop-ID": SHOP_A},
    )
    assert good_res.status_code == 200
    assert good_res.json()["status"] == "CHECKED_IN"


def test_scheduled_print_dispatch_worker():
    """Worker dispatches SCHEDULE_PRINT when scheduled window arrives."""
    device_service.set_device_online_status(SHOP_B, True)

    # 1. Create order
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Scheduled_Report.pdf",
            "file_size_bytes": 100000,
            "page_count": 5,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "sched@company.in",
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    job_id = order_res.json()["id"]

    # 2. Create SCHEDULE_PRINT booking within 10 minutes of now
    now = datetime.utcnow()
    slot_time = now + timedelta(minutes=5)

    booking_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_B,
            "service_type": "SCHEDULE_PRINT",
            "slot_start": slot_time.isoformat(),
            "customer_email": "sched@company.in",
            "order_id": job_id,
        },
        headers={"X-Shop-ID": SHOP_B},
    )
    booking_id = booking_res.json()["id"]

    # 3. Run scheduled dispatch worker
    dispatch_res = client.post("/api/v1/bookings/dispatch-scheduled-prints", headers={"X-Shop-ID": SHOP_B})
    assert dispatch_res.status_code == 200
    assert dispatch_res.json()["dispatched_count"] >= 1
    assert booking_id in dispatch_res.json()["booking_ids"]

    # Verify order transitioned to QUEUED
    job_check = client.get(f"/api/v1/orders/{job_id}", headers={"X-Shop-ID": SHOP_B})
    assert job_check.json()["status"] == "QUEUED"


def test_shop_day_view_and_kpi():
    """Admin day view returns slot timeline and on-time performance percentage."""
    now = datetime.utcnow()
    date_str = now.strftime("%Y-%m-%d")
    slot_time = (now + timedelta(hours=2)).isoformat()

    booking_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "READY_BY_SLOT",
            "slot_start": slot_time,
            "customer_email": "kpi_user@anna.in",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    booking_id = booking_res.json()["id"]

    # Complete the booking
    client.post(f"/api/v1/bookings/{booking_id}/complete", headers={"X-Shop-ID": SHOP_A})

    # Retrieve day view
    day_res = client.get(f"/api/v1/bookings/day-view?date={date_str}", headers={"X-Shop-ID": SHOP_A})
    assert day_res.status_code == 200
    data = day_res.json()
    assert data["date"] == date_str
    assert data["completed"] >= 1
    assert data["on_time_kpi_pct"] > 0.0


def test_cross_tenant_booking_isolation():
    """Shop B cannot view or modify Shop A's bookings."""
    slot_time = (datetime.utcnow() + timedelta(hours=2)).isoformat()

    booking_res = client.post(
        "/api/v1/bookings",
        json={
            "shop_id": SHOP_A,
            "service_type": "PHYSICAL_XEROX_BOOKING",
            "slot_start": slot_time,
            "customer_email": "secret@shop-a.in",
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    b_id = booking_res.json()["id"]

    # Shop B attempts to get Shop A booking
    cross_res = client.get(f"/api/v1/bookings/{b_id}", headers={"X-Shop-ID": SHOP_B})
    assert cross_res.status_code == 404


def test_phone_camera_scan_to_pdf_pipeline():
    """Customer captures pages with phone camera; server rotates and compiles valid PDF."""
    # Create two synthetic image frames
    img1 = Image.new("RGB", (600, 800), color="white")
    buf1 = io.BytesIO()
    img1.save(buf1, format="JPEG")
    b64_1 = base64.b64encode(buf1.getvalue()).decode("utf-8")

    img2 = Image.new("RGB", (600, 800), color="white")
    buf2 = io.BytesIO()
    img2.save(buf2, format="JPEG")
    b64_2 = base64.b64encode(buf2.getvalue()).decode("utf-8")

    capture_res = client.post(
        "/api/v1/documents/phone-capture",
        json={
            "shop_id": SHOP_A,
            "images_base64": [b64_1, b64_2],
            "rotate_degrees": 90,
            "target_dpi": 200,
        },
        headers={"X-Shop-ID": SHOP_A},
    )
    assert capture_res.status_code == 200
    data = capture_res.json()
    assert data["page_count"] == 2
    assert data["file_size_bytes"] > 0
    assert data["legibility_confirmed"] is True
    assert data["pdf_url"].startswith("/api/v1/assets/")
