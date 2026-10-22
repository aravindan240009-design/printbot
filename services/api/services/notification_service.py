"""
Notification Service for Print Bot Phase 5.
Uses 100% free, local, open-source logging infrastructure.
Dispatches booking confirmations, reminders, and ready notifications without paid SMS/email APIs.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class NotificationRecord(BaseModel):
    id: str
    recipient: str
    notification_type: str  # 'BOOKING_CONFIRMED', 'REMINDER_30MIN', 'READY_FOR_PICKUP', 'SLOT_MISSED'
    subject: str
    body: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    sent_at: datetime = Field(default_factory=datetime.utcnow)


class NotificationService:
    def __init__(self):
        # Maps id -> NotificationRecord
        self._sent_notifications: List[NotificationRecord] = []

    def send_booking_confirmation(
        self,
        recipient: str,
        booking_ref: str,
        pickup_code: str,
        slot_start: datetime,
        service_type: str,
        is_physical_originals_required: bool,
    ) -> NotificationRecord:
        import uuid

        time_str = slot_start.strftime("%I:%M %p, %d %b %Y")
        physical_note = (
            "\n⚠️ IMPORTANT: Please bring your physical paper originals to the counter."
            if is_physical_originals_required
            else "\nYour documents are submitted digitally; they will be prepared according to your slot."
        )

        subject = f"Print Bot Booking Confirmed: {booking_ref}"
        body = (
            f"Your booking {booking_ref} is confirmed for {time_str}.\n"
            f"Service: {service_type}\n"
            f"Counter Pickup / Check-in PIN: {pickup_code}"
            f"{physical_note}"
        )

        record = NotificationRecord(
            id=str(uuid.uuid4()),
            recipient=recipient,
            notification_type="BOOKING_CONFIRMED",
            subject=subject,
            body=body,
            metadata={"booking_ref": booking_ref, "pickup_code": pickup_code},
        )
        self._sent_notifications.append(record)
        return record

    def send_ready_for_pickup(
        self,
        recipient: str,
        booking_ref: str,
        pickup_code: str,
    ) -> NotificationRecord:
        import uuid

        subject = f"Ready for Pickup: Booking {booking_ref}"
        body = (
            f"Good news! Your print job for booking {booking_ref} is ready for collection.\n"
            f"Please show your Pickup PIN: {pickup_code} at the counter."
        )
        record = NotificationRecord(
            id=str(uuid.uuid4()),
            recipient=recipient,
            notification_type="READY_FOR_PICKUP",
            subject=subject,
            body=body,
            metadata={"booking_ref": booking_ref, "pickup_code": pickup_code},
        )
        self._sent_notifications.append(record)
        return record

    def list_notifications(self, recipient: Optional[str] = None) -> List[NotificationRecord]:
        if recipient:
            return [n for n in self._sent_notifications if n.recipient == recipient]
        return list(self._sent_notifications)

    def clear(self):
        self._sent_notifications.clear()


notification_service = NotificationService()
