"""
Shop Configuration & Mode Service for Print Bot Phase 4.
Manages the two distinct per-shop operating modes:
- FULL_AUTOMATIC: verified-paid jobs dispatch immediately to ready printers.
- MANUAL_APPROVAL: every job waits for authenticated staff triage.
Strict Invariant: Mode changes apply to future jobs only, never reinterpreting locked in-flight orders.
"""

from typing import Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import HTTPException, status

from packages.contracts.models import OrderMode
from services.api.services.audit_service import audit_service


class ShopSettings(BaseModel):
    shop_id: str
    order_mode: OrderMode = OrderMode.FULL_AUTOMATIC
    cash_allowed: bool = True
    upi_allowed: bool = True
    retention_hours: int = 24
    max_file_size_mb: int = 100
    operating_hours: Dict[str, Any] = Field(
        default_factory=lambda: {"monday_to_saturday": {"open": "08:30", "close": "21:30"}}
    )
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ShopService:
    def __init__(self):
        # Maps shop_id -> ShopSettings
        self._settings: Dict[str, ShopSettings] = {}
        self._init_defaults()

    def _init_defaults(self):
        shop_a = "11111111-1111-1111-1111-111111111111"
        shop_b = "22222222-2222-2222-2222-222222222222"
        # Both default to FULL_AUTOMATIC per database schema
        self._settings[shop_a] = ShopSettings(
            shop_id=shop_a,
            order_mode=OrderMode.FULL_AUTOMATIC,
            cash_allowed=True,
            upi_allowed=True,
        )
        self._settings[shop_b] = ShopSettings(
            shop_id=shop_b,
            order_mode=OrderMode.FULL_AUTOMATIC,
            cash_allowed=True,
            upi_allowed=True,
        )

    def get_settings(self, shop_id: str) -> ShopSettings:
        if shop_id not in self._settings:
            # Default new shop to FULL_AUTOMATIC
            self._settings[shop_id] = ShopSettings(shop_id=shop_id)
        return self._settings[shop_id]

    def update_settings(
        self,
        shop_id: str,
        new_mode: Optional[OrderMode] = None,
        cash_allowed: Optional[bool] = None,
        upi_allowed: Optional[bool] = None,
        retention_hours: Optional[int] = None,
        actor_id: str = "shop_owner@xerox.in",
    ) -> ShopSettings:
        current = self.get_settings(shop_id)
        prev_mode = current.order_mode

        if new_mode is not None:
            current.order_mode = new_mode
        if cash_allowed is not None:
            current.cash_allowed = cash_allowed
        if upi_allowed is not None:
            current.upi_allowed = upi_allowed
        if retention_hours is not None:
            current.retention_hours = retention_hours
        current.updated_at = datetime.utcnow()

        if new_mode is not None and new_mode != prev_mode:
            audit_service.record_event(
                shop_id=shop_id,
                actor_type="OWNER",
                actor_id=actor_id,
                action="SHOP_MODE_CHANGED",
                resource_type="shop_settings",
                resource_id=shop_id,
                metadata={
                    "previous_mode": prev_mode.value,
                    "new_mode": new_mode.value,
                    "applied_to_new_jobs_only": True,
                },
            )

        return current

    def clear(self):
        self._settings.clear()
        self._init_defaults()


shop_service = ShopService()
