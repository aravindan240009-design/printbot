"""
Transactional Outbox & Realtime Event Hub for Print Bot Phase 4.
Persists immutable events in outbox for asynchronous publishing to Valkey/workers,
and powers Server-Sent Events (SSE) for walk-in customer mobile tracking.
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, AsyncGenerator
from pydantic import BaseModel, Field


class OutboxEventRecord(BaseModel):
    id: str
    shop_id: str
    event_type: str
    payload: Dict[str, Any]
    status: str = "PENDING"  # 'PENDING', 'PUBLISHED', 'FAILED'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None


class OutboxService:
    def __init__(self):
        # Maps event_id -> OutboxEventRecord
        self._events: Dict[str, OutboxEventRecord] = {}
        # Maps order_id -> list of asyncio.Queue for live SSE subscribers
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}

    def emit_event(
        self,
        shop_id: str,
        event_type: str,
        payload: Dict[str, Any],
    ) -> OutboxEventRecord:
        """Atomically registers an outbox event and notifies live SSE subscribers."""
        event_id = str(uuid.uuid4())
        record = OutboxEventRecord(
            id=event_id,
            shop_id=shop_id,
            event_type=event_type,
            payload=payload,
            status="PENDING",
            created_at=datetime.utcnow(),
        )
        self._events[event_id] = record

        # Notify any active SSE streams listening on this order_id
        order_id = payload.get("order_id") or payload.get("id")
        if order_id and order_id in self._subscribers:
            msg = {
                "event_id": event_id,
                "event_type": event_type,
                "shop_id": shop_id,
                "payload": payload,
                "timestamp": record.created_at.isoformat(),
            }
            for q in list(self._subscribers[order_id]):
                try:
                    q.put_nowait(msg)
                except Exception:
                    pass

        return record

    def get_pending_events(self, limit: int = 50) -> List[OutboxEventRecord]:
        pending = [e for e in self._events.values() if e.status == "PENDING"]
        return sorted(pending, key=lambda x: x.created_at)[:limit]

    def mark_published(self, event_id: str) -> Optional[OutboxEventRecord]:
        record = self._events.get(event_id)
        if record:
            record.status = "PUBLISHED"
            record.published_at = datetime.utcnow()
        return record

    async def sse_event_generator(self, order_id: str, max_events: Optional[int] = None) -> AsyncGenerator[str, None]:
        """Async generator streaming SSE messages to the customer browser."""
        q = asyncio.Queue()
        if order_id not in self._subscribers:
            self._subscribers[order_id] = []
        self._subscribers[order_id].append(q)

        # Send initial connected heartbeat
        yield f"event: connected\ndata: {json.dumps({'order_id': order_id, 'status': 'connected'})}\n\n"
        count = 1
        if max_events is not None and count >= max_events:
            if order_id in self._subscribers and q in self._subscribers[order_id]:
                self._subscribers[order_id].remove(q)
            return

        try:
            while True:
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=20.0)
                    yield f"event: {msg['event_type']}\ndata: {json.dumps(msg)}\n\n"
                    count += 1
                    if max_events is not None and count >= max_events:
                        break
                except asyncio.TimeoutError:
                    # Keep-alive comment
                    yield f": keep-alive ping {datetime.utcnow().isoformat()}\n\n"
        finally:
            if order_id in self._subscribers and q in self._subscribers[order_id]:
                self._subscribers[order_id].remove(q)
                if not self._subscribers[order_id]:
                    del self._subscribers[order_id]

    def clear(self):
        self._events.clear()
        self._subscribers.clear()


outbox_service = OutboxService()
