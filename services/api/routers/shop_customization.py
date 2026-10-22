"""
Shop Admin Customization & QR Microsite Preview Router for Print Bot Phase 6.
Provides:
- Full shop profile customization (OrderMode, brand, services, formats, paper, languages).
- Enforced platform guardrails: Maximum document retention ceiling (72h).
- Instant customer mobile microsite preview rendering.
- Capability validation ensuring disabled controls invalidate stale quotes.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from packages.contracts.models import (
    ShopMicrositePreview,
)
from services.api.services.shop_customization_service import (
    shop_customization_service,
    ShopCustomizationConfig,
)

router = APIRouter(prefix="/shops", tags=["Shop Customization & Microsite Preview"])


class UpdateCustomizationRequest(BaseModel):
    order_mode: Optional[str] = None
    brand_primary_color: Optional[str] = None
    logo_url: Optional[str] = None
    supported_languages: Optional[List[str]] = None
    services_enabled: Optional[Dict[str, bool]] = None
    allowed_file_types: Optional[List[str]] = None
    pricing_rates_paise: Optional[Dict[str, int]] = None
    customer_notifications: Optional[Dict[str, bool]] = None
    retention_hours: Optional[int] = None
    order_timeout_minutes: Optional[int] = None
    cash_allowed: Optional[bool] = None
    upi_allowed: Optional[bool] = None


@router.get("/{shop_id}/customization", response_model=ShopCustomizationConfig)
async def get_shop_customization(shop_id: str, request: Request):
    """Retrieves current customization and operational profile for a shop."""
    return shop_customization_service.get_config(shop_id=shop_id)


@router.patch("/{shop_id}/customization", response_model=ShopCustomizationConfig)
async def update_shop_customization(shop_id: str, req: UpdateCustomizationRequest, request: Request):
    """
    Updates shop customization settings.
    Enforces platform security upper bound on retention ceiling (72h max).
    """
    user = getattr(request.state, "user", None)
    actor_id = user.get("user_id", "owner@shop.com") if user else "owner@shop.com"

    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    return shop_customization_service.update_config(shop_id=shop_id, updates=updates, actor_id=actor_id)


@router.get("/{shop_id}/microsite-preview", response_model=ShopMicrositePreview)
async def get_shop_microsite_preview(
    shop_id: str,
    shop_name: str = Query(default="Anna Xerox & Digital Works"),
    slug: str = Query(default="anna-chennai")
):
    """
    Renders an instant customer-view preview of the shop's mobile QR microsite,
    showing active brand color, supported formats, pricing summary, and enabled service types.
    """
    return shop_customization_service.render_microsite_preview(
        shop_id=shop_id,
        shop_name=shop_name,
        slug=slug
    )


@router.get("/{shop_id}/validate-capability")
async def validate_capability(
    shop_id: str,
    format_ext: str = Query(..., description="File extension, e.g. 'pdf', 'docx'"),
    color_mode: str = Query(default="bw", description="'bw' or 'color'"),
    paper_size: str = Query(default="A4", description="'A4', 'A3', 'Legal', etc.")
):
    """
    Pre-flight quote capability validator.
    Ensures disabled print settings reject stale or unfulfillable quote requests.
    """
    is_valid, error_msg = shop_customization_service.validate_capability_for_quote(
        shop_id=shop_id,
        format_ext=format_ext,
        color_mode=color_mode,
        paper_size=paper_size
    )
    return {
        "shop_id": shop_id,
        "is_supported": is_valid,
        "error_reason": error_msg
    }
