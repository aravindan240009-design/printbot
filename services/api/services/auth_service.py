"""

Authentication, RBAC, Superadmin MFA, and Support Impersonation Service.

- Passwords hashed using PBKDF2-SHA256 with 600,000 iterations and random salt.

- Pure RFC 6238 TOTP engine for superadmin MFA.

- Role-Based Access Control (RBAC) across OWNER, MANAGER, OPERATOR, SUPERADMIN.

- Explicit, short-lived, audited support impersonation with zero default document access.

"""



import os
import json

import time

import struct

import hmac

import hashlib

import base64

import secrets

from datetime import datetime, timedelta

from typing import Dict, List, Optional, Set, Any

from fastapi import HTTPException, status

from pydantic import BaseModel, EmailStr

from services.api.core.config import settings

from services.api.services.audit_service import audit_service





PBKDF2_ITERATIONS = 600_000
AUTH_STORE_FILE = os.path.join(os.path.dirname(__file__), ".auth_credentials.json")





def hash_password(password: str) -> str:

    """Hashes password with PBKDF2-SHA256 and random 16-byte salt."""

    salt = secrets.token_bytes(16)

    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)

    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${base64.b64encode(salt).decode('ascii')}${base64.b64encode(dk).decode('ascii')}"





def verify_password(plain_password: str, hashed_password: str) -> bool:

    """Verifies password against PBKDF2-SHA256 hash in constant time."""

    try:

        parts = hashed_password.split("$")

        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":

            return False

        iterations = int(parts[1])

        salt = base64.b64decode(parts[2].encode("ascii"))

        expected_dk = base64.b64decode(parts[3].encode("ascii"))

        actual_dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)

        return hmac.compare_digest(expected_dk, actual_dk)

    except Exception:

        return False





# ------------------------------------------------------------------------------

# RFC 6238 TOTP MFA Engine

# ------------------------------------------------------------------------------



def generate_totp_secret() -> str:

    """Generates standard Base32 encoded 160-bit secret for Google Authenticator / standard TOTP apps."""

    random_bytes = secrets.token_bytes(20)

    return base64.b32encode(random_bytes).decode("ascii")





