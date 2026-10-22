# Print Bot Support & Incident Response Runbook

**Audience:** Platform Superadmins, Support Engineers, Shop Owners, Workstation Technicians  
**Classification:** Operational Runbook & Incident Protocols  
**Core Invariant:** Customer document content is NEVER viewed or exported during support operations.

---

## 1. Platform Support Roles & Privileges

Support staff operate under strictly bounded role scopes with mandatory audit trail logging:

| Support Role | Scope of Access | Permitted Actions | Forbidden Actions |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Platform-wide root | Onboard/suspend shops, manage releases, trigger DR drills, apply manual credits, view system KPIs. | Cannot download raw customer uploaded PDFs without cryptographic customer key release. |
| **`SUPPORT_OPERATOR`** | Bounded emergency triage | Initiate break-glass sessions, view printer capability snapshots, inspect queue latency, re-route stuck jobs. | Cannot change billing plans, view banking details, or export ledger keys. |
| **`AUDITOR`** | Read-only compliance | Traverse cryptographic audit hash chains, inspect GST tax records, verify RLS policy compliance reports. | Cannot modify configurations or restart service pipelines. |

---

## 2. Emergency Break-Glass Support SOP

When a shop operator reports an active outage, queue deadlock, or urgent pairing failure during commercial hours:

### Step 1: Request Break-Glass Authorization
- Support engineer initiates a time-bounded request via API:
  `POST /api/v1/superadmin/break-glass`
  Payload:
  ```json
  {
    "shop_id": "11111111-1111-1111-1111-111111111111",
    "reason": "Queue lockup on workstation 2 during peak college exam rush",
    "duration_minutes": 30
  }
  ```
- Maximum session lifetime is hard-capped at **60 minutes**.
- The server generates a single-use token `bg_<hash>` and anchors a block to the immutable audit hash chain.

### Step 2: Zero Document Access Verification
- The break-glass session token explicitly carries `can_access_documents: false`.
- Any attempt to access `/api/v1/assets/{asset_id}/download` will return `403 Forbidden` with audit alert.
- Support engineers inspect only operational metadata: queue depth, error codes, printer capability flags, and raster duration ms.

### Step 3: Deactivation & Session Close
- Upon issue resolution, the session automatically expires, or can be explicitly revoked.
- An incident summary is appended to the shop's immutable audit log.

---

## 3. Stolen or Replaced Workstation Incident SOP

If a shop counter PC is reported stolen, replaced, or suffers catastrophic hardware failure:

### Step 1: Immediate Credential Revocation
1. Call the stolen device isolation endpoint:
   `POST /api/v1/licenses/devices/{device_id}/stolen`
   Payload:
   ```json
   {
     "device_id": "d1111111-0000-0000-0000-000000000001",
     "shop_id": "11111111-1111-1111-1111-111111111111",
     "incident_notes": "Counter PC motherboard burnt out; replacing with spare Dell OptiPlex",
     "generate_replacement_pairing_code": true
   }
   ```
2. The server instantly invalidates all rotating tokens for this device. Any subsequent Named Pipe or WebSocket connections from the compromised PC will be rejected with `401 Unauthorized`.

### Step 2: Job Safety & Recovery
- All in-flight jobs previously leased by the decommissioned workstation are safely transitioned to `PAID_HELD` via:
  `POST /api/v1/fleet/devices/{device_id}/safety`
- **Zero auto-reprints:** Jobs are held in escrow for explicit triage by the replacement workstation.

### Step 3: Enrolling the Replacement Workstation
1. Install the official `PrintBotAgent-Setup.exe` on the replacement PC.
2. Launch the desktop wizard and enter the 6-character replacement pairing code generated in Step 1.
3. The replacement workstation registers its new Ed25519 public key (TPM 2.0 backed where available).
4. Outstanding `PAID_HELD` jobs become available for leasing.

---

## 4. Subscription Dunning & Past-Due Escalation SOP

When automated recurring renewal payment fails:

| Dunning Stage | Time Elapsed | System State | Customer Impact | Support Action |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1: Past Due** | Day 0 (Failed charge) | `PAST_DUE` | None. Printing proceeds normally. Banner displayed in shop dashboard. | Automated notification dispatched to shop owner email/phone. |
| **Stage 2: Grace Period** | Day 2 | `GRACE` | Normal operations continue. Daily retry attempts triggered. | Support operator initiates reminder call. Verify UPI ID or merchant card validity. |
| **Stage 3: Suspension** | Day 7 | `SUSPENDED` | New print orders blocked from intake. Existing paid orders preserved. | Owner must settle overdue invoice via dashboard or request temporary override. |

---

## 5. Ambiguous Print Job (`COMPLETION_UNKNOWN`) Triage

When a Windows print spooler job disappears or reports an ambiguous outcome due to a paper jam, offline cable, or printer buffer overflow:

1. **State Transition:** The background agent marks the job `COMPLETION_UNKNOWN`.
2. **Strict Guardrail:** The system **NEVER** issues an automatic reprint. In an Indian print shop environment, automatic reprints cause wasted paper, duplicate charges, or customer disputes.
3. **Supervised Resolution:**
   - Operator checks the physical printer output tray.
   - If paper exited successfully: Operator clicks **Mark Delivered** in Tauri UI (`POST /orders/{id}/delivered`).
   - If paper was mangled/jammed: Operator clears jam and clicks **Manual Reprint** (`POST /orders/{id}/reprint`).
   - If customer refuses to wait: Operator clicks **Issue Refund** (`POST /orders/{id}/refund`), returning funds to customer UPI escrow ledger.

---

## 6. Disaster Recovery & Database Restoration SOP

In the event of a catastrophic cloud outage or storage data corruption:

1. **Point-in-Time Recovery Drill Execution:**
   - Run verification drill:
     `POST /api/v1/superadmin/drills/backup-restore`
   - Verifies PostgreSQL WAL replication and SeaweedFS object storage backup mirrors.
2. **Target Objectives:**
   - **RTO (Recovery Time Objective):** < 15 minutes.
   - **RPO (Recovery Point Objective):** < 1 minute (Valkey persistent AOF + PostgreSQL streaming WAL).
3. **Post-Restore Integrity Validation:**
   - Verify all 26 Phase 1 tables + 6 Phase 6 tables have active Row-Level Security (`FORCE ROW LEVEL SECURITY`).
   - Verify cryptographic audit hash chain integrity:
     `GET /api/v1/superadmin/audit/chain-verify` -> confirms `tamper_evident_valid: true`.
