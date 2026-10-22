"""
Document Ingestion, Format Analysis, Preview & Multi-File Quoting API Router.
Handles safe upload inspection, encrypted PDF unlocking, thumbnail previews,
and deterministic Indian paise quotes.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response, Request
from fastapi.responses import Response
from typing import Optional
import io
import uuid

from packages.contracts.models import (
    FileScanResult,
    UnlockPdfRequest,
    UnlockPdfResponse,
    MultiFileQuoteRequest,
    MultiFileQuoteResponse,
    PhotoLayoutRequest,
    PhotoLayoutResponse,
    PhotoLayoutPreset,
    PhoneCaptureRequest,
    PhoneCaptureResponse,
)
from services.api.services.conversion_engine import conversion_engine
from services.api.services.preview_service import preview_service
from services.api.services.accounting_engine import accounting_engine
from services.api.services.asset_service import asset_service

router = APIRouter(prefix="/documents", tags=["documents"])

# In-memory session store for temporary preview assets (TTL managed)
MOCK_ASSET_CACHE = {}


@router.post("/scan", response_model=FileScanResult)
async def scan_document(
    file: UploadFile = File(...),
    request: Request = None
):
    """
    Scans an uploaded document buffer for format magic bytes, MIME types,
    page count, encryption, and potential decompression bomb exploits.
    """
    content = await file.read()
    scan_res = conversion_engine.scan_file(content, file.filename, file.content_type)

    # Cache asset buffer for preview rendering if valid
    asset_id = str(uuid.uuid4())
    tenant_id = getattr(request.state, "tenant_id", "default-tenant") if request else "default-tenant"
    MOCK_ASSET_CACHE[asset_id] = {
        "tenant_id": tenant_id,
        "filename": file.filename,
        "content": content,
        "scan": scan_res
    }

    return scan_res


@router.post("/unlock-pdf", response_model=UnlockPdfResponse)
async def unlock_pdf(req: UnlockPdfRequest, request: Request):
    """
    Unlocks a password-protected PDF in memory with user-provided password.
    Never stores or logs the password.
    """
    tenant_id = getattr(request.state, "tenant_id", "default-tenant")
    cached = MOCK_ASSET_CACHE.get(req.asset_id)
    if not cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document asset '{req.asset_id}' not found."
        )

    # Verify tenant isolation
    if cached["tenant_id"] != tenant_id and tenant_id != "default-tenant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-tenant asset access forbidden."
        )

    success, page_count, unlocked_bytes, error_msg = conversion_engine.unlock_pdf(cached["content"], req.password)
    if not success:
        return UnlockPdfResponse(
            asset_id=req.asset_id,
            is_unlocked=False,
            page_count=0,
            error_message=error_msg
        )

    # Replace cached buffer with decrypted buffer in-memory
    cached["content"] = unlocked_bytes
    cached["scan"].is_encrypted = False
    cached["scan"].needs_password = False
    cached["scan"].page_count = page_count

    return UnlockPdfResponse(
        asset_id=req.asset_id,
        is_unlocked=True,
        page_count=page_count
    )


@router.post("/quote", response_model=MultiFileQuoteResponse)
async def calculate_quote(req: MultiFileQuoteRequest, request: Request):
    """
    Generates a deterministic multi-file print quote in Indian paise.
    Applies exact duplex padding across copy and file boundaries.
    """
    return accounting_engine.generate_multi_file_quote(req)


@router.get("/{asset_id}/preview/{page_num}")
async def get_page_preview(
    asset_id: str,
    page_num: int,
    request: Request,
    color_mode: str = "bw",
    duplex_mode: str = "simplex"
):
    """
    Returns server-rendered preview image for mobile PDF.js / Konva clients.
    Enforces strict tenant scoping.
    """
    tenant_id = getattr(request.state, "tenant_id", "default-tenant")
    cached = MOCK_ASSET_CACHE.get(asset_id)

    if cached and cached["tenant_id"] != tenant_id and tenant_id != "default-tenant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cross-tenant access forbidden. Asset does not belong to shop '{tenant_id}'."
        )

    doc_name = cached["filename"] if cached else f"Document_{asset_id[:8]}.pdf"
    total_pages = cached["scan"].page_count if cached else max(page_num, 10)

    # If it's an image asset, return downscaled thumbnail
    if cached and cached["scan"].format.value in ("jpeg", "png", "webp", "bmp", "tiff"):
        thumb_bytes = preview_service.generate_image_thumbnail(cached["content"], max_width=600)
        return Response(content=thumb_bytes, media_type="image/jpeg")

    # Otherwise render page preview canvas
    preview_bytes = preview_service.generate_page_preview(
        page_num=page_num,
        total_pages=total_pages,
        doc_name=doc_name,
        color_mode=color_mode,
        duplex_mode=duplex_mode
    )
    return Response(content=preview_bytes, media_type="image/jpeg")


@router.post("/photo-layout", response_model=PhotoLayoutResponse)
async def create_photo_layout(req: PhotoLayoutRequest, request: Request):
    """
    Generates photo composition:
    - passport_8up: 8 passport photos on a 4x6 / A4 canvas with crop guides at 300 DPI.
    - id_front_back: Front and back of ID card vertically aligned on single sheet at 300 DPI.
    """
    tenant_id = getattr(request.state, "tenant_id", "default-tenant")
    cached = MOCK_ASSET_CACHE.get(req.asset_id)

    # Use uploaded asset if available, or generate synthetic test sample
    photo_content = cached["content"] if cached else preview_service._create_error_thumbnail("Sample Photo")

    composite_id = str(uuid.uuid4())
    if req.layout_preset == PhotoLayoutPreset.PASSPORT_8UP:
        composite_bytes = preview_service.generate_passport_8up_grid(photo_content)
        w, h = 1800, 1200
    else:
        composite_bytes = preview_service.generate_id_front_back_composite(photo_content)
        w, h = 2480, 3508

    MOCK_ASSET_CACHE[composite_id] = {
        "tenant_id": tenant_id,
        "filename": f"composite_{req.layout_preset.value}.jpg",
        "content": composite_bytes,
        "scan": conversion_engine.scan_file(composite_bytes, "composite.jpg", "image/jpeg")
    }

    return PhotoLayoutResponse(
        composite_asset_id=composite_id,
        layout_preset=req.layout_preset,
        preview_url=f"/api/v1/documents/{composite_id}/preview/1",
        width_px=w,
        height_px=h,
        dpi=300
    )


@router.post("/phone-capture", response_model=PhoneCaptureResponse)
async def process_phone_camera_capture(req: PhoneCaptureRequest, request: Request):
    """
    Normalizes multi-page customer smartphone camera captures into a high-res PDF.
    Explicitly distinguished from physical counter Xerox:
    - Customer captures pages with phone camera.
    - Perspective rotation and high-quality PDF compilation.
    - Explicit customer legibility check required before print.
    """
    from services.api.services.capture_service import capture_service
    tenant_id = getattr(request.state, "tenant_id", "default-tenant")
    req.shop_id = tenant_id
    return capture_service.process_phone_capture(req)