def compute_totp_code(secret_b32: str, time_step: Optional[int] = None) -> str:

    """Computes standard 6-digit TOTP code for the current 30-second window."""

    if time_step is None:

        time_step = int(time.time() // 30)

    key = base64.b32decode(secret_b32, casefold=True)

    msg = struct.pack(">Q", time_step)

    digest = hmac.new(key, msg, hashlib.sha1).digest()

    offset = digest[-1] & 0x0F

    code_int = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF

    return f"{code_int % 1_000_000:06d}"





def verify_totp(secret_b32: str, user_code: str, window: int = 1) -> bool:

    """Verifies TOTP code with +/- window steps tolerance for clock drift."""

    current_step = int(time.time() // 30)

    for step in range(current_step - window, current_step + window + 1):

        if hmac.compare_digest(compute_totp_code(secret_b32, step), user_code.strip()):

            return True

    return False





# ------------------------------------------------------------------------------

# RBAC Permissions Matrix

# ------------------------------------------------------------------------------



ROLE_PERMISSIONS: Dict[str, Set[str]] = {

    "SUPERADMIN": {

        "shops:read", "shops:write", "subscriptions:override", "audit:read",

        "impersonate:create", "system:manage"

    },

    "OWNER": {

        "orders:read", "orders:write", "orders:approve", "orders:delete",

        "printers:manage", "devices:pair", "devices:revoke",

        "pricing:write", "settings:write", "staff:manage", "billing:read"

    },

    "MANAGER": {

        "orders:read", "orders:write", "orders:approve",

        "printers:manage", "devices:pair", "pricing:read", "settings:read"

    },

    "OPERATOR": {

        "orders:read", "orders:approve", "printers:status"

    }

}





class UserAccount(BaseModel):

    id: str

    email: EmailStr

    password_hash: str

    full_name: str

    is_superadmin: bool = False

    mfa_enabled: bool = False

    mfa_secret: Optional[str] = None

    shop_id: Optional[str] = None

    role: str = "OPERATOR"





class AuthService:

    def __init__(self):

        self._users: Dict[str, UserAccount] = {}

        self._active_sessions: Dict[str, Dict[str, Any]] = {}

        self._init_default_users()



    def _init_default_users(self):

        # 1. Superadmin User

        super_totp = os.getenv("SUPERADMIN_MFA_SECRET") or generate_totp_secret()

        mfa_enabled = os.getenv("SUPERADMIN_MFA_ENABLED", "false").lower() in ("true", "1", "yes")

        self.register_user(

            email="superadmin@printbot.in",

            password=os.getenv("SUPERADMIN_PASSWORD", "SuperAdminSecurePassword2026!"),

            full_name="Platform Superadmin",

            is_superadmin=True,

            mfa_enabled=mfa_enabled,

            mfa_secret=super_totp,

            role="SUPERADMIN"

        )



        # 2. Shop A Owner (Anna University Quick Xerox)

        self.register_user(

            email="owner@annaxerox.com",

            password="AnnaShopPassword2026!",

            full_name="Anna Shop Owner",

            shop_id="11111111-1111-1111-1111-111111111111",

            role="OWNER"

        )



        # 3. Shop B Owner (Bharat Fast Prints)

        self.register_user(

            email="owner@bharatprints.com",

            password="BharatShopPassword2026!",

            full_name="Bharat Shop Owner",

            shop_id="22222222-2222-2222-2222-222222222222",

            role="OWNER"

        )



            # Hydrate any persisted password hashes across API restarts
        if os.path.exists(AUTH_STORE_FILE):
            try:
                with open(AUTH_STORE_FILE, "r", encoding="utf-8") as f:
                    persisted = json.load(f)
                    for email, p_hash in persisted.items():
                        if email in self._users:
                            self._users[email].password_hash = p_hash
            except Exception:
                pass

    def register_user(

        self,

        email: str,

        password: str,

        full_name: str,

        is_superadmin: bool = False,

        mfa_enabled: bool = False,

        mfa_secret: Optional[str] = None,

        shop_id: Optional[str] = None,

        role: str = "OPERATOR"

    ) -> UserAccount:

        user_id = secrets.token_hex(16)

        user = UserAccount(

            id=user_id,

            email=email.lower(),

            password_hash=hash_password(password),

            full_name=full_name,

            is_superadmin=is_superadmin,

            mfa_enabled=mfa_enabled,

            mfa_secret=mfa_secret,

            shop_id=shop_id,

            role=role

        )

        self._users[user.email] = user

        return user



    def authenticate_staff(

        self,

        email: str,

        password: str,

        totp_code: Optional[str] = None,

        ip_address: Optional[str] = None

    ) -> Dict[str, Any]:

        email_clean = email.lower().strip()

        if email_clean == "admin":

            email_clean = "superadmin@printbot.in"

        user = self._users.get(email_clean)

        if not user or not verify_password(password, user.password_hash):

            raise HTTPException(

                status_code=status.HTTP_401_UNAUTHORIZED,

                detail="Invalid email or password."

            )



        # Superadmin requires MFA if enabled or TOTP code is provided

        if user.mfa_enabled:

            if not totp_code:

                raise HTTPException(

                    status_code=status.HTTP_403_FORBIDDEN,

                    detail="MFA_REQUIRED: Multi-factor authentication code required."

                )

            if not user.mfa_secret or not verify_totp(user.mfa_secret, totp_code):

                raise HTTPException(

                    status_code=status.HTTP_401_UNAUTHORIZED,

                    detail="Invalid MFA verification code."

                )

        elif totp_code and user.mfa_secret:

            if not verify_totp(user.mfa_secret, totp_code):

                raise HTTPException(

                    status_code=status.HTTP_401_UNAUTHORIZED,

                    detail="Invalid MFA verification code."

                )



        session_token = f"sess_{secrets.token_urlsafe(32)}"

        now = datetime.utcnow()

        session_data = {

            "session_token": session_token,

            "user_id": user.id,

            "email": user.email,

            "full_name": user.full_name,

            "is_superadmin": user.is_superadmin,

            "shop_id": user.shop_id,

            "role": user.role,

            "permissions": list(ROLE_PERMISSIONS.get(user.role, set())),

            "is_impersonation": False,

            "can_access_documents": True if user.shop_id else False,

            "created_at": now,

            "expires_at": now + timedelta(hours=24)

        }

        self._active_sessions[session_token] = session_data



        audit_service.record_event(

            actor_type="SUPERADMIN" if user.is_superadmin else "STAFF",

            actor_id=user.id,

            action="STAFF_LOGIN",

            resource_type="session",

            resource_id=f"sess_{hashlib.sha256(session_token.encode()).hexdigest()[:12]}...",

            shop_id=user.shop_id,

            ip_address=ip_address

        )

        return session_data



    def create_support_impersonation_session(

        self,

        superadmin_session_token: str,

        target_shop_id: str,

        reason: str,

        duration_minutes: int = 15,

        ip_address: Optional[str] = None

    ) -> Dict[str, Any]:

        """

        Creates a time-bounded, explicit, audited support impersonation session.

        CRITICAL PRIVACY RULE: Support users have NO default access to customer documents.

        """

        admin_session = self.get_session(superadmin_session_token)

        if not admin_session or not admin_session.get("is_superadmin"):

            raise HTTPException(

                status_code=status.HTTP_403_FORBIDDEN,

                detail="Only platform superadmins can initiate support impersonation."

            )



        if not reason or len(reason.strip()) < 10:

            raise HTTPException(

                status_code=status.HTTP_400_BAD_REQUEST,

                detail="Impersonation requires a formal ticket/support reason (min 10 characters)."

            )



        impersonation_token = f"imp_{secrets.token_urlsafe(32)}"

        now = datetime.utcnow()

        session_data = {

            "session_token": impersonation_token,

            "user_id": admin_session["user_id"],

            "email": admin_session["email"],

            "full_name": f"Support Impersonation ({admin_session['full_name']})",

            "is_superadmin": False,

            "shop_id": target_shop_id,

            "role": "MANAGER",

            "permissions": list(ROLE_PERMISSIONS["MANAGER"]),

            "is_impersonation": True,

            "impersonation_reason": reason,

            "impersonator_id": admin_session["user_id"],

            "can_access_documents": False,  # STRICT: zero default access to customer document contents

            "created_at": now,

            "expires_at": now + timedelta(minutes=duration_minutes)

        }

        self._active_sessions[impersonation_token] = session_data



        audit_service.record_event(

            actor_type="SUPERADMIN",

            actor_id=admin_session["user_id"],

            action="START_SUPPORT_IMPERSONATION",

            resource_type="shop",

            resource_id=target_shop_id,

            shop_id=target_shop_id,

            metadata={"reason": reason, "duration_minutes": duration_minutes},

            ip_address=ip_address

        )

        return session_data



    def get_session(self, session_token: str) -> Optional[Dict[str, Any]]:

        session = self._active_sessions.get(session_token)

        if not session:

            return None

        if datetime.utcnow() > session["expires_at"]:

            del self._active_sessions[session_token]

            return None

        return session



    def check_permission(self, session: Dict[str, Any], required_permission: str) -> bool:

        if session.get("is_superadmin"):

            return True

        permissions = session.get("permissions", [])

        return required_permission in permissions



    def change_password(

        self,

        user_id: str,

        current_password: str,

        new_password: str,

        ip_address: Optional[str] = None

    ) -> bool:

        target_user: Optional[UserAccount] = None

        for user in self._users.values():

            if user.id == user_id:

                target_user = user

                break



        if not target_user:

            raise HTTPException(

                status_code=status.HTTP_404_NOT_FOUND,

                detail="User account not found."

            )



        if not verify_password(current_password, target_user.password_hash):

            raise HTTPException(

                status_code=status.HTTP_401_UNAUTHORIZED,

                detail="Current password does not match."

            )



        if len(new_password) < 6:

            raise HTTPException(

                status_code=status.HTTP_400_BAD_REQUEST,

                detail="New password must be at least 6 characters."

            )



        # Overwrite password hash using PBKDF2-SHA256 - immediately invalidates previous password

        target_user.password_hash = hash_password(new_password)
        try:
            persisted = {}
            if os.path.exists(AUTH_STORE_FILE):
                with open(AUTH_STORE_FILE, "r", encoding="utf-8") as f:
                    persisted = json.load(f)
            persisted[target_user.email] = target_user.password_hash
            with open(AUTH_STORE_FILE, "w", encoding="utf-8") as f:
                json.dump(persisted, f)
        except Exception:
            pass



        audit_service.record_event(

            actor_type="SUPERADMIN" if target_user.is_superadmin else "STAFF",

            actor_id=user_id,

            action="PASSWORD_UPDATED",

            resource_type="user",

            resource_id=user_id,

            shop_id=target_user.shop_id,

            ip_address=ip_address

        )

        return True



    def clear(self):

        self._users.clear()

        self._active_sessions.clear()

        self._init_default_users()





auth_service = AuthService()

