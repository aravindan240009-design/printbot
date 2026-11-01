"""
License Center & Device Hardware Assurance Service for Print Bot Phase 6.
Handles:
- Public-key cryptographic fingerprints (SHA-256 hex format, never private keys).
- Hardware assurance tracking: TPM 2.0 nonexportable keys vs software fallback.
- Replaced / Stolen PC incident workflow with instant token invalidation.
- Short-TTL pairing code lifecycle.
- Suspicious account sharing detection (simultaneous distinct IPs, conflicting key fingerprints).
- Strict non-negotiable rule: UNLIMITED printers per shop, zero feature tiering.
"""

import hashlib
import hmac
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from packages.contracts.models import (
    HardwareAssurance,
    AlertSeverity,
    StolenDeviceReport,
)
from services.api.services.audit_service import audit_service
from services.api.core.config import settings
from services.api.services.device_service import device_service, DeviceRecord


class LicenseValidationRequest(BaseModel):
    username: str
    license_key: str
    device_id: str
    hardware_hash: Optional[str] = None


class LicenseValidationResponse(BaseModel):
    success: bool
    shop_id: Optional[str] = None
    shop_name: Optional[str] = None
    slug: Optional[str] = None
    city: Optional[str] = None
    contact_phone: Optional[str] = None
    plan: Optional[str] = None
    is_lifetime: bool = False
    expires_at: Optional[str] = None
    rates: Optional[Dict[str, Any]] = None
    order_mode: Optional[str] = None
    device_id: Optional[str] = None
    device_token: Optional[str] = None
    error: Optional[str] = None


class CanonicalLicense(BaseModel):
    shop_id: str
    shop_name: str
    slug: str
    city: str = "Chennai"
    contact_phone: str = "+91 9840111111"
    license_key_hash: str
    plan: str = "1 Year"
    is_lifetime: bool = False
    starts_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    is_revoked: bool = False
    max_devices: int = 2
    rates: Dict[str, Any] = Field(default_factory=lambda: {"bwRate": 1.5, "colorRate": 10.0})
    order_mode: str = "MANUAL_APPROVAL"


def compute_sha256_fingerprint(public_key_str: str) -> str:
    """Computes a canonical SHA-256 colon-delimited hex fingerprint of a public key."""
    digest = hashlib.sha256(public_key_str.encode("utf-8")).hexdigest()
    # Format as SHA256:xx:xx:... (standard SSH/TLS fingerprint format)
    formatted = ":".join(digest[i:i+2] for i in range(0, len(digest), 2))
    return f"SHA256:{formatted}"


class DeviceSecurityAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_id: str
    device_id: Optional[str] = None
    alert_type: str  # SUSPICIOUS_ACCOUNT_SHARING, CONFLICTING_FINGERPRINT, REVOKED_DEVICE_POLLING, RAPID_IP_JUMP
    severity: AlertSeverity
    details: Dict[str, Any] = Field(default_factory=dict)
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class EnrichedDeviceRecord(BaseModel):
    id: str
    shop_id: str
    device_identifier: str
    name: str
    os_info: str
    status: str
    public_key_fingerprint: str
    hardware_assurance: HardwareAssurance
    agent_version: str
    paired_at: datetime
    last_seen_at: datetime
    is_online: bool
    ip_history: List[str] = Field(default_factory=list)
    unlimited_printers_entitled: bool = True


