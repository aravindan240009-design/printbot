"""
Tests for Unlimited Printers Discovery and Capability Snapshot Ingestion.
Enforces the non-negotiable contract: UNLIMITED printers per subscribed shop.
"""

from fastapi.testclient import TestClient
from services.api.main import app

client = TestClient(app)
SHOP_A = "11111111-1111-1111-1111-111111111111"


def test_unlimited_printers_snapshot_sync():
    # Simulate a print shop workstation discovering 15 physical and network printers
    mock_printers = [
        {
            "printer_id": f"prn_workhorse_{i}",
            "name": f"Canon High-Volume Printer #{i}",
            "driver_name": "Canon Generic Plus UFR II",
            "port_name": f"192.168.1.{100 + i}",
            "is_online": True,
            "supports_color": i % 2 == 0,
            "supports_duplex": True,
            "supported_paper_sizes": ["A4", "A3"] if i % 2 == 0 else ["A4"]
        }
        for i in range(1, 16)
    ]

    res = client.post(
        "/api/v1/printers/snapshots",
        json={
            "device_id": "ws-chennai-01",
            "printers": mock_printers
        },
        headers={"X-Shop-ID": SHOP_A}
    )

    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "synchronized"
    assert data["shop_id"] == SHOP_A
    assert data["discovered_printers_count"] == 15
    assert data["unlimited_quota"] is True
