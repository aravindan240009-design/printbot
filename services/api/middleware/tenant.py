"""
Strict Multi-Tenant Isolation & Security Headers Middleware.
- Resolves shop_id from:
    1. Authenticated Staff Session or Superadmin Impersonation
    2. Enrolled Windows Device Token
    3. Shop-bound Guest Session Token
    4. Authenticated JWT Bearer Token
    5. X-Shop-ID / X-Tenant-ID header
- Cross-tenant spoofing prevention: If authenticated credential belongs to Shop A,
  any conflicting request specifying Shop B is immediately blocked with 403 Forbidden.
- Injects X-Request-ID for distributed tracing.
- Enforces HTTP Security Headers (CSP, X-Content-Type-Options, X-Frame-Options).
"""

import secrets
from typing import Optional
from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from services.api.core.security import decode_mock_jwt
from services.api.services.auth_service import auth_service
from services.api.services.device_service import device_service
from services.api.services.guest_service import guest_service
from services.api.core.config import settings

EXEMPT_EXACT_PATHS = {
    "/docs",
    "/openapi.json",
    "/redoc",
    "/api/v1/health",
    "/api/v1/health/live",
    "/api/v1/health/ready",
    "/api/v1/auth/login",
    "/api/v1/devices/pair",
    "/api/v1/devices/challenge-response",
    "/api/v1/guest/session",
    "/api/v1/guest/session/from-qr",
    "/api/v1/subscriptions/plan",
    "/api/v1/webhooks/payments",
    "/api/v1/subscriptions/simulate-webhook",
    "/api/v1/fleet/releases/check",
    "/metrics",
}


class TenantContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        request_id = request.headers.get("X-Request-ID") or f"req_{secrets.token_hex(8)}"
        request.state.request_id = request_id

        if settings.ENVIRONMENT.lower() in {"production", "prod"} and (
            path.startswith("/api/v1/lab")
            or path == "/api/v1/subscriptions/simulate-webhook"
            or path == "/metrics"
        ):
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Not found."})

        # Exempt public endpoints (exact match, qr route, or lab diagnostic simulator)
        if path in EXEMPT_EXACT_PATHS or path.startswith("/api/v1/qr/") or path.startswith("/api/v1/lab") or path.startswith("/docs") or path.startswith("/openapi"):
            response = await call_next(request)
            self._add_security_headers(response, request_id)
            return response

        resolved_shop_id: Optional[str] = None
        user_session = None
        auth_error: Optional[HTTPException] = None

        # 1. Check Bearer Authorization header
        auth_header = request.headers.get("Authorization")
        had_bearer = bool(auth_header and auth_header.startswith("Bearer "))
        if had_bearer:
            token = auth_header.split(" ", 1)[1].strip()

            # (a) Check Staff / Superadmin session
            session = auth_service.get_session(token)
            if session:
                user_session = session
                request.state.user = session
                resolved_shop_id = session.get("shop_id")

            # (b) Check Enrolled Device token
            if not resolved_shop_id:
                try:
                    _, dev_shop = device_service.validate_device_token(token)
                    resolved_shop_id = dev_shop
                except HTTPException as e:
                    auth_error = e
                except Exception:
                    pass

            # (c) Check Guest session token in Bearer
            if not resolved_shop_id:
                try:
                    gst = guest_service.validate_guest_session(token)
                    resolved_shop_id = gst.shop_id
                except HTTPException as e:
                    if not auth_error:
                        auth_error = e
                except Exception:
                    pass

            # (d) Fallback to JWT payload
            if not resolved_shop_id:
                try:
                    payload = decode_mock_jwt(token)
                    resolved_shop_id = payload.get("shop_id") or payload.get("tenant_id")
                except Exception:
                    pass

        # 2. Check X-Guest-Session header
        guest_header = request.headers.get("X-Guest-Session")
        if guest_header and not resolved_shop_id:
            try:
                gst = guest_service.validate_guest_session(guest_header.strip())
                resolved_shop_id = gst.shop_id
            except HTTPException as e:
                auth_error = e
            except Exception:
                pass

        # 3. Explicit Header Check (X-Shop-ID or X-Tenant-ID)
        header_tenant_id = request.headers.get("X-Shop-ID") or request.headers.get("X-Tenant-ID")

        # Cross-Tenant Conflict Verification:
        # If an authenticated identity has an established shop_id, and the client also supplies
        # a header with a DIFFERENT shop_id, reject immediately!
        if resolved_shop_id and header_tenant_id and resolved_shop_id != header_tenant_id:
            # Superadmin is exempt from this check if accessing a managed shop
            if not (user_session and user_session.get("is_superadmin")):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "detail": f"Cross-tenant access forbidden. Authenticated token belongs to shop '{resolved_shop_id}', but request targeted '{header_tenant_id}'."
                    }
                )

        # Superadmin can operate globally or target a specific shop
        if user_session and user_session.get("is_superadmin"):
            resolved_shop_id = header_tenant_id or "superadmin-plane"

        # If token was supplied but invalid/revoked, return 401/403 immediately (prevent header bypass)
        if had_bearer and not resolved_shop_id:
            status_code = auth_error.status_code if auth_error else status.HTTP_401_UNAUTHORIZED
            detail = auth_error.detail if auth_error else "Invalid, expired, or revoked authorization credentials."
            return JSONResponse(
                status_code=status_code,
                content={"detail": detail}
            )

        # If still no resolved shop, use header if present
        if not resolved_shop_id and header_tenant_id:
            if settings.ENVIRONMENT.lower() in {"production", "prod"}:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Authenticated shop credentials are required."},
                )
            # Development-only compatibility for the legacy simulator. A
            # production deployment can never select a tenant from a header.
            resolved_shop_id = header_tenant_id

        if not resolved_shop_id:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "detail": "Missing mandatory 'X-Tenant-ID' header or authenticated shop context. Multi-tenant isolation is strictly enforced."
                }
            )

        request.state.tenant_id = resolved_shop_id
        request.state.shop_id = resolved_shop_id

        response = await call_next(request)
        response.headers["X-Tenant-ID"] = resolved_shop_id
        response.headers["X-Shop-ID"] = resolved_shop_id
        self._add_security_headers(response, request_id)
        return response

    def _add_security_headers(self, response, request_id: str):
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(self), microphone=()"
        if settings.ENVIRONMENT.lower() in {"production", "prod"}:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
