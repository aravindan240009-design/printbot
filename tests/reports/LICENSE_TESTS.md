# Windows Desktop Licensing, Subscriptions & Device Identity Report

## 1. Commercial Licensing Model & Non-Negotiables
1. **Single Plan Only**: Exactly ONE all-inclusive subscription plan (₹999/month or ₹9,990/year). Zero feature tiering, no premium add-ons, and no software commissions.
2. **Unlimited Printers**: Every subscribed shop is entitled to register and route to UNLIMITED printers.
3. **Copyable Windows Installer (.exe/.msi)**: The platform owner sells the exact same binary to all Xerox shops. Copying the installer is explicitly permitted; access is controlled via authenticated shop pairing and short-lived, revocable asymmetric credentials.

---

## 2. Windows Device Pairing & Licensing Verification

Verified across `tests/phase1/test_device_enrollment.py`, `tests/phase6/test_superadmin_hardening.py`, and `tests/phase8/test_enterprise_integration_and_hardening.py`:

| Test ID | Licensing Scenario | Input Condition | Expected Behavior | Observed Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **LIC-001** | Unpaired Workstation Startup | Clean install of Tauri desktop EXE | Agent requests pairing code; access to queues blocked | Unpaired mode; requests 6-digit code | **PASS** |
| **LIC-002** | Authorized One-Time Pairing | Shop owner issues short-lived pairing code | Server links workstation ID, issues asymmetric challenge | Device securely paired | **PASS** |
| **LIC-003** | Expired Pairing Code Rejection | Pairing attempt with code expired (> 15 min) | Server rejects pairing code with `400 Bad Request` | Code rejected | **PASS** |
| **LIC-004** | Copied Installer / Rogue Device Block | Cloned machine attempts to reuse pairing code | Server blocks unauthorized workstation activation | Rogue clone blocked | **PASS** |
| **LIC-005** | Remote Workstation Revocation | Superadmin or Shop Owner revokes workstation | Active session invalidated; queue claim returns `403` | Revocation enforced in real-time | **PASS** |
| **LIC-006** | Single All-Inclusive Plan Enforcement | Superadmin views subscription catalog | Only 1 plan exists (₹999/mo or ₹9,990/yr); 0 tier flags | Single plan enforced across all shops | **PASS** |
| **LIC-007** | Unlimited Printers Assertion | Shop registers 10, 50, and 100 printers | System registers all devices without license limits | 100 printers registered without error | **PASS** |
| **LIC-008** | Offline Lease Expiration Safety | Workstation disconnected from network > lease time | Workstation pauses automatic spooling until reconnect | Offline lease safely enforced | **PASS** |
| **LIC-009** | Reconnection & Heartbeat Resumption | Offline workstation restores network connection | Workstation performs mutual auth and resumes queues | Queue seamlessly reconnected | **PASS** |
| **LIC-010** | Subscription Expiry Workstation Behavior | Shop subscription lapses into unpaid state | Agent blocks new job dispatch; holds in `PAID_HELD` | In-flight orders protected | **PASS** |

---

## 3. Asymmetric Cryptographic Enrollment
- **Hardware Assurance**: Workstation identity generates an Ed25519/ECDSA keypair backed by Windows TPM 2.0 Platform Crypto Provider where available, with software DPAPI key storage fallback.
- **Challenge-Response**: Server sends a random 32-byte cryptographic nonce (`challenge_nonce`). The workstation signs the nonce with its private key; the server verifies the signature against the registered public key before granting a short-lived bearer token (60-minute TTL).
- **Public Keys Only**: Private keys never leave the shop PC. The server stores only public key fingerprints.
