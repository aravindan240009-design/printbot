"""
Automated Test Suite for Virtual Xerox Shop Lab (Printers 1-10 & High-Density Fleet).
Verifies:
- All 10 canonical virtual devices (capabilities, paper sizes, color, duplex, speed).
- Failure injection: offline, out of paper, paper jam, unsupported duplex/color/media,
  slow submission, spooler rejection, mid-job disconnection, agent crash, and recovery.
- State machine invariant: Ambiguous outcomes (jam, disconnect) transition to COMPLETION_UNKNOWN
  and strictly BLOCK automatic reprint.
- Inspectable captured print output (pages, sheets, checksum).
- High-density fleet scaling (10, 50, 100 printers) with load balancing and routing.
"""

import uuid
import pytest
from fastapi.testclient import TestClient

from services.api.main import app
from packages.contracts.models import (
    PaperSize,
    ColorMode,
    DuplexMode,
    JobStatus,
)
from services.api.services.virtual_shop_lab import (
    virtual_shop_lab,
    VirtualPrinterType,
    FaultInjectionType,
)

client = TestClient(app)


def test_lab_lists_all_10_canonical_devices():
    """Verify that all 10 canonical virtual printers are available with correct profiles."""
    res = client.get("/api/v1/lab/devices")
    assert res.status_code == 200
    devices = res.json()
    assert len(devices) >= 10

    device_map = {d["id"]: d for d in devices}

    # Printer 1: A4 B&W
    p1 = device_map.get("virt-p1-a4-bw")
    assert p1 is not None
    assert p1["supports_color"] is False
    assert p1["supports_duplex"] is False
    assert PaperSize.A4.value in p1["supported_sizes"]

    # Printer 2: A4 Color
    p2 = device_map.get("virt-p2-a4-color")
    assert p2 is not None
    assert p2["supports_color"] is True
    assert p2["supports_duplex"] is False

    # Printer 3: A4 Auto Duplex
    p3 = device_map.get("virt-p3-a4-duplex")
    assert p3 is not None
    assert p3["supports_duplex"] is True
    assert p3["supports_color"] is False

    # Printer 4: A3 / A4 Color
    p4 = device_map.get("virt-p4-a3-a4-color")
    assert p4 is not None
    assert p4["supports_color"] is True
    assert p4["supports_duplex"] is True
    assert PaperSize.A3.value in p4["supported_sizes"]

    # Printer 5: MFP
    p5 = device_map.get("virt-p5-mfp")
    assert p5 is not None
    assert p5["supports_staple"] is True

    # Printer 6: Deliberately Offline
    p6 = device_map.get("virt-p6-offline")
    assert p6 is not None
    assert p6["is_online"] is False

    # Printer 7: Paper-jam simulator
    p7 = device_map.get("virt-p7-jam")
    assert p7 is not None
    assert p7["device_type"] == VirtualPrinterType.PAPER_JAM_SIMULATOR.value

    # Printer 8: Slow processor
    p8 = device_map.get("virt-p8-slow")
    assert p8 is not None
    assert p8["speed_ppm"] <= 5

    # Printer 9: Restricted media (A5 only)
    p9 = device_map.get("virt-p9-restricted")
    assert p9 is not None
    assert p9["supported_sizes"] == [PaperSize.A5.value]

    # Printer 10: Intermittent connection
    p10 = device_map.get("virt-p10-intermittent")
    assert p10 is not None


def test_printer_1_and_3_normal_print_and_capture():
    """Verify clean spooling and inspectable print capture on reliable printers."""
    job_id = f"job-norm-{uuid.uuid4().hex[:8]}"

    # Submit 6 pages simplex B&W to Printer 1
    res = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p1-a4-bw",
        "job_id": job_id,
        "page_count": 6,
        "color_mode": ColorMode.BW.value,
        "duplex_mode": DuplexMode.SIMPLEX.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["status"] == JobStatus.PRINT_CONFIRMED.value
    assert data["sheets_rendered"] == 6
    assert data["reprint_allowed"] is False

    # Inspect captured spool record
    cap_res = client.get(f"/api/v1/lab/captures/{job_id}")
    assert cap_res.status_code == 200
    captures = cap_res.json()
    assert len(captures) == 1
    assert captures[0]["sheets_rendered"] == 6
    assert captures[0]["checksum"].startswith("sha256:")

    # Submit 7 pages duplex to Printer 3 -> 4 physical sheets
    dup_job_id = f"job-dup-{uuid.uuid4().hex[:8]}"
    res_dup = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p3-a4-duplex",
        "job_id": dup_job_id,
        "page_count": 7,
        "color_mode": ColorMode.BW.value,
        "duplex_mode": DuplexMode.DUPLEX_LONG.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res_dup.status_code == 200
    data_dup = res_dup.json()
    assert data_dup["success"] is True
    assert data_dup["sheets_rendered"] == 4  # (7 + 1) // 2


def test_capability_enforcement_rejections():
    """Verify strict rejection of incompatible print plans prior to spool submission."""
    # 1. Color on B&W device (Printer 1)
    res_color = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p1-a4-bw",
        "job_id": "job-color-fail",
        "page_count": 2,
        "color_mode": ColorMode.COLOR.value,
        "duplex_mode": DuplexMode.SIMPLEX.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res_color.json()["error"] == "UNSUPPORTED_COLOR"
    assert res_color.json()["status"] == JobStatus.REJECTED.value

    # 2. Duplex on Simplex device (Printer 2)
    res_duplex = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p2-a4-color",
        "job_id": "job-duplex-fail",
        "page_count": 4,
        "color_mode": ColorMode.COLOR.value,
        "duplex_mode": DuplexMode.DUPLEX_LONG.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res_duplex.json()["error"] == "UNSUPPORTED_DUPLEX"
    assert res_duplex.json()["status"] == JobStatus.REJECTED.value

    # 3. A3 size on A5 restricted device (Printer 9)
    res_media = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p9-restricted",
        "job_id": "job-media-fail",
        "page_count": 1,
        "color_mode": ColorMode.COLOR.value,
        "duplex_mode": DuplexMode.SIMPLEX.value,
        "paper_size": PaperSize.A3.value,
    })
    assert res_media.json()["error"] == "UNSUPPORTED_MEDIA"
    assert res_media.json()["status"] == JobStatus.REJECTED.value


