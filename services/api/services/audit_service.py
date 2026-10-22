"""
Audit Service for Print Bot Phase 1.
Records immutable creator lineage, staff logins, support impersonation,
administrative overrides, device revocations, and shop configuration updates.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class AuditEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_id: Optional[str] = None
    actor_id: Optional[str] = None
    actor_type: str  # 'STAFF', 'SUPERADMIN', 'DEVICE', 'GUEST', 'SYSTEM'
    action: str
    resource_type: str
    resource_id: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AuditService:
    def __init__(self):
        self._events: List[AuditEvent] = []

    def record_event(
        self,
        actor_type: str,
        action: str,
        resource_type: str,
        resource_id: str,
        shop_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditEvent:
        event = AuditEvent(
            shop_id=shop_id,
            actor_id=actor_id,
            actor_type=actor_type,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent
        )
        self._events.append(event)
        return event

    def list_events(
        self,
        shop_id: Optional[str] = None,
        action: Optional[str] = None,
        limit: int = 50
    ) -> List[AuditEvent]:
        filtered = [
            e for e in self._events
            if (shop_id is None or e.shop_id == shop_id) and
               (action is None or e.action == action)
        ]
        return sorted(filtered, key=lambda x: x.created_at, reverse=True)[:limit]

    def clear(self):
        self._events.clear()

audit_service = AuditService()
