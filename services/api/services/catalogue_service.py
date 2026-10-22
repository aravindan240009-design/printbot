"""
Shop Service Catalogue & Availability Engine for Print Bot Phase 5.
Manages:
- Per-shop pricing, operating hours, closed dates, lead time, and rush charges.
- Discrete time-slot generation respecting shop timezone (Asia/Kolkata),
  lead time cutoffs, and slot capacity concurrency limits.
- Inclusion in single all-inclusive SaaS subscription (zero feature gating).
"""

from datetime import datetime, date, time as dtime, timedelta
from typing import Dict, List, Optional, Any
from zoneinfo import ZoneInfo
from fastapi import HTTPException, status

from packages.contracts.models import (
    ServiceType,
    AvailableSlot,
    ShopServiceCatalogue,
)
from services.api.services.audit_service import audit_service


class CatalogueService:
    def __init__(self):
        # Maps shop_id -> ShopServiceCatalogue
        self._catalogues: Dict[str, ShopServiceCatalogue] = {}
        self._init_defaults()

    def _init_defaults(self):
        shop_a = "11111111-1111-1111-1111-111111111111"
        shop_b = "22222222-2222-2222-2222-222222222222"
        self._catalogues[shop_a] = ShopServiceCatalogue(
            shop_id=shop_a,
            time_zone="Asia/Kolkata",
            slot_duration_minutes=15,
            capacity_per_slot=4,
            lead_time_minutes=30,
            last_booking_cutoff_minutes=60,
        )
        self._catalogues[shop_b] = ShopServiceCatalogue(
            shop_id=shop_b,
            time_zone="Asia/Kolkata",
            slot_duration_minutes=15,
            capacity_per_slot=4,
            lead_time_minutes=30,
            last_booking_cutoff_minutes=60,
        )

    def get_catalogue(self, shop_id: str) -> ShopServiceCatalogue:
        if shop_id not in self._catalogues:
            self._catalogues[shop_id] = ShopServiceCatalogue(shop_id=shop_id)
        return self._catalogues[shop_id]

    def update_catalogue(
        self,
        shop_id: str,
        catalogue_update: ShopServiceCatalogue,
        actor_id: str = "owner@shop.com",
    ) -> ShopServiceCatalogue:
        catalogue_update.shop_id = shop_id
        self._catalogues[shop_id] = catalogue_update

        audit_service.record_event(
            shop_id=shop_id,
            actor_type="OWNER",
            actor_id=actor_id,
            action="SERVICE_CATALOGUE_UPDATED",
            resource_type="shop_catalogue",
            resource_id=shop_id,
        )
        return catalogue_update

    def get_available_slots(
        self,
        shop_id: str,
        target_date_str: str,
        service_type: ServiceType,
        booked_counts_by_slot: Optional[Dict[str, int]] = None,
        reference_now: Optional[datetime] = None,
    ) -> List[AvailableSlot]:
        """
        Generates available slots for a shop on a target date (YYYY-MM-DD).
        Respects:
        - Operating hours and closed holiday dates
        - Lead time minimums and last booking cutoffs
        - Slot capacity and rush hour surcharges
        """
        catalogue = self.get_catalogue(shop_id)

        # Check if service is enabled
        if not catalogue.services_enabled.get(service_type.value, True):
            if service_type == ServiceType.TIMED_SELF_SERVICE_COPIER:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Timed Self-Service Copier is currently unavailable. Hardware integration is pending verification.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Service '{service_type.value}' is not enabled for this shop.",
            )

        # Holiday check
        if target_date_str in catalogue.closed_dates:
            return []

        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Expected YYYY-MM-DD.",
            )

        # Resolve day operating hours
        day_name = target_date.strftime("%A").lower()
        hours_key = "sunday" if day_name == "sunday" else "monday_to_saturday"
        day_hours = catalogue.operating_hours.get(hours_key) or catalogue.operating_hours.get(day_name)
        if not day_hours or not day_hours.get("open") or not day_hours.get("close"):
            return []

        open_h, open_m = map(int, day_hours["open"].split(":"))
        close_h, close_m = map(int, day_hours["close"].split(":"))

        tz = ZoneInfo(catalogue.time_zone)
        open_dt = datetime(target_date.year, target_date.month, target_date.day, open_h, open_m, tzinfo=tz)
        close_dt = datetime(target_date.year, target_date.month, target_date.day, close_h, close_m, tzinfo=tz)

        now = reference_now or datetime.now(tz)
        if now.tzinfo is None:
            now = now.replace(tzinfo=tz)

        lead_cutoff = now + timedelta(minutes=catalogue.lead_time_minutes)
        last_cutoff = close_dt - timedelta(minutes=catalogue.last_booking_cutoff_minutes)

        slots: List[AvailableSlot] = []
        cur = open_dt
        duration = timedelta(minutes=catalogue.slot_duration_minutes)

        booked_counts = booked_counts_by_slot or {}

        while cur + duration <= close_dt:
            slot_end = cur + duration

            # Only offer slot if it meets lead time and closes before last cutoff
            if cur >= lead_cutoff and cur <= last_cutoff:
                slot_iso = cur.isoformat()
                booked = booked_counts.get(slot_iso, 0)
                available = max(0, catalogue.capacity_per_slot - booked)

                # Rush calculation: if within 60 minutes of now
                is_rush = (cur - now).total_seconds() <= 3600
                rush_fee = catalogue.rush_surcharge_paise if is_rush else 0

                slots.append(
                    AvailableSlot(
                        slot_id=f"slot_{cur.strftime('%Y%m%d_%H%M')}",
                        slot_start=cur,
                        slot_end=slot_end,
                        capacity_total=catalogue.capacity_per_slot,
                        capacity_available=available,
                        is_rush=is_rush,
                        rush_surcharge_paise=rush_fee,
                    )
                )
            cur += duration

        return slots

    def clear(self):
        self._catalogues.clear()
        self._init_defaults()


catalogue_service = CatalogueService()
