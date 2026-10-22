"""
QR Code Scan Resolution & Isolated Guest Sessions Router.
- Customer scans shop QR stand -> resolves shop profile.
- Mints short-lived guest session token bound strictly to that shop.
- Never merges customer identity across multiple shops.
"""

from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from services.api.services.guest_service import guest_service

router = APIRouter(tags=["QR Links & Guest Sessions"])


class MintGuestSessionRequest(BaseModel):
    shop_id: str


@router.get("/qr/{code}/resolve")
async def resolve_qr_code(code: str):
    """
    Customer mobile web scan entry point.
    Resolves unique shop profile without requiring customer login.
    """
    link = guest_service.resolve_qr_code(code)
    return {
        "status": "resolved",
        "shop_id": link.shop_id,
        "shop_slug": link.shop_slug,
        "shop_name": link.shop_name,
        "scan_count": link.scan_count
    }


@router.post("/guest/session")
async def mint_guest_session(req: MintGuestSessionRequest, request: Request):
    """
    Mints an independent, short-lived session token bound strictly to shop_id.
    Zero cross-shop identity merging.
    """
    ip_addr = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("User-Agent")

    session = guest_service.mint_guest_session(
        shop_id=req.shop_id,
        ip_hash=ip_addr,
        user_agent=user_agent
    )

    return {
        "session_token": session.session_token,
        "shop_id": session.shop_id,
        "expires_at": session.expires_at.isoformat()
    }
