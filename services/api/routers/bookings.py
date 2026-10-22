"""
Bookings, Timed Xerox & Scheduling Router for Print Bot Phase 5.
"""

from typing import List, Optional
from fastapi import APIRouter, Request, HTTPException, status, Query
from pydantic import BaseModel

from packages.contracts.models import (
    ServiceType,
    AvailableSlot,
    ShopServiceCatalogue,
    BookingCreateRequest,
    BookingResponse,
    ReviseEstimateRequest,
    PhoneCaptureRequest,
    PhoneCaptureResponse,
)
from services.api.services.catalogue_service import catalogue_service
from services.api.services.scheduling_service import scheduling_service
from services.api.services.capture_service import capture_service

router = APIRouter(prefix="/bookings", tags=["Bookings & Scheduling"])


@router.get("/catalogue", response_model=ShopServiceCatalogue)
def get_service_catalogue(request: Request):
    """Retrieves service catalogue and booking policies for the shop."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return catalogue_service.get_catalogue(shop_id)


@router.put("/catalogue", response_model=ShopServiceCatalogue)
def update_service_catalogue(req: ShopServiceCatalogue, request: Request):
    """Owner edits shop service catalogue, slot duration, capacity, and holiday dates."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    user = getattr(request.state, "user", None)
    actor_id = user.get("email", "owner@shop.com") if user else "owner@shop.com"
    return catalogue_service.update_catalogue(shop_id, req, actor_id=actor_id)


@router.get("/available-slots", response_model=List[AvailableSlot])
def get_available_slots(
    request: Request,
    date: str = Query(..., description="Target date in YYYY-MM-DD format"),
    service_type: ServiceType = Query(default=ServiceType.PHYSICAL_XEROX_BOOKING),
):
    """Generates discrete time slots respecting shop hours, lead time, and current capacity."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return catalogue_service.get_available_slots(
        shop_id=shop_id,
        target_date_str=date,
        service_type=service_type,
    )


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(req: BookingCreateRequest, request: Request):
    """
    Creates a new timed booking with concurrency locking.
    Prevents overbooking beyond shop slot capacity.
    """
    shop_id: str = getattr(request.state, "tenant_id", req.shop_id)
    req.shop_id = shop_id
    return scheduling_service.create_booking(req)


@router.get("/day-view")
def get_day_view(
    request: Request,
    date: str = Query(..., description="Target date in YYYY-MM-DD format"),
):
    """Returns calendar day view timeline, capacity utilization, and on-time KPIs."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return scheduling_service.get_day_view(shop_id, date)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: str, request: Request):
    """Retrieves booking scoped to the shop tenant."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return scheduling_service.get_booking(shop_id, booking_id)


class CheckInRequest(BaseModel):
    pickup_code: str


@router.post("/{booking_id}/check-in", response_model=BookingResponse)
def counter_check_in(booking_id: str, req: CheckInRequest, request: Request):
    """Customer arrives at counter and checks in using 4-digit PIN / QR."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return scheduling_service.check_in(shop_id, booking_id, req.pickup_code)


@router.post("/{booking_id}/revise-estimate", response_model=BookingResponse)
def revise_physical_estimate(booking_id: str, req: ReviseEstimateRequest, request: Request):
    """Staff counts real physical paper originals at counter and updates quote before charging."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return scheduling_service.revise_estimate(
        shop_id=shop_id,
        booking_id=booking_id,
        revised_pages=req.revised_pages,
        staff_id=req.staff_id,
        reason=req.reason,
    )


class AssignStaffRequest(BaseModel):
    staff_id: str


@router.post("/{booking_id}/assign-staff", response_model=BookingResponse)
def assign_staff_operator(booking_id: str, req: AssignStaffRequest, request: Request):
    """Assigns staff operator to handle physical Xerox or assist customer."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return scheduling_service.assign_staff(shop_id, booking_id, req.staff_id)


@router.post("/{booking_id}/complete", response_model=BookingResponse)
def complete_booking(booking_id: str, request: Request):
    """Marks booking completed and triggers customer ready-for-pickup notification."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return scheduling_service.complete_booking(shop_id, booking_id)


class CancelBookingRequest(BaseModel):
    reason: str = "Customer requested cancellation"


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(booking_id: str, req: CancelBookingRequest, request: Request):
    """Cancels booking, releasing slot capacity for other customers."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    return scheduling_service.cancel_booking(shop_id, booking_id, req.reason)


@router.post("/dispatch-scheduled-prints")
def run_scheduled_print_dispatch(request: Request):
    """Worker job: dispatches SCHEDULE_PRINT jobs whose scheduled time window has arrived."""
    shop_id: str = getattr(request.state, "tenant_id", "default-tenant")
    dispatched = scheduling_service.dispatch_scheduled_prints(shop_id)
    return {"status": "success", "dispatched_count": len(dispatched), "booking_ids": dispatched}
