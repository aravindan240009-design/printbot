import asyncio

import httpx
import pytest
from fastapi.testclient import TestClient

from services.api.main import app
from services.api.routers import superadmin as superadmin_router
from services.api.core.config import settings
from services.api.services.dispatch_admin_service import (
    clear_all_dispatch_orders,
)


def test_clear_all_dispatch_orders_deletes_only_order_rows():
    captured_requests = []

    def handle_request(request: httpx.Request) -> httpx.Response:
        captured_requests.append(request)
        return httpx.Response(200, json=[{"id": "PB-123"}, {"id": "PB-456"}])

    async def run_delete() -> int:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(handle_request),
        ) as client:
            return await clear_all_dispatch_orders(
                client,
                "https://example.supabase.co",
                "server-only-key",
            )

    deleted_count = asyncio.run(run_delete())

    assert deleted_count == 2
    request = captured_requests[0]
    assert request.method == "DELETE"
    assert request.url.path == "/rest/v1/pilot_applications"
    assert request.url.params["select"] == "id"
    assert request.url.params["or"] == "(plan.eq.ORDER,status.like.ORDER_*,id.like.PB-*)"
    assert request.headers["apikey"] == "server-only-key"


def test_clear_all_dispatch_orders_rejects_invalid_supabase_response():
    def handle_request(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"deleted": 2})

    async def run_delete() -> int:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(handle_request),
        ) as client:
            return await clear_all_dispatch_orders(
                client,
                "https://example.supabase.co",
                "server-only-key",
            )

    with pytest.raises(ValueError, match="invalid dispatch deletion response"):
        asyncio.run(run_delete())


def test_clear_all_dispatch_orders_uses_archive_when_applications_is_a_view():
    captured_requests = []

    def handle_request(request: httpx.Request) -> httpx.Response:
        captured_requests.append(request)
        if request.method == "DELETE" and request.url.path.endswith("/pilot_applications"):
            return httpx.Response(405, json={"message": "view is not writable"})
        if request.method == "DELETE" and request.url.path.endswith("/pilot_applications_historical_archive"):
            return httpx.Response(200, json=[{"id": "PB-123"}])
        raise AssertionError(f"Unexpected request: {request.method} {request.url}")

    async def run_delete() -> int:
        async with httpx.AsyncClient(
            transport=httpx.MockTransport(handle_request),
        ) as client:
            return await clear_all_dispatch_orders(
                client,
                "https://example.supabase.co",
                "server-only-key",
            )

    assert asyncio.run(run_delete()) == 1
    assert [request.url.path.rsplit("/", 1)[-1] for request in captured_requests] == [
        "pilot_applications",
        "pilot_applications_historical_archive",
    ]


def test_global_dispatch_clear_requires_supabase_server_configuration(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "")
    monkeypatch.setattr(superadmin_router.device_service, "validate_device_token", lambda _: ("device-1", "shop-1"))
    response = TestClient(app).post(
        "/api/v1/superadmin/dispatch/clear",
        headers={"Authorization": "Bearer device-token", "X-Tenant-ID": "shop-1"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Global dispatch clearing is not configured on the API server."


def test_global_dispatch_clear_requires_an_authenticated_shop_device(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "server-only-key")

    def unexpected_delete(*_args, **_kwargs):
        raise AssertionError("Dispatch deletion must not run without an authenticated shop device.")

    monkeypatch.setattr(superadmin_router, "clear_all_dispatch_orders", unexpected_delete)
    response = TestClient(app).post(
        "/api/v1/superadmin/dispatch/clear",
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "An authenticated shop workstation is required."


def test_global_dispatch_clear_rejects_a_mismatched_shop_device(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "server-only-key")
    monkeypatch.setattr(superadmin_router.device_service, "validate_device_token", lambda _: ("device-1", "shop-1"))

    def unexpected_delete(*_args, **_kwargs):
        raise AssertionError("Dispatch deletion must not run for a different shop.")

    monkeypatch.setattr(superadmin_router, "clear_all_dispatch_orders", unexpected_delete)
    response = TestClient(app).post(
        "/api/v1/superadmin/dispatch/clear",
        headers={"Authorization": "Bearer device-token", "X-Tenant-ID": "shop-2"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "The authenticated workstation does not match the requested shop."


def test_global_dispatch_clear_audits_success_for_authenticated_shop_device(monkeypatch):
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "server-only-key")
    audit_events = []

    async def clear(*_args, **_kwargs):
        return 2

    monkeypatch.setattr(superadmin_router.device_service, "validate_device_token", lambda _: ("device-1", "shop-1"))
    monkeypatch.setattr(superadmin_router, "clear_all_dispatch_orders", clear)
    monkeypatch.setattr(
        superadmin_router.audit_service,
        "record_event",
        lambda **event: audit_events.append(event),
    )

    response = TestClient(app).post(
        "/api/v1/superadmin/dispatch/clear",
        headers={"Authorization": "Bearer device-token", "X-Tenant-ID": "shop-1"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": "cleared",
        "scope": "all_shops",
        "deleted_count": 2,
    }
    assert audit_events[0]["actor_type"] == "SHOP_DEVICE"
    assert audit_events[0]["actor_id"] == "device-1"
    assert audit_events[0]["shop_id"] == "shop-1"
    assert audit_events[0]["metadata"] == {
        "deleted_count": 2,
        "initiating_device_id": "device-1",
    }
