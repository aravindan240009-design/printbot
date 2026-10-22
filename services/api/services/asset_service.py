"""
Scoped Asset Storage Service for Print Bot Phase 1.
- All object paths prefixed by tenant plus opaque asset id:
    tenants/{shop_id}/assets/{asset_id}/{safe_filename}
- Presigned signed upload and download URLs using HMAC-SHA256.
- Strict cross-shop isolation: Shop B cannot read, download, or replace Shop A's assets.
- Support impersonator protection: support sessions cannot download customer documents by default.
"""

import os
import re
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from packages.contracts.models import (
    AssetUploadIntentRequest,
    AssetUploadIntentResponse,
)
from services.api.core.config import settings
from services.api.services.audit_service import audit_service


ASSET_URL_TTL_SECONDS = 900  # 15 minutes


class AssetMetadata(BaseModel):
    id: str
    shop_id: str
    storage_path: str
    file_name: str
    mime_type: str
    file_size_bytes: int
    sha256_hash: str
    uploaded_by_session: Optional[str] = None
    is_deleted: bool = False
    retention_until: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)


def sanitize_filename(filename: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
    return cleaned[:100] or "unnamed_document.pdf"


def generate_asset_signature(shop_id: str, asset_id: str, expires_at_ts: int, secret: str = settings.SECRET_KEY) -> str:
    payload = f"{shop_id}:{asset_id}:{expires_at_ts}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()


class AssetService:
    def __init__(self):
        # Maps (shop_id, asset_id) -> AssetMetadata
        self._assets: Dict[str, AssetMetadata] = {}

    def _key(self, shop_id: str, asset_id: str) -> str:
        return f"{shop_id}:{asset_id}"

    def create_upload_intent(
        self,
        shop_id: str,
        req: AssetUploadIntentRequest,
        session_id: Optional[str] = None
    ) -> AssetUploadIntentResponse:
        asset_id = str(secrets.token_hex(16))
        safe_name = sanitize_filename(req.file_name)
        storage_path = f"tenants/{shop_id}/assets/{asset_id}/{safe_name}"

        now = datetime.utcnow()
        expires_at = now + timedelta(seconds=ASSET_URL_TTL_SECONDS)
        expires_ts = int(expires_at.timestamp())
        signature = generate_asset_signature(shop_id, asset_id, expires_ts)

        upload_url = f"/api/v1/assets/{asset_id}/upload?shop_id={shop_id}&expires={expires_ts}&sig={signature}"

        meta = AssetMetadata(
            id=asset_id,
            shop_id=shop_id,
            storage_path=storage_path,
            file_name=safe_name,
            mime_type=req.mime_type,
            file_size_bytes=req.file_size_bytes,
            sha256_hash=req.sha256_hash,
            uploaded_by_session=session_id,
            retention_until=now + timedelta(hours=24)
        )
        self._assets[self._key(shop_id, asset_id)] = meta

        return AssetUploadIntentResponse(
            asset_id=asset_id,
            shop_id=shop_id,
            upload_url=upload_url,
            storage_path=storage_path,
            expires_at=expires_at,
            upload_headers={
                "Content-Type": req.mime_type,
                "X-Asset-SHA256": req.sha256_hash
            }
        )

    def verify_upload_signature(self, shop_id: str, asset_id: str, expires_ts: int, signature: str) -> bool:
        if datetime.utcnow().timestamp() > expires_ts:
            return False
        expected_sig = generate_asset_signature(shop_id, asset_id, expires_ts)
        return hmac.compare_digest(expected_sig, signature)

    def get_download_url(
        self,
        requesting_shop_id: str,
        asset_id: str,
        is_impersonation: bool = False,
        explicit_tenant_consent: bool = False
    ) -> Dict[str, Any]:
        """
        Generates scoped download URL.
        Stops cross-shop downloads: requesting_shop_id MUST match asset.shop_id.
        Stops support impersonator document snooping unless explicit consent flag.
        """
        asset = self._assets.get(self._key(requesting_shop_id, asset_id))
        if not asset or asset.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset '{asset_id}' not found for shop '{requesting_shop_id}'."
            )

        if is_impersonation and not explicit_tenant_consent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Support impersonation cannot download customer documents without explicit tenant consent."
            )

        expires_at = datetime.utcnow() + timedelta(seconds=ASSET_URL_TTL_SECONDS)
        expires_ts = int(expires_at.timestamp())
        sig = generate_asset_signature(requesting_shop_id, asset_id, expires_ts)

        download_url = f"/api/v1/assets/{asset_id}/raw?shop_id={requesting_shop_id}&expires={expires_ts}&sig={sig}"

        return {
            "asset_id": asset_id,
            "shop_id": requesting_shop_id,
            "file_name": asset.file_name,
            "mime_type": asset.mime_type,
            "file_size_bytes": asset.file_size_bytes,
            "download_url": download_url,
            "storage_path": asset.storage_path,
            "expires_at": expires_at
        }

    def clear(self):
        self._assets.clear()


asset_service = AssetService()
