from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional

EXEMPT_PATHS = {
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/v1/health",
    "/api/v1/health/live",
    "/api/v1/health/ready"
}


class TenantContextMiddleware(BaseHTTPMiddleware):
    """
    Guarantees strict multi-tenant boundary:
    Extracts X-Tenant-ID header and binds it to request.state.tenant_id.
    Returns 400 Bad Request if missing on protected endpoints.
    """
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Exempt public documentation and health check endpoints
        if path in EXEMPT_PATHS or path.startswith("/docs") or path.startswith("/openapi"):
            return await call_next(request)

        tenant_id: Optional[str] = request.headers.get("X-Tenant-ID")

        # For webhook endpoints, tenant_id can also be parsed from payload if header omitted
        if not tenant_id and not path.endswith("/webhooks/payments"):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "detail": "Missing mandatory 'X-Tenant-ID' header. Multi-tenant isolation is strictly enforced."
                }
            )

        request.state.tenant_id = tenant_id or "default-tenant"
        response = await call_next(request)
        if tenant_id:
            response.headers["X-Tenant-ID"] = tenant_id
        return response
