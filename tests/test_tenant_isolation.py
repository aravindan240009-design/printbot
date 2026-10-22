import pytest
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.services.job_service import job_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_job_store():
    job_service.clear()


def test_tenant_isolation_boundary():
    tenant_a = "tenant-north-station"
    tenant_b = "tenant-south-station"

    # 1. Tenant A creates an order
    order_payload = {
        "file_name": "Confidential_Quarterly_Report.pdf",
        "file_size_bytes": 1024000,
        "page_count": 10,
        "options": {
            "copies": 1,
            "color_mode": "bw",
            "paper_size": "A4",
            "duplex_mode": "simplex",
            "orientation": "portrait",
            "binding": "none",
            "paper_gsm": 75
        },
        "customer_email": "ceo@tenant-a.com"
    }

    res_a = client.post(
        "/api/v1/orders",
        json=order_payload,
        headers={"X-Tenant-ID": tenant_a}
    )
    assert res_a.status_code == 201
    job_a_id = res_a.json()["id"]

    # 2. Tenant A can view its own order
    read_a = client.get(
        f"/api/v1/orders/{job_a_id}",
        headers={"X-Tenant-ID": tenant_a}
    )
    assert read_a.status_code == 200
    assert read_a.json()["customer_email"] == "ceo@tenant-a.com"

    # 3. Tenant B MUST NOT be able to view Tenant A's order (Expect 404)
    read_b = client.get(
        f"/api/v1/orders/{job_a_id}",
        headers={"X-Tenant-ID": tenant_b}
    )
    assert read_b.status_code == 404
    assert f"Job '{job_a_id}' not found for tenant '{tenant_b}'" in read_b.json()["detail"]

    # 4. Tenant B's order list MUST NOT contain Tenant A's order
    list_b = client.get(
        "/api/v1/orders",
        headers={"X-Tenant-ID": tenant_b}
    )
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0


def test_missing_tenant_header_rejected():
    # Requests without mandatory X-Tenant-ID header on protected routes must be rejected (400)
    res = client.get("/api/v1/orders")
    assert res.status_code == 400
    assert "Missing mandatory 'X-Tenant-ID' header" in res.json()["detail"]
