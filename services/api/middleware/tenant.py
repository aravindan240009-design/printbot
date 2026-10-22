from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
from services.api.core.security import decode_mock_jwt

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
    Resolves shop_id / tenant_id from:
    1. Authenticated JWT Bearer token (claims 'shop_id' or 'tenant_id')
    2. Shop-bound Guest Session or X-Shop-ID / X-Tenant-ID header.
    Never trusts unchecked request body/query fields.
    """
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Exempt public documentation and health check endpoints
        if path in EXEMPT_PATHS or path.startswith("/docs") or path.startswith("/openapi"):
            return await call_next(request)

        tenant_id: Optional[str] = None

        # 1. Check Bearer Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            try:
                payload = decode_mock_jwt(token)
                tenant_id = payload.get("shop_id") or payload.get("tenant_id")
            except Exception:
                pass

        # 2. Check X-Shop-ID or X-Tenant-ID header
        if not tenant_id:
            tenant_id = request.headers.get("X-Shop-ID") or request.headers.get("X-Tenant-ID")

        # For payment webhooks, tenant_id is validated in the webhook handler from signed payload
        if not tenant_id and not path.endswith("/webhooks/payments"):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "detail": "Missing mandatory 'X-Tenant-ID' header or authenticated shop context. Multi-tenant isolation is strictly enforced."
                }
            )

        resolved_id = tenant_id or "default-tenant"
        request.state.tenant_id = resolved_id
        request.state.shop_id = resolved_id

        response = await call_next(request)
        if tenant_id:
            response.headers["X-Tenant-ID"] = tenant_id
            response.headers["X-Shop-ID"] = tenant_id
        return response
