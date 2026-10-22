import hmac
import hashlib
import time
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from services.api.core.config import settings


def verify_webhook_signature(
    raw_body: bytes,
    signature_header: Optional[str],
    timestamp_header: Optional[str],
    secret: Optional[str] = None
) -> bool:
    """
    Verifies incoming webhook HMAC-SHA256 signature and guards against replay attacks.
    """
    if not signature_header or not timestamp_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required webhook signature or timestamp headers."
        )

    # 1. Guard against replay attacks: threshold of 300 seconds (5 minutes)
    try:
        ts = int(timestamp_header)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid timestamp header format."
        )

    current_ts = int(time.time())
    if abs(current_ts - ts) > 300:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook timestamp outside valid tolerance window (replay attack prevention)."
        )

    # 2. Compute HMAC signature over timestamp + "." + raw_body
    secret_key = (secret or settings.WEBHOOK_SIGNING_SECRET).encode("utf-8")
    payload_to_sign = f"{timestamp_header}.".encode("utf-8") + raw_body
    expected_signature = hmac.new(secret_key, payload_to_sign, hashlib.sha256).hexdigest()

    # 3. Constant-time comparison to prevent timing side-channel attacks
    if not hmac.compare_digest(expected_signature, signature_header):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Webhook signature verification failed."
        )

    return True


def create_mock_jwt(payload: Dict[str, Any]) -> str:
    """Mock JWT token helper for deterministic tests and token parsing."""
    import base64
    import json
    token_data = {"exp": time.time() + 86400, **payload}
    encoded = base64.urlsafe_b64encode(json.dumps(token_data).encode()).decode()
    return f"mockjwt.{encoded}.valid"


def decode_mock_jwt(token: str) -> Dict[str, Any]:
    """Decodes token and verifies expiry."""
    import base64
    import json
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Malformed JWT token format")
    try:
        decoded_bytes = base64.urlsafe_b64decode(parts[1].encode())
        payload = json.loads(decoded_bytes.decode())
        if payload.get("exp") and payload["exp"] < time.time():
            raise HTTPException(status_code=401, detail="Token has expired")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token payload")
