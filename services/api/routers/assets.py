"""
Scoped Asset Storage & Presigned Object URL Router.
- Enforces tenant-prefixed storage paths: tenants/{shop_id}/assets/{asset_id}/{safe_name}
- Scoped signed upload & download URLs.
- Cross-shop isolation protection.
- Support impersonation privacy enforcement.
"""

from fastapi import APIRouter, Request, HTTPException, status, Query
from packages.contracts.models import (
    AssetUploadIntentRequest,
    AssetUploadIntentResponse,
)
from services.api.services.asset_service import asset_service

router = APIRouter(prefix="/assets", tags=["Scoped Asset Storage"])


@router.post("/upload-intent", response_model=AssetUploadIntentResponse)
async def create_upload_intent(req: AssetUploadIntentRequest, request: Request):
    """
    Creates upload intent and returns scoped signed URL for document upload.
    Object path is strictly isolated under tenants/{shop_id}/assets/{asset_id}/...
    """
    shop_id = getattr(request.state, "shop_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    session_id = None
    user = getattr(request.state, "user", None)
    if user:
        session_id = user.get("session_token")

    return asset_service.create_upload_intent(shop_id=shop_id, req=req, session_id=session_id)


@router.get("/{asset_id}/download")
async def get_download_url(
    asset_id: str,
    request: Request,
    explicit_tenant_consent: bool = Query(default=False)
):
    """
    Generates scoped download URL for a document asset.
    Rejects any cross-shop download attempt.
    Rejects support impersonator requests unless explicit tenant consent flag is given.
    """
    shop_id = getattr(request.state, "shop_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    user = getattr(request.state, "user", None)
    is_impersonation = False
    if user and user.get("is_impersonation"):
        is_impersonation = True

    return asset_service.get_download_url(
        requesting_shop_id=shop_id,
        asset_id=asset_id,
        is_impersonation=is_impersonation,
        explicit_tenant_consent=explicit_tenant_consent
    )


@router.delete("/{asset_id}")
async def delete_asset(asset_id: str, request: Request):
    """
    Customer or shop right to erasure. Purges asset storage reference.
    Enforces tenant scoping: cannot delete assets belonging to other shops.
    """
    shop_id = getattr(request.state, "shop_id", None) or getattr(request.state, "tenant_id", None)
    if not shop_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shop context required.")

    purged = asset_service.purge_asset(shop_id=shop_id, asset_id=asset_id)
    if not purged:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Asset '{asset_id}' not found for shop '{shop_id}'.")
    return {"status": "deleted", "asset_id": asset_id, "shop_id": shop_id}