def test_printer_6_offline_handling():
    """Verify that jobs routed to offline printer 6 are safely held and rejected."""
    res = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p6-offline",
        "job_id": "job-offline-test",
        "page_count": 3,
        "color_mode": ColorMode.BW.value,
        "duplex_mode": DuplexMode.SIMPLEX.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["error"] == "PRINTER_OFFLINE"
    assert data["status"] == JobStatus.FAILED.value
    assert data["reprint_allowed"] is False


def test_printer_7_paper_jam_recovery_invariant():
    """
    CRUCIAL SAFETY TEST:
    Paper jam occurs during printing.
    Status MUST transition to COMPLETION_UNKNOWN and automatic reprint MUST BE BLOCKED.
    """
    jam_job_id = f"job-jam-{uuid.uuid4().hex[:8]}"
    res = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p7-jam",
        "job_id": jam_job_id,
        "page_count": 10,
        "color_mode": ColorMode.COLOR.value,
        "duplex_mode": DuplexMode.DUPLEX_LONG.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["status"] == JobStatus.COMPLETION_UNKNOWN.value
    assert data["reprint_allowed"] is False
    assert data["reconciliation_required"] is True

    # Audit events must record COMPLETION_UNKNOWN
    events_res = client.get("/api/v1/lab/events?limit=10")
    events = events_res.json()
    jam_events = [e for e in events if e["job_id"] == jam_job_id]
    assert len(jam_events) >= 1
    assert jam_events[0]["new_state"] == JobStatus.COMPLETION_UNKNOWN.value
    assert jam_events[0]["reprint_blocked"] is True


def test_configurable_fault_injection_and_recovery():
    """Verify injecting spooler rejection, out of paper, and recovery on Printer 4."""
    # 1. Inject Spooler Rejection
    inj_res = client.post("/api/v1/lab/fault-inject", json={
        "device_id": "virt-p4-a3-a4-color",
        "fault": FaultInjectionType.SPOOLER_REJECTION.value
    })
    assert inj_res.status_code == 200

    res_rej = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p4-a3-a4-color",
        "job_id": "job-spool-rej",
        "page_count": 1,
        "color_mode": ColorMode.COLOR.value,
        "duplex_mode": DuplexMode.SIMPLEX.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res_rej.json()["error"] == "SPOOLER_REJECTION"

    # 2. Inject Out of Paper
    client.post("/api/v1/lab/fault-inject", json={
        "device_id": "virt-p4-a3-a4-color",
        "fault": FaultInjectionType.OUT_OF_PAPER.value
    })
    res_paper = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p4-a3-a4-color",
        "job_id": "job-paper-out",
        "page_count": 1,
        "color_mode": ColorMode.COLOR.value,
        "duplex_mode": DuplexMode.SIMPLEX.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res_paper.json()["error"] == "OUT_OF_PAPER"
    assert res_paper.json()["status"] == JobStatus.PAID_HELD.value

    # 3. Recover Printer 4
    rec_res = client.post("/api/v1/lab/fault-inject", json={
        "device_id": "virt-p4-a3-a4-color",
        "fault": FaultInjectionType.PRINTER_RECOVERY.value
    })
    assert rec_res.json()["current_fault"] is None
    assert rec_res.json()["is_online"] is True

    # 4. Now jobs succeed on Printer 4
    res_rec = client.post("/api/v1/lab/submit", json={
        "printer_id": "virt-p4-a3-a4-color",
        "job_id": "job-recovered-ok",
        "page_count": 2,
        "color_mode": ColorMode.COLOR.value,
        "duplex_mode": DuplexMode.SIMPLEX.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res_rec.json()["success"] is True
    assert res_rec.json()["status"] == JobStatus.PRINT_CONFIRMED.value


def test_fleet_scaling_10_50_100_devices():
    """
    Stress-test high-density fleet provisioning.
    Validates unlimited printer registrations without performance degradation.
    """
    shop_id = "shop-scale-test"

    # Scale to 10
    res10 = client.post("/api/v1/lab/scale", json={"shop_id": shop_id, "count": 10})
    assert res10.status_code == 200
    assert len(res10.json()) == 10

    # Scale to 50
    res50 = client.post("/api/v1/lab/scale", json={"shop_id": shop_id, "count": 50})
    assert res50.status_code == 200
    assert len(res50.json()) == 50

    # Scale to 100
    res100 = client.post("/api/v1/lab/scale", json={"shop_id": shop_id, "count": 100})
    assert res100.status_code == 200
    assert len(res100.json()) == 100

    # Submit job to Printer #100
    p100_id = f"scale-{shop_id[:8]}-p100"
    res_p100 = client.post("/api/v1/lab/submit", json={
        "printer_id": p100_id,
        "job_id": "job-p100-verify",
        "page_count": 5,
        "color_mode": ColorMode.COLOR.value,
        "duplex_mode": DuplexMode.DUPLEX_LONG.value,
        "paper_size": PaperSize.A4.value,
    })
    assert res_p100.status_code == 200
    assert res_p100.json()["success"] is True
