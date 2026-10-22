import pytest
from fastapi.testclient import TestClient
from services.api.main import app
from services.api.services.job_service import job_service
from packages.contracts.models import JobStatus

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_job_store():
    job_service.clear()


def test_safe_print_job_reconciliation():
    tenant_id = "tenant-downtown"
    workstation_id = "ws-counter-01"

    # 1. Create two jobs in the cloud
    order1 = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Job1_Brochure.pdf",
            "file_size_bytes": 100000,
            "page_count": 4,
            "options": {"copies": 1, "color_mode": "color", "paper_size": "A4", "duplex_mode": "simplex", "orientation": "portrait", "binding": "none", "paper_gsm": 75},
            "customer_email": "c1@test.com"
        },
        headers={"X-Tenant-ID": tenant_id}
    ).json()

    order2 = client.post(
        "/api/v1/orders",
        json={
            "file_name": "Job2_Contract.pdf",
            "file_size_bytes": 150000,
            "page_count": 8,
            "options": {"copies": 1, "color_mode": "bw", "paper_size": "A4", "duplex_mode": "duplex_long", "orientation": "portrait", "binding": "staple", "paper_gsm": 75},
            "customer_email": "c2@test.com"
        },
        headers={"X-Tenant-ID": tenant_id}
    ).json()

    # Move both to QUEUED
    job_service.mark_paid(tenant_id, order1["id"], "pi_mock_1")
    job_service.mark_paid(tenant_id, order2["id"], "pi_mock_2")

    # 2. Workstation spooled Job1 while online, then network dropped.
    # When network recovers, workstation calls reconciliation sync
    reconcile_req = {
        "workstation_id": workstation_id,
        "tenant_id": tenant_id,
        "spooled_job_ids": [order1["id"]]
    }

    sync_res = client.post(
        "/api/v1/reconciliation/sync",
        json=reconcile_req,
        headers={"X-Tenant-ID": tenant_id}
    )
    assert sync_res.status_code == 200
    sync_data = sync_res.json()

    # Job 1 must be confirmed (NEVER re-spooled!)
    assert order1["id"] in sync_data["confirmed_job_ids"]
    assert order1["id"] not in sync_data["re_spool_required_job_ids"]

    # Job 2 was never spooled, so it is in re_spool_required_job_ids
    assert order2["id"] in sync_data["re_spool_required_job_ids"]

    # 3. Cloud status of Job 1 is now PRINTING, not QUEUED
    job1_updated = client.get(f"/api/v1/orders/{order1['id']}", headers={"X-Tenant-ID": tenant_id}).json()
    assert job1_updated["status"] == "PRINTING"
