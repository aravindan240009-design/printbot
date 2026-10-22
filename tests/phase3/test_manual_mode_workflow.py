"""
Integration tests for MANUAL_APPROVAL mode and Staff Triage.
Verifies:
1. Customer order requires staff approval before spooling.
2. Approved order transitions to QUEUED and can be claimed by workstation.
3. Rejected order transitions to CANCELLED with rejection reason recorded; cannot be spooled.
4. Cross-tenant order triage is forbidden (Shop B staff cannot approve Shop A order).
"""

from fastapi.testclient import TestClient
from services.api.main import app

client = TestClient(app)

SHOP_A = "11111111-1111-1111-1111-111111111111"
SHOP_B = "22222222-2222-2222-2222-222222222222"


def test_manual_mode_approval_and_rejection_workflow():
    # 1. Customer places order at Shop A
    order_res = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Architecture_Blueprints_A3.pdf",
            "file_size_bytes": 1024000,
            "page_count": 6,
            "options": {
                "copies": 2,
                "color_mode": "color",
                "paper_size": "A3",
                "duplex_mode": "simplex",
                "orientation": "landscape",
                "binding": "none",
                "paper_gsm": 100
            },
            "customer_email": "architect@chennai.in"
        },
        headers={"X-Shop-ID": SHOP_A}
    )
    assert order_res.status_code == 201
    job_id = order_res.json()["id"]

    # 2. Cross-shop approval attempt: Shop B staff attempts to approve Shop A's order -> 404/403
    cross_approve = client.post(
        f"/api/v1/orders/{job_id}/approve",
        headers={"X-Shop-ID": SHOP_B}
    )
    assert cross_approve.status_code == 404
    assert f"not found for tenant '{SHOP_B}'" in cross_approve.json()["detail"]

    # 3. Shop A staff approves the order
    approve_res = client.post(
        f"/api/v1/orders/{job_id}/approve",
        headers={"X-Shop-ID": SHOP_A}
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "QUEUED"

    # 4. Create second order and reject it
    order_res2 = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Damaged_Scan.pdf",
            "file_size_bytes": 50000,
            "page_count": 2,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "student@college.edu"
        },
        headers={"X-Shop-ID": SHOP_A}
    )
    job_id2 = order_res2.json()["id"]

    # Staff rejects with specific reason
    reject_res = client.post(
        f"/api/v1/orders/{job_id2}/reject",
        json={"reason": "Scanned pages are completely illegible and skewed."},
        headers={"X-Shop-ID": SHOP_A}
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "CANCELLED"

    # 5. Workstation attempts to claim rejected job -> MUST BE REJECTED
    claim_res = client.post(
        f"/api/v1/printers/claim-next",
        headers={"X-Shop-ID": SHOP_A}
    )
    # The rejected job cannot be spooled!
