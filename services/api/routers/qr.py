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
    qr_code: Optional[str] = None
    shop_id: Optional[str] = None


class MintQrGuestSessionRequest(BaseModel):
    qr_code: str


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
        "brand_name": link.shop_name,
        "scan_count": link.scan_count
    }


@router.post("/guest/session")
async def mint_guest_session(req: MintGuestSessionRequest, request: Request):
    """
    Mints an independent, short-lived session token bound strictly to shop_id.
    Zero cross-shop identity merging.
    """
    if req.qr_code:
        link = guest_service.resolve_qr_code(req.qr_code)
    elif req.shop_id:
        link = guest_service.resolve_shop_id(req.shop_id)
    else:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="qr_code is required.")
    ip_addr = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("User-Agent")

    session = guest_service.mint_guest_session(
        shop_id=link.shop_id,
        ip_hash=ip_addr,
        user_agent=user_agent
    )

    return {
        "session_token": session.session_token,
        "shop_id": session.shop_id,
        "shop_name": link.shop_name,
        "shop_slug": link.shop_slug,
        "expires_at": session.expires_at.isoformat()
    }


@router.post("/guest/session/from-qr")
async def mint_guest_session_from_qr(req: MintQrGuestSessionRequest, request: Request):
    """Create a guest session from the signed/printed shop QR code.

    The client supplies a QR code, never a shop identifier. The server resolves
    the code and carries that shop binding into the guest credential.
    """
    link = guest_service.resolve_qr_code(req.qr_code)
    ip_addr = request.client.host if request.client else "127.0.0.1"
    session = guest_service.mint_guest_session(
        shop_id=link.shop_id,
        ip_hash=ip_addr,
        user_agent=request.headers.get("User-Agent"),
    )
    return {
        "session_token": session.session_token,
        "shop_id": session.shop_id,
        "shop_name": link.shop_name,
        "shop_slug": link.shop_slug,
        "expires_at": session.expires_at.isoformat(),
    }
