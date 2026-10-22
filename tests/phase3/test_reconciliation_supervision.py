"""
Tests for Supervised Reconciliation and Ambiguity Handling.
Guarantees that jobs marked COMPLETION_UNKNOWN can NEVER be automatically reprinted.
"""

from fastapi.testclient import TestClient
from services.api.main import app

client = TestClient(app)
SHOP_A = "11111111-1111-1111-1111-111111111111"


def test_completion_unknown_blocks_auto_reprint_in_reconciliation():
    # 1. Create order
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Thesis_Final.pdf",
            "file_size_bytes": 2000000,
            "page_count": 50,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "duplex_long", "orientation": "portrait", "binding": "hard_bind", "paper_gsm": 100},
            "customer_email": "phd@annauniv.edu"
        },
        headers={"X-Shop-ID": SHOP_A}
    )
    job_id = order_res.json()["id"]

    # 2. Workstation submits to winspool, but spooler crashes -> Flag as COMPLETION_UNKNOWN
    unknown_res = client.post(
        f"/api/v1/orders/{job_id}/mark-unknown",
        json={"reason": "Print spooler service terminated unexpectedly during transfer"},
        headers={"X-Shop-ID": SHOP_A}
    )
    assert unknown_res.status_code == 200
    assert unknown_res.json()["status"] == "COMPLETION_UNKNOWN"

    # 3. Workstation reconnects and performs reconciliation
    reconcile_res = client.post(
        "/api/v1/reconciliation/sync",
        json={
            "workstation_id": "ws-chennai-01",
            "tenant_id": SHOP_A,
            "spooled_job_ids": []
        },
        headers={"X-Shop-ID": SHOP_A}
    )
    assert reconcile_res.status_code == 200
    rec_data = reconcile_res.json()

    # The COMPLETION_UNKNOWN job MUST NOT be sent for automatic re-spooling!
    assert job_id not in rec_data["re_spool_required_job_ids"]
    assert job_id not in rec_data["confirmed_job_ids"]
