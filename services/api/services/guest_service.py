"""
QR Link Resolution & Shop-Bound Guest Session Service for Print Bot Phase 1.
- Resolves shop from unique QR short code.
- Mints an independent, short-lived guest session strictly bound to that shop.
- Prevents cross-shop customer merging: customer visiting Shop A is never merged with Shop B.
"""

import uuid
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

GUEST_SESSION_TTL_HOURS = 2


class QRLink(BaseModel):
    code: str
    shop_id: str
    shop_slug: str
    shop_name: str
    is_active: bool = True
    scan_count: int = 0


class GuestSession(BaseModel):
    session_token: str
    shop_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    ip_hash: Optional[str] = None
    user_agent: Optional[str] = None


class GuestService:
    def __init__(self):
        # Maps qr_code -> QRLink
        self._qr_links: Dict[str, QRLink] = {}
        # Maps session_token -> GuestSession
        self._guest_sessions: Dict[str, GuestSession] = {}
        self._init_defaults()

    def _init_defaults(self):
        # Seed QR codes for adversarial shops
        self._qr_links["qr_anna_guindy"] = QRLink(
            code="qr_anna_guindy",
            shop_id="11111111-1111-1111-1111-111111111111",
            shop_slug="anna-chennai",
            shop_name="Anna University Quick Xerox"
        )
        self._qr_links["qr_bharat_simmakkal"] = QRLink(
            code="qr_bharat_simmakkal",
            shop_id="22222222-2222-2222-2222-222222222222",
            shop_slug="bharat-madurai",
            shop_name="Bharat Fast Prints"
        )

    def resolve_qr_code(self, qr_code: str) -> QRLink:
        link = self._qr_links.get(qr_code.strip())
        if not link or not link.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"QR Code '{qr_code}' is invalid or deactivated."
            )
        link.scan_count += 1
        return link

    def mint_guest_session(
        self,
        shop_id: str,
        ip_hash: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> GuestSession:
        """
        Creates an isolated, short-lived guest session bound strictly to shop_id.
        Customers are never globally merged.
        """
        token = f"gst_{secrets.token_urlsafe(32)}"
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=GUEST_SESSION_TTL_HOURS)

        session = GuestSession(
            session_token=token,
            shop_id=shop_id,
            expires_at=expires_at,
            ip_hash=ip_hash,
            user_agent=user_agent
        )
        self._guest_sessions[token] = session
        return session

    def validate_guest_session(self, session_token: str) -> GuestSession:
        session = self._guest_sessions.get(session_token)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired guest session."
            )
        if datetime.utcnow() > session.expires_at:
            del self._guest_sessions[session_token]
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Guest session has expired. Scan shop QR again."
            )
        return session

    def clear(self):
        self._qr_links.clear()
        self._guest_sessions.clear()
        self._init_defaults()


guest_service = GuestService()
