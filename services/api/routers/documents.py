"""
Document Ingestion, Format Analysis, Preview & Multi-File Quoting API Router.
Handles safe upload inspection, encrypted PDF unlocking, thumbnail previews,
and deterministic Indian paise quotes.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Response, Request
from fastapi.responses import Response
from typing import Optional
import io
import time
import uuid
from collections import OrderedDict

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
    DocumentConversionOptions,
    DocumentConversionResult,
)
from pydantic import BaseModel
from services.api.services.conversion_engine import conversion_engine, MAX_FILE_SIZE_BYTES
from services.api.services.preview_service import preview_service
from services.api.services.accounting_engine import accounting_engine
from services.api.services.asset_service import asset_service
from services.api.services.shop_customization_service import shop_customization_service

router = APIRouter(prefix="/documents", tags=["documents"])

# Bounded, TTL-evicting in-memory store for temporary preview assets
MAX_CACHE_ENTRIES = 50
ASSET_CACHE_TTL_SECONDS = 900  # 15 minutes


class BoundedAssetCache:
    def __init__(self, max_entries: int = MAX_CACHE_ENTRIES, ttl_seconds: int = ASSET_CACHE_TTL_SECONDS):
        self._max_entries = max_entries
        self._ttl_seconds = ttl_seconds
        self._store = OrderedDict()

    def _evict_expired(self):
        now = time.time()
        expired_keys = [k for k, v in self._store.items() if now - v.get('_created_at', 0) > self._ttl_seconds]
        for k in expired_keys:
            self._store.pop(k, None)
        while len(self._store) > self._max_entries:
            self._store.popitem(last=False)

    def get(self, key: str):
        self._evict_expired()
        entry = self._store.get(key)
        if entry:
            if time.time() - entry.get('_created_at', 0) > self._ttl_seconds:
                self._store.pop(key, None)
                return None
            self._store.move_to_end(key)
        return entry

    def set(self, key: str, value: dict):
        self._evict_expired()
        value['_created_at'] = time.time()
        self._store[key] = value
        self._store.move_to_end(key)
        while len(self._store) > self._max_entries:
            self._store.popitem(last=False)

    def __getitem__(self, key: str):
        val = self.get(key)
        if val is None:
            raise KeyError(key)
        return val

    def __setitem__(self, key: str, value: dict):
        self.set(key, value)

    def __contains__(self, key: str):
        return self.get(key) is not None


MOCK_ASSET_CACHE = BoundedAssetCache()


@router.post("/scan", response_model=FileScanResult)
async def scan_document(
    file: UploadFile = File(...),
    request: Request = None
):
    """
    Scans an uploaded document buffer for format magic bytes, MIME types,
    page count, encryption, and potential decompression bomb exploits.
    """
    # Read one byte beyond the limit so oversized uploads are rejected without
    # allowing an attacker to force an unbounded in-memory allocation.
    content = await file.read(MAX_FILE_SIZE_BYTES + 1)
    scan_res, converted_pdf_bytes = conversion_engine.scan_and_convert(content, file.filename, file.content_type)

    # Cache asset buffer for preview rendering if valid
    asset_id = str(uuid.uuid4())
    tenant_id = getattr(request.state, "tenant_id", "default-tenant") if request else "default-tenant"
    if scan_res.is_valid:
        pdf_bytes_to_store = converted_pdf_bytes if converted_pdf_bytes else (content if scan_res.format.value == "pdf" else None)
        MOCK_ASSET_CACHE[asset_id] = {
            "tenant_id": tenant_id,
            "filename": file.filename,
            "content": content,
            "pdf_bytes": pdf_bytes_to_store,
            "scan": scan_res
        }
        if converted_pdf_bytes:
            scan_res.converted_asset_id = asset_id
            scan_res.is_converted = True
        import hashlib
        sha = hashlib.sha256(content).hexdigest()
        asset_service.register_scanned_asset(
            shop_id=tenant_id,
            asset_id=asset_id,
            filename=file.filename or "document.pdf",
            mime_type=file.content_type or "application/pdf",
            file_size_bytes=len(content),
            sha256_hash=sha,
            content=content,
        )

    # The temporary asset identifier is returned only after the server has
    # inspected the bytes. The customer must use this identifier for previews
    # and quotes; filenames and client-side page counts are never trusted.
    scan_res.asset_id = asset_id
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
    if cached["tenant_id"] != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document asset not found."
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
    cached["pdf_bytes"] = unlocked_bytes
    cached["scan"].is_encrypted = False
    cached["scan"].needs_password = False
    cached["scan"].page_count = page_count
    cached["scan"].is_converted = True

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
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="A shop-bound guest session is required.")
    # The request body is not an authority for tenant selection. The shop is
    # resolved by TenantContextMiddleware from the guest credential.
    req.shop_id = tenant_id
    validated_items = []
    for item in req.items:
        cached = MOCK_ASSET_CACHE.get(item.file_id)
        if not cached or cached["tenant_id"] != tenant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document asset not found.")
        if not cached["scan"].is_valid:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Document asset is not printable.")
        item.page_count = cached["scan"].page_count
        item.file_name = cached["filename"]
        validated_items.append(item)
    req.items = validated_items
    pricing_rates = shop_customization_service.get_config(tenant_id).pricing_rates_paise
    return accounting_engine.generate_multi_file_quote(
        req,
        pricing_rates_paise=pricing_rates,
    )


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

    if not cached or cached["tenant_id"] != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document asset not found."
        )

    if page_num < 1 or page_num > cached["scan"].page_count:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requested document page not found.")

    doc_name = cached["filename"]
    total_pages = cached["scan"].page_count

    # Render page preview (using PDFium rasterization if PDF bytes are cached)
    preview_bytes = preview_service.generate_page_preview(
        page_num=page_num,
        total_pages=total_pages,
        doc_name=doc_name,
        color_mode=color_mode,
        duplex_mode=duplex_mode,
        pdf_bytes=cached.get("pdf_bytes")
    )
    return Response(content=preview_bytes, media_type="image/jpeg")


class ConvertDocumentApiRequest(BaseModel):
    asset_id: str
    options: Optional[DocumentConversionOptions] = None
    password: Optional[str] = None


@router.post("/convert", response_model=DocumentConversionResult)
async def convert_document(req: ConvertDocumentApiRequest, request: Request):
    """
    Explicitly converts or re-converts an uploaded document with custom options
    (paper size, orientation, page range slicing, duplex padding).
    """
    tenant_id = getattr(request.state, "tenant_id", "default-tenant")
    cached = MOCK_ASSET_CACHE.get(req.asset_id)
    if not cached or cached["tenant_id"] != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document asset not found."
        )

    res, pdf_bytes = conversion_engine.convert_to_pdf(
        content=cached["content"],
        filename=cached["filename"],
        options=req.options,
        password=req.password
    )

    if not res.is_success or not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=res.error_message or "Failed to convert document."
        )

    # Update cache with normalized PDF
    cached["pdf_bytes"] = pdf_bytes
    cached["scan"].page_count = res.page_count
    cached["scan"].detected_pages = list(range(1, res.page_count + 1))
    cached["scan"].width_pts = res.width_pts
    cached["scan"].height_pts = res.height_pts
    cached["scan"].is_converted = True

    return res


@router.get("/{asset_id}/download-pdf")
async def download_normalized_pdf(asset_id: str, request: Request):
    """
    Streams the standardized, normalized printable PDF file.
    """
    import os
    tenant_id = getattr(request.state, "tenant_id", "default-tenant")
    cached = MOCK_ASSET_CACHE.get(asset_id)
    if not cached or cached["tenant_id"] != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document asset not found."
        )

    pdf_bytes = cached.get("pdf_bytes")
    if not pdf_bytes:
        res, converted = conversion_engine.convert_to_pdf(cached["content"], cached["filename"])
        if res.is_success and converted:
            pdf_bytes = converted
            cached["pdf_bytes"] = converted
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Document could not be converted to PDF."
            )

    base_name = os.path.splitext(cached["filename"])[0]
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{base_name}_normalized.pdf"'}
    )


@router.post("/photo-layout", response_model=PhotoLayoutResponse)
async def create_photo_layout(req: PhotoLayoutRequest, request: Request):
    """
    Generates photo composition:
    - passport_8up: 8 passport photos on a 4x6 / A4 canvas with crop guides at 300 DPI.
    - id_front_back: Front and back of ID card vertically aligned on single sheet at 300 DPI.
    """
    tenant_id = getattr(request.state, "tenant_id", "default-tenant")
    cached = MOCK_ASSET_CACHE.get(req.asset_id)

    if not cached or cached["tenant_id"] != tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document asset not found.")

    photo_content = cached["content"]

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
