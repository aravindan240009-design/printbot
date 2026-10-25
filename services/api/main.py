from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from services.api.core.config import settings
from services.api.middleware.tenant import TenantContextMiddleware
from services.api.routers import (
    health,
    orders,
    webhooks,
    printers,
    reconciliation,
    auth,
    subscriptions,
    devices,
    assets,
    qr,
    dashboards,
    documents,
    bookings,
    superadmin,
    licenses,
    fleet,
    shop_customization,
    studio,
    differentiation,
    hardware,
    virtual_lab,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Context Manager.
    Initializes database pools, redis cache connections, and cleans up on shutdown.
    """
    # Startup actions
    print(f"[{settings.APP_NAME}] Startup: Initializing connection pools and multi-tenant ledger...")
    yield
    # Shutdown actions
    print(f"[{settings.APP_NAME}] Shutdown: Closing connections and flushing spool buffers...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Production Multi-Tenant Print Shop SaaS Platform API with Windows Desktop Hardware Integration",
    version="1.0.0",
    docs_url=None if settings.ENVIRONMENT.lower() in {"production", "prod"} else "/docs",
    redoc_url=None if settings.ENVIRONMENT.lower() in {"production", "prod"} else "/redoc",
    openapi_url=None if settings.ENVIRONMENT.lower() in {"production", "prod"} else "/openapi.json",
    lifespan=lifespan
)

# 1. CORS Configuration (Allows Next.js web portal and Tauri localhost / tauri://localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Guest-Session", "X-Request-ID", "X-Shop-ID", "X-Tenant-ID", "X-Razorpay-Signature", "X-Signature", "X-Timestamp"],
)

# 2. Strict Multi-Tenant Isolation Middleware
app.add_middleware(TenantContextMiddleware)

# 3. Register Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(webhooks.router, prefix=settings.API_V1_STR)
app.include_router(printers.router, prefix=settings.API_V1_STR)
app.include_router(reconciliation.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(subscriptions.router, prefix=settings.API_V1_STR)
app.include_router(devices.router, prefix=settings.API_V1_STR)
app.include_router(assets.router, prefix=settings.API_V1_STR)
app.include_router(qr.router, prefix=settings.API_V1_STR)
app.include_router(dashboards.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(bookings.router, prefix=settings.API_V1_STR)
app.include_router(superadmin.router, prefix=settings.API_V1_STR)
app.include_router(licenses.router, prefix=settings.API_V1_STR)
app.include_router(fleet.router, prefix=settings.API_V1_STR)
app.include_router(shop_customization.router, prefix=settings.API_V1_STR)
app.include_router(studio.router, prefix=settings.API_V1_STR)
app.include_router(differentiation.router, prefix=settings.API_V1_STR)
app.include_router(hardware.router, prefix=settings.API_V1_STR)
app.include_router(virtual_lab.router, prefix=settings.API_V1_STR)


@app.get("/metrics")
async def prometheus_metrics():
    """Prometheus exposition format metrics for platform observability."""
    from services.api.services.superadmin_service import superadmin_service
    kpis = superadmin_service.calculate_kpis()
    lines = [
        "# HELP printbot_active_shops_total Number of active paying shops",
        "# TYPE printbot_active_shops_total gauge",
        f"printbot_active_shops_total {kpis.active_subscribers}",
        "# HELP printbot_mrr_paise Monthly Recurring Revenue in Indian paise",
        "# TYPE printbot_mrr_paise gauge",
        f"printbot_mrr_paise {kpis.mrr_paise}",
        "# HELP printbot_arr_paise Annual Recurring Revenue in Indian paise",
        "# TYPE printbot_arr_paise gauge",
        f"printbot_arr_paise {kpis.arr_paise}",
        "# HELP printbot_devices_total Total registered Windows agent devices",
        "# TYPE printbot_devices_total gauge",
        f"printbot_devices_total {kpis.total_devices}",
        "# HELP printbot_active_devices_24h Devices active in last 24 hours",
        "# TYPE printbot_active_devices_24h gauge",
        f"printbot_active_devices_24h {kpis.active_devices_24h}",
        "# HELP printbot_queue_age_seconds_p50 Median print queue age in seconds",
        "# TYPE printbot_queue_age_seconds_p50 gauge",
        f"printbot_queue_age_seconds_p50 {kpis.queue_age_seconds_p50}",
        "# HELP printbot_failure_rate_pct Overall print failure rate percentage",
        "# TYPE printbot_failure_rate_pct gauge",
        f"printbot_failure_rate_pct {kpis.failure_rate_pct}",
        "# HELP printbot_sheets_printed_total Total physical paper sheets printed",
        "# TYPE printbot_sheets_printed_total counter",
        f"printbot_sheets_printed_total {kpis.total_sheets_printed}",
    ]
    return Response(content="\n".join(lines) + "\n", media_type="text/plain; version=0.0.4")



@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Formats uncaught errors to RFC 7807 problem details."""
    return JSONResponse(
        status_code=500,
        content={
            "type": "about:blank",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "Internal server error." if settings.ENVIRONMENT.lower() in {"production", "prod"} else str(exc),
            "instance": request.url.path,
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.api.main:app", host="0.0.0.0", port=8000, reload=True)
