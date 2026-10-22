import hashlib
import json
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException, status


class IdempotencyStore:
    """
    In-memory and Redis-compatible idempotency store.
    Guarantees that repeated requests with the same Idempotency-Key return
    the exact same response without re-executing business logic.
    """
    def __init__(self):
        # Maps (tenant_id, idempotency_key) -> {"payload_hash": str, "status_code": int, "response": dict, "completed": bool}
        self._store: Dict[str, Dict[str, Any]] = {}

    def _key(self, tenant_id: str, idempotency_key: str) -> str:
        return f"{tenant_id}:{idempotency_key}"

    def check(self, tenant_id: str, idempotency_key: str, payload: Any) -> Tuple[bool, Optional[Dict[str, Any]], Optional[int]]:
        """
        Returns (exists_and_matches, cached_response, cached_status_code).
        Raises 409 Conflict if key was used previously with different payload.
        """
        k = self._key(tenant_id, idempotency_key)
        record = self._store.get(k)
        if not record:
            return False, None, None

        payload_bytes = json.dumps(payload, sort_keys=True).encode()
        current_hash = hashlib.sha256(payload_bytes).hexdigest()

        if record["payload_hash"] != current_hash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Idempotency key reused with different request payload."
            )

        if not record.get("completed"):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="A request with this idempotency key is already in progress."
            )

        return True, record["response"], record["status_code"]

    def start(self, tenant_id: str, idempotency_key: str, payload: Any) -> None:
        """Reserves key as in-progress."""
        k = self._key(tenant_id, idempotency_key)
        payload_bytes = json.dumps(payload, sort_keys=True).encode()
        current_hash = hashlib.sha256(payload_bytes).hexdigest()
        self._store[k] = {
            "payload_hash": current_hash,
            "status_code": 200,
            "response": None,
            "completed": False,
        }

    def complete(self, tenant_id: str, idempotency_key: str, status_code: int, response: Any) -> None:
        """Stores final response and marks completed."""
        k = self._key(tenant_id, idempotency_key)
        if k in self._store:
            self._store[k]["status_code"] = status_code
            self._store[k]["response"] = response
            self._store[k]["completed"] = True

    def clear(self) -> None:
        """Clears store (used for test teardown)."""
        self._store.clear()


idempotency_store = IdempotencyStore()