class LicenseService:
    def __init__(self):
        # Maps device_id -> HardwareAssurance
        self._hardware_assurance: Dict[str, HardwareAssurance] = {}
        # Maps device_id -> agent_version
        self._agent_versions: Dict[str, str] = {}
        # Maps device_id -> list of recent IP addresses
        self._device_ips: Dict[str, List[Tuple[str, datetime]]] = {}
        # List of security alerts
        self._alerts: List[DeviceSecurityAlert] = []
        self._failed_attempts: Dict[str, List[datetime]] = {}
        self._canonical_licenses: Dict[str, CanonicalLicense] = {}
        self._registered_devices: Dict[str, Dict[str, Any]] = {}
        self._init_defaults()

    def _init_defaults(self):
        dev_a_id = "d1111111-0000-0000-0000-000000000001"
        self._hardware_assurance[dev_a_id] = HardwareAssurance.TPM_2_0
        self._agent_versions[dev_a_id] = "1.2.0"
        self._device_ips[dev_a_id] = [("192.168.1.100", datetime.utcnow())]

    def set_device_metadata(
        self,
        device_id: str,
        assurance: HardwareAssurance = HardwareAssurance.TPM_2_0,
        agent_version: str = "1.2.0",
        ip_address: Optional[str] = None,
    ):
        self._hardware_assurance[device_id] = assurance
        self._agent_versions[device_id] = agent_version
        if ip_address:
            self.record_device_ip(device_id, ip_address)

    def record_device_ip(self, device_id: str, ip_address: str, shop_id: Optional[str] = None):
        """Records IP checkin and checks for suspicious account sharing or rapid IP jumps."""
        now = datetime.utcnow()
        if device_id not in self._device_ips:
            self._device_ips[device_id] = []

        history = self._device_ips[device_id]
        if history:
            last_ip, last_time = history[-1]
            # If IP changed within 60 seconds from completely different subnet, raise alert
            if last_ip != ip_address and (now - last_time).total_seconds() < 60:
                self._alerts.append(DeviceSecurityAlert(
                    shop_id=shop_id or "unknown",
                    device_id=device_id,
                    alert_type="RAPID_IP_JUMP",
                    severity=AlertSeverity.WARNING,
                    details={
                        "previous_ip": last_ip,
                        "new_ip": ip_address,
                        "delta_seconds": (now - last_time).total_seconds(),
                        "message": "Rapid IP change detected within 60s; potential credential sharing or VPN hopping."
                    }
                ))

        history.append((ip_address, now))
        # Keep last 10 entries
        self._device_ips[device_id] = history[-10:]

    def detect_account_sharing(self, shop_id: str, current_ip: str, public_key_pem: str) -> Optional[DeviceSecurityAlert]:
        """
        Detects if multiple independent agents are attempting to masquerade
        using the same shop pairing with conflicting cryptographic signatures or simultaneous IPs.
        """
        fingerprint = compute_sha256_fingerprint(public_key_pem)
        devices = device_service.list_devices(shop_id)

        # Check if another active device has same identifier but different fingerprint
        for d in devices:
            if d.status == "active":
                existing_fp = compute_sha256_fingerprint(d.public_key_pem)
                if existing_fp != fingerprint:
                    # Conflicting key pairing for same shop
                    alert = DeviceSecurityAlert(
                        shop_id=shop_id,
                        device_id=d.id,
                        alert_type="SUSPICIOUS_ACCOUNT_SHARING",
                        severity=AlertSeverity.CRITICAL,
                        details={
                            "existing_device_id": d.id,
                            "existing_fingerprint": existing_fp,
                            "attempted_fingerprint": fingerprint,
                            "attempted_ip": current_ip,
                            "message": "Simultaneous enrollment with conflicting cryptographic keypair. Suspected account sharing."
                        }
                    )
                    self._alerts.append(alert)
                    audit_service.record_event(
                        actor_type="SYSTEM",
                        action="SECURITY_ALERT_TRIGGERED",
                        resource_type="device",
                        resource_id=d.id,
                        shop_id=shop_id,
                        metadata=alert.details
                    )
                    return alert
        return None

    def list_enriched_devices(self, shop_id: str) -> List[EnrichedDeviceRecord]:
        """Returns full device list enriched with cryptographic fingerprints, hardware assurance, and online status."""
        records = device_service.list_devices(shop_id)
        now = datetime.utcnow()
        enriched = []

        for d in records:
            fp = compute_sha256_fingerprint(d.public_key_pem)
            assurance = self._hardware_assurance.get(d.id, HardwareAssurance.SOFTWARE_FALLBACK)
            version = self._agent_versions.get(d.id, "1.0.0")
            is_online = (d.status == "active" and (now - d.last_seen_at).total_seconds() <= 120)

            ips = [entry[0] for entry in self._device_ips.get(d.id, [])]
            enriched.append(EnrichedDeviceRecord(
                id=d.id,
                shop_id=d.shop_id,
                device_identifier=d.device_identifier,
                name=d.name,
                os_info=d.os_info,
                status=d.status,
                public_key_fingerprint=fp,
                hardware_assurance=assurance,
                agent_version=version,
                paired_at=d.paired_at,
                last_seen_at=d.last_seen_at,
                is_online=is_online,
                ip_history=ips,
                unlimited_printers_entitled=True  # Non-negotiable: all shops get unlimited printers
            ))
        return enriched

    def report_stolen_or_replaced_device(self, req: StolenDeviceReport, actor_id: str = "superadmin@printbot.in") -> Dict[str, Any]:
        """
        Instant revocation workflow for a stolen or replaced PC:
        1. Revokes the device and wipes all active access tokens immediately.
        2. Records high-priority audit event.
        3. Optionally generates a fresh single-use pairing code for the replacement workstation.
        """
        # Revoke the stolen device
        revoked = device_service.revoke_device(
            shop_id=req.shop_id,
            device_id=req.device_id,
            reason=f"Stolen/Replaced PC incident: {req.incident_notes}"
        )

        replacement_code = None
        if req.generate_replacement_pairing_code:
            code_res = device_service.create_pairing_code(
                shop_id=req.shop_id,
                created_by_staff_id=actor_id
            )
            replacement_code = code_res.code

        audit_service.record_event(
            actor_type="SUPERADMIN",
            actor_id=actor_id,
            action="DEVICE_STOLEN_INCIDENT_RESOLVED",
            resource_type="device",
            resource_id=req.device_id,
            shop_id=req.shop_id,
            metadata={
                "incident_notes": req.incident_notes,
                "replacement_code_issued": replacement_code is not None
            }
        )

        return {
            "status": "device_revoked_and_isolated",
            "revoked_device_id": req.device_id,
            "revoked_at": revoked.revoked_at.isoformat() if revoked.revoked_at else None,
            "replacement_pairing_code": replacement_code,
            "notice": "All active session tokens for the stolen workstation have been invalidated."
        }

    def list_alerts(self, shop_id: Optional[str] = None) -> List[DeviceSecurityAlert]:
        if shop_id:
            return [a for a in self._alerts if a.shop_id == shop_id]
        return list(self._alerts)

    def resolve_alert(self, alert_id: str, actor_id: str = "superadmin@printbot.in") -> DeviceSecurityAlert:
        for a in self._alerts:
            if a.id == alert_id:
                a.resolved = True
                a.resolved_at = datetime.utcnow()
                audit_service.record_event(
                    actor_type="SUPERADMIN",
                    actor_id=actor_id,
                    action="SECURITY_ALERT_RESOLVED",
                    resource_type="security_alert",
                    resource_id=alert_id,
                    shop_id=a.shop_id
                )
                return a
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert '{alert_id}' not found.")

    def register_canonical_license(self, record: CanonicalLicense):
        self._canonical_licenses[record.slug.lower().strip()] = record

    def revoke_workstation_device(self, shop_id: str, device_id: str, reason: str = "Decommissioned") -> bool:
        clean_dev_id = device_id.strip()
        dev = self._registered_devices.get(clean_dev_id)
        if dev and dev.get("shop_id") == shop_id:
            dev["status"] = "REVOKED"
            audit_service.record_event(
                actor_type="SYSTEM",
                actor_id="ADMIN",
                action="DEVICE_REVOKED",
                resource_type="device",
                resource_id=clean_dev_id,
                shop_id=shop_id,
                metadata={"reason": reason}
            )
            return True
        return False

    def validate_license(
        self,
        username: str,
        license_key: str,
        device_id: str,
        hardware_hash: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authoritative backend licence verification against canonical records:
        - Rate limiting: max 5 failed attempts in 15 minutes.
        - Constant-time HMAC comparison using server pepper.
        - Expiry and revocation checks on canonical records.
        - Workstation device ownership, quota, and revocation checks.
        - Issues authentic HMAC-SHA256 device pairing token.
        """
        now = datetime.utcnow()
        clean_user = username.strip().lower()

        # 1. Rate limiting check
        attempts = [t for t in self._failed_attempts.get(clean_user, []) if (now - t).total_seconds() < 900]
        self._failed_attempts[clean_user] = attempts
        if len(attempts) >= 5:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed validation attempts. Account temporarily locked for 15 minutes."
            )

        # 2. Keyed HMAC computation using server-only pepper
        pepper = getattr(settings, "LICENSE_PEPPER", settings.SECRET_KEY)
        clean_key = license_key.strip().upper()
        computed_hash = hmac.new(
            pepper.encode("utf-8"),
            clean_key.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        # 3. Lookup canonical shop license record
        lic = self._canonical_licenses.get(clean_user)
        if not lic:
            self._failed_attempts[clean_user].append(now)
            audit_service.record_event(
                actor_type="WORKSTATION",
                actor_id=device_id or "UNKNOWN",
                action="LICENSE_VALIDATION_FAILED",
                resource_type="license",
                resource_id=clean_user,
                shop_id=clean_user,
                metadata={"reason": "Shop not found"}
            )
            return {
                "success": False,
                "error": "Invalid shop username or licence key."
            }

        # 4. Constant-time HMAC match
        if not hmac.compare_digest(computed_hash, lic.license_key_hash):
            self._failed_attempts[clean_user].append(now)
            audit_service.record_event(
                actor_type="WORKSTATION",
                actor_id=device_id or "UNKNOWN",
                action="LICENSE_VALIDATION_FAILED",
                resource_type="license",
                resource_id=clean_user,
                shop_id=lic.shop_id,
                metadata={"reason": "Invalid key"}
            )
            return {
                "success": False,
                "error": "Invalid shop username or licence key."
            }

        # 5. Revocation, Activation & Expiry Invariants
        if lic.is_revoked:
            return {"success": False, "error": "Licence has been revoked or suspended."}

        if lic.starts_at > now:
            return {"success": False, "error": "Licence is not yet active."}

        if not lic.is_lifetime:
            if not lic.expires_at:
                return {"success": False, "error": "Subscription configuration error. Contact support."}
            if lic.expires_at <= now:
                return {"success": False, "error": f"Subscription expired on {lic.expires_at.strftime('%Y-%m-%d')}"}

        # 6. Device Verification, Ownership & Quota Enforcement
        clean_dev_id = device_id.strip()
        if not clean_dev_id:
            return {"success": False, "error": "Device identifier is required for workstation pairing."}

        existing_dev = self._registered_devices.get(clean_dev_id)
        if existing_dev:
            if existing_dev["shop_id"] != lic.shop_id:
                audit_service.record_event(
                    actor_type="WORKSTATION",
                    actor_id=clean_dev_id,
                    action="DEVICE_CROSS_SHOP_PAIRING_BLOCKED",
                    resource_type="device",
                    resource_id=clean_dev_id,
                    shop_id=lic.shop_id,
                    metadata={"attempted_shop": lic.shop_id, "registered_shop": existing_dev["shop_id"]}
                )
                return {"success": False, "error": "Workstation is already paired to another shop. Cross-shop access denied."}

            if existing_dev.get("status") == "REVOKED":
                return {"success": False, "error": "This workstation device has been revoked by the administrator. Contact support."}

            existing_dev["last_heartbeat"] = now
            if hardware_hash:
                existing_dev["hardware_hash"] = hardware_hash
        else:
            active_devices = [d for d in self._registered_devices.values() if d["shop_id"] == lic.shop_id and d.get("status") == "ACTIVE"]
            if len(active_devices) >= lic.max_devices:
                return {"success": False, "error": f"Device quota exceeded: Maximum of {lic.max_devices} active workstations allowed."}

            self._registered_devices[clean_dev_id] = {
                "shop_id": lic.shop_id,
                "device_id": clean_dev_id,
                "hardware_hash": hardware_hash or "UNKNOWN_HARDWARE",
                "status": "ACTIVE",
                "last_heartbeat": now,
                "paired_at": now
            }

        # Clear failed attempts on success
        self._failed_attempts.pop(clean_user, None)

        # 7. Generate authentic signed device token using HMAC-SHA256 with server pepper
        exp_ts = int(time.time()) + (30 * 86400)
        token_payload = f"{lic.shop_id}:{clean_dev_id}:{exp_ts}"
        sig = hmac.new(pepper.encode("utf-8"), token_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        device_token = f"devtoken:{token_payload}:{sig}"

        audit_service.record_event(
            actor_type="WORKSTATION",
            actor_id=clean_dev_id,
            action="LICENSE_VALIDATION_SUCCESS",
            resource_type="license",
            resource_id=lic.shop_id,
            shop_id=lic.shop_id,
            metadata={"plan": lic.plan}
        )

        return {
            "success": True,
            "shop_id": lic.shop_id,
            "shop_name": lic.shop_name,
            "slug": lic.slug,
            "city": lic.city,
            "contact_phone": lic.contact_phone,
            "plan": lic.plan,
            "is_lifetime": lic.is_lifetime,
            "expires_at": lic.expires_at.isoformat() if lic.expires_at else None,
            "rates": lic.rates,
            "order_mode": lic.order_mode,
            "device_id": clean_dev_id,
            "device_token": device_token,
        }

    def clear(self):
        self._hardware_assurance.clear()
        self._agent_versions.clear()
        self._device_ips.clear()
        self._alerts.clear()
        self._failed_attempts.clear()
        self._canonical_licenses.clear()
        self._registered_devices.clear()
        self._init_defaults()


license_service = LicenseService()
