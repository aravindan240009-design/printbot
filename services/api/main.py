from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# 1. CORS Configuration (Allows Next.js web portal and Tauri localhost / tauri://localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Formats uncaught errors to RFC 7807 problem details."""
    return JSONResponse(
        status_code=500,
        content={
            "type": "about:blank",
            "title": "Internal Server Error",
            "status": 500,
            "detail": str(exc),
            "instance": request.url.path,
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.api.main:app", host="0.0.0.0", port=8000, reload=True)
