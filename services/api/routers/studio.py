"""
Advanced Print Studio Router for Print Bot Phase 7.
Provides:
- Booklet / brochure saddle-stitch imposition calculator.
- Mixed-color per-page quote estimator.
- Poster / tiled multi-sheet enlargement generator with overlap bleed.
- ID card front/back single-sheet placement generator.
- Pre-flight image DPI resolution quality checker.
- Password-protected PDF unlocking with customer password authorization.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from packages.contracts.models import (
    BookletImpositionRequest,
    BookletImpositionResponse,
    MixedColorQuoteRequest,
    MixedColorQuoteResponse,
    PosterTiledLayoutRequest,
    PosterTiledLayoutResponse,
    IDCardLayoutRequest,
    IDCardLayoutResponse,
)
from services.api.services.studio_service import studio_service

router = APIRouter(prefix="/studio", tags=["Advanced Print Studio & Imposition"])


class QualityCheckRequest(BaseModel):
    width_px: int
    height_px: int
    target_width_in: float
    target_height_in: float


class UnlockPdfRequest(BaseModel):
    is_encrypted: bool
    password: Optional[str] = None


@router.post("/booklet/imposition", response_model=BookletImpositionResponse)
async def calculate_booklet_imposition(req: BookletImpositionRequest):
    """Calculates exact 4-up saddle-stitch booklet signature order with blanks."""
    return studio_service.calculate_booklet_imposition(req=req)


@router.post("/mixed-color/quote", response_model=MixedColorQuoteResponse)
async def calculate_mixed_color_quote(req: MixedColorQuoteRequest):
    """Calculates quote accurately splitting B&W vs Color pages in Indian paise."""
    return studio_service.calculate_mixed_color_quote(req=req)


@router.post("/poster/tiled-layout", response_model=PosterTiledLayoutResponse)
async def calculate_poster_tiled_layout(req: PosterTiledLayoutRequest):
    """Calculates crop boxes and overlap bleed for multi-sheet poster enlargement."""
    return studio_service.calculate_poster_tiled_layout(req=req)


@router.post("/id-card/layout", response_model=IDCardLayoutResponse)
async def calculate_id_card_layout(req: IDCardLayoutRequest):
    """Lays out front and back of ID card on a single A4 sheet with standard dimensions."""
    return studio_service.calculate_id_card_layout(req=req)


@router.post("/quality-check")
async def evaluate_image_quality(req: QualityCheckRequest):
    """Evaluates effective print DPI and warns if resolution is below 150 DPI."""
    return studio_service.evaluate_image_resolution_quality(
        width_px=req.width_px,
        height_px=req.height_px,
        target_width_in=req.target_width_in,
        target_height_in=req.target_height_in,
    )


@router.post("/unlock-pdf")
async def unlock_protected_pdf(req: UnlockPdfRequest):
    """Verifies customer password authorization for encrypted PDF."""
    is_valid, msg = studio_service.verify_pdf_password(is_encrypted=req.is_encrypted, user_password=req.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return {"status": "unlocked", "can_print": True}
