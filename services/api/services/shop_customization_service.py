"""
Shop Admin Customization Center & QR Microsite Preview Service for Print Bot Phase 6.
Handles:
- Full shop operational profile customization (OrderMode, brand, services, formats, paper, languages).
- Guardrails: Maximum document retention ceiling (72h), refund constraints.
- Real-time customer microsite preview rendering.
- Capability validator ensuring disabled controls invalidate stale quotes.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from packages.contracts.models import (
    OrderMode,
    SupportedFormat,
    PaperSize,
    ColorMode,
    DuplexMode,
    ShopMicrositePreview,
)
from services.api.services.shop_service import shop_service, ShopSettings
from services.api.services.audit_service import audit_service


PLATFORM_MAX_RETENTION_HOURS = 72  # Platform security maximum ceiling


class ShopCustomizationConfig(BaseModel):
    shop_id: str
    order_mode: OrderMode = OrderMode.FULL_AUTOMATIC
    brand_primary_color: str = "#2563EB"
    logo_url: Optional[str] = "https://printbot.in/assets/default_shop_logo.png"
    supported_languages: List[str] = Field(default_factory=lambda: ["en", "ta"])
    services_enabled: Dict[str, bool] = Field(
        default_factory=lambda: {
            "PRINT": True,
            "SCHEDULE_PRINT": True,
            "READY_BY_SLOT": True,
            "PHYSICAL_XEROX_BOOKING": True,
            "TIMED_SELF_SERVICE_COPIER": False,
        }
    )
    allowed_file_types: List[str] = Field(
        default_factory=lambda: ["pdf", "jpeg", "png", "docx", "xlsx", "pptx", "txt"]
    )
    allowed_paper_sizes: List[str] = Field(default_factory=lambda: ["A4", "A3", "A5", "Legal"])
    allowed_color_modes: List[str] = Field(default_factory=lambda: ["bw", "color"])
    allowed_duplex_modes: List[str] = Field(default_factory=lambda: ["simplex", "duplex_long", "duplex_short"])
    pricing_rates_paise: Dict[str, int] = Field(
        default_factory=lambda: {
            "bw_single": 200,      # ₹2.00
            "bw_duplex": 300,      # ₹3.00
            "color_single": 1000,  # ₹10.00
            "color_duplex": 1500,  # ₹15.00
        }
    )
    customer_notifications: Dict[str, bool] = Field(
        default_factory=lambda: {"sms_opt_in": True, "whatsapp_opt_in": True, "email_opt_in": True}
    )
    retention_hours: int = 24
    order_timeout_minutes: int = 30
    refund_requires_manager_approval: bool = True
    cash_allowed: bool = True
    upi_allowed: bool = True
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ShopCustomizationService:
    def __init__(self):
        # Maps shop_id -> ShopCustomizationConfig
        self._configs: Dict[str, ShopCustomizationConfig] = {}
        self._init_defaults()

    def _init_defaults(self):
        shop_a = "11111111-1111-1111-1111-111111111111"
        shop_b = "22222222-2222-2222-2222-222222222222"

        self._configs[shop_a] = ShopCustomizationConfig(
            shop_id=shop_a,
            order_mode=OrderMode.FULL_AUTOMATIC,
            brand_primary_color="#1E40AF",
            supported_languages=["en", "ta"],
        )
        self._configs[shop_b] = ShopCustomizationConfig(
            shop_id=shop_b,
            order_mode=OrderMode.FULL_AUTOMATIC,
            brand_primary_color="#047857",
            supported_languages=["en", "ta", "hi"],
        )

    def get_config(self, shop_id: str) -> ShopCustomizationConfig:
        if shop_id not in self._configs:
            self._configs[shop_id] = ShopCustomizationConfig(shop_id=shop_id)
        return self._configs[shop_id]

    def update_config(self, shop_id: str, updates: Dict[str, Any], actor_id: str = "owner@shop.com") -> ShopCustomizationConfig:
        """
        Updates shop customization with platform security guardrails enforced.
        - Document retention cannot exceed PLATFORM_MAX_RETENTION_HOURS (72h).
        - Mode changes synchronize with shop_service.
        """
        config = self.get_config(shop_id)

        # Enforce platform ceiling on retention
        if "retention_hours" in updates:
            hours = int(updates["retention_hours"])
            if hours > PLATFORM_MAX_RETENTION_HOURS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Retention period ({hours}h) exceeds platform maximum ceiling ({PLATFORM_MAX_RETENTION_HOURS}h)."
                )
            config.retention_hours = hours

        if "order_mode" in updates:
            mode = OrderMode(updates["order_mode"])
            config.order_mode = mode
            shop_service.update_settings(shop_id=shop_id, new_mode=mode, actor_id=actor_id)

        if "brand_primary_color" in updates:
            config.brand_primary_color = updates["brand_primary_color"]
        if "logo_url" in updates:
            config.logo_url = updates["logo_url"]
        if "supported_languages" in updates:
            config.supported_languages = updates["supported_languages"]
        if "services_enabled" in updates:
            config.services_enabled = updates["services_enabled"]
        if "allowed_file_types" in updates:
            config.allowed_file_types = updates["allowed_file_types"]
        if "pricing_rates_paise" in updates:
            config.pricing_rates_paise = updates["pricing_rates_paise"]
        if "customer_notifications" in updates:
            config.customer_notifications = updates["customer_notifications"]
        if "order_timeout_minutes" in updates:
            config.order_timeout_minutes = int(updates["order_timeout_minutes"])
        if "cash_allowed" in updates:
            config.cash_allowed = updates["cash_allowed"]
            shop_service.update_settings(shop_id=shop_id, cash_allowed=updates["cash_allowed"], actor_id=actor_id)
        if "upi_allowed" in updates:
            config.upi_allowed = updates["upi_allowed"]
            shop_service.update_settings(shop_id=shop_id, upi_allowed=updates["upi_allowed"], actor_id=actor_id)

        config.updated_at = datetime.utcnow()

        audit_service.record_event(
            actor_type="OWNER",
            actor_id=actor_id,
            action="SHOP_CUSTOMIZATION_UPDATED",
            resource_type="shop_config",
            resource_id=shop_id,
            shop_id=shop_id,
            metadata={"updated_keys": list(updates.keys())}
        )
        return config

    def render_microsite_preview(self, shop_id: str, shop_name: str = "Print Bot Xerox", slug: str = "demo-shop") -> ShopMicrositePreview:
        """Renders instantaneous customer-facing configuration preview for the mobile QR microsite."""
        cfg = self.get_config(shop_id)
        settings = shop_service.get_settings(shop_id)

        return ShopMicrositePreview(
            shop_id=shop_id,
            shop_name=shop_name,
            slug=slug,
            order_mode=cfg.order_mode,
            brand_primary_color=cfg.brand_primary_color,
            logo_url=cfg.logo_url,
            supported_languages=cfg.supported_languages,
            services_enabled=cfg.services_enabled,
            allowed_file_types=cfg.allowed_file_types,
            pricing_summary=cfg.pricing_rates_paise,
            operating_hours=settings.operating_hours,
            retention_hours=cfg.retention_hours,
        )

    def validate_capability_for_quote(self, shop_id: str, format_ext: str, color_mode: str, paper_size: str) -> Tuple[bool, Optional[str]]:
        """Checks if a requested print capability is currently permitted by the shop's active configuration."""
        cfg = self.get_config(shop_id)
        if format_ext.lower() not in cfg.allowed_file_types:
            return False, f"File format '.{format_ext}' is disabled by this shop."
        if color_mode.lower() not in cfg.allowed_color_modes:
            return False, f"Color mode '{color_mode}' is currently unavailable at this shop."
        if paper_size not in cfg.allowed_paper_sizes:
            return False, f"Paper size '{paper_size}' is not supported by this shop's active printers."
        return True, None

    def clear(self):
        self._configs.clear()
        self._init_defaults()


shop_customization_service = ShopCustomizationService()
