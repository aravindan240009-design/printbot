# Print Bot Commercial Pilot Test Plan & Acceptance Matrix

**Version:** 1.0.0-phase6  
**Status:** READY FOR COMMERCIAL PILOT DISPATCH  
**Target Environment:** 5–10 Independent Indian Xerox & Digital Print Shops  
**Hardware Readiness Status:** Real-hardware gate marked `BLOCKED/UNVERIFIED` until on-site printer verification.

---

## 1. Pilot Shop Cohort & Demographics

The pilot targets 5–10 real-world independent Xerox shops across Tier-1 and Tier-2 Tamil Nadu cities to evaluate diverse commercial workloads, electricity/network fluctuations, and varying operator digital literacy.

| Pilot Shop ID | Shop Name & Location | Workstations | Connected Printers | Primary Workload | Default Mode | Language Preference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PILOT-01-CHN` | Anna Xerox, Guindy, Chennai | 2x Windows 11 PCs | Canon iR 2525 + HP LaserJet M1005 | College notes, engineering blueprints, govt certificates | `FULL_AUTOMATIC` | Tamil / English |
| `PILOT-02-CBE` | Ganga Digital Prints, Gandhipuram, Coimbatore | 3x Windows 10 PCs | Epson EcoTank L3250 + Brother HL-L2321D | Color photo prints, passport photos, invoices | `MANUAL_APPROVAL` | Tamil |
| `PILOT-03-MDU` | Meenakshi Copy House, Simmakkal, Madurai | 1x Windows 11 PC | Canon iR-ADV C3530i + HP LaserJet 1020 | High-volume legal documents, book copying | `FULL_AUTOMATIC` | Tamil / English |
| `PILOT-04-TRY` | Thillai Print Hub, Thillai Nagar, Trichy | 2x Windows 11 PCs | HP LaserJet Enterprise M608 + Epson L805 | School projects, ID cards, exam answer sheets | `MANUAL_APPROVAL` | Tamil / English |
| `PILOT-05-SLM` | Salem Express Xerox, Junction Road, Salem | 1x Windows 10 PC | Ricoh Aficio MP 2014 + Brother DCP-T520W | Court petitions, land deed photocopies, Aadhaar/PAN | `MANUAL_APPROVAL` | Tamil |

---

## 2. Printer & Driver Class Matrix

To eliminate proprietary driver lock-in, the pilot validates five ubiquitous printer communication classes:

| Class ID | Manufacturer & Family | Native PDL / Driver | Test Hardware | Target Behavior & Constraints |
| :--- | :--- | :--- | :--- | :--- |
| **CLASS-01-PCL** | HP LaserJet Series | PCL 6 (PCL-XL) | HP LaserJet M1005 / M608 | Direct raster or GDI spooler stream; duplex long/short edge verification. |
| **CLASS-02-UFR** | Canon imageRUNNER | UFR II / UFR II LT | Canon iR 2525 / C3530i | Ultra Fast Rendering; verifies tray selection (A4 vs A3) and collation. |
| **CLASS-03-ESCPR** | Epson EcoTank Inkjet | ESC/P-R raster | Epson EcoTank L3250 / L805 | Fine color photo screening; 8-up passport photo alignment; borderless margins. |
| **CLASS-04-BRPOST** | Brother HL / DCP Series | PostScript 3 / BR-Script | Brother HL-L2321D | High-speed monochrome legal rendering; manual bypass tray handling. |
| **CLASS-05-GENERIC** | Universal Windows Spooler | Generic / Text / RAW Spool | Windows Spooler Simulator | Fallback path; verifies Win32 `WritePrinter` raw byte injection safety. |

---

## 3. Client & Mobile Device Matrix

Tests walk-in customer self-service on constrained cellular networks (Jio / Airtel 4G) and budget smartphones:

| Client ID | Hardware Model | Operating System | Browser | Test Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **CLI-01-AND-BUDGET** | Redmi 9A / Realme C-series (<₹8,000) | Android 10/11 Go | Chrome Mobile | Under 1.5s initial interactive load; 44px touch targets; no jank during PDF preview. |
| **CLI-02-AND-MID** | Samsung Galaxy M14 / Redmi Note 12 | Android 13/14 | Chrome Mobile | Instant camera scan-to-PDF multi-frame intake; WebRTC orientation sensor. |
| **CLI-03-IOS-SAFARI** | iPhone 11 / 13 / SE | iOS 16 / 17 | Mobile Safari | Safari canvas memory limits (<256MB); view transition animations; Apple Pay / UPI deep-link. |
| **CLI-04-DESK-TAURI** | Intel Core i3 / 8GB RAM Counter PC | Windows 11 23H2 | Tauri 2 WebView2 | Operator triage dashboard; memory footprint <120MB; Named Pipe IPC resilience. |

---

## 4. Formal Pilot Acceptance Criteria & Verification Matrix

| Acceptance ID | Category | Requirement / Invariant | Automated Test Coverage | Pilot Field Verification Gate | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ACC-01-PLAN** | Commercial | Exactly ONE all-inclusive plan (₹999/mo or ₹9,990/yr); UNLIMITED printers per shop. | `test_single_all_inclusive_plan_enforcement` | Confirm shop dashboard displays all features unlocked and zero printer registration limits. | **PASSED (Automated)** / Pending Field Verification |
| **ACC-02-RLS** | Security | Strict PostgreSQL Row-Level Security; Shop B cannot read Shop A orders, devices, or invoices. | `test_cross_tenant_negative_isolation_and_support_rbac`, `test_tenant_isolation_exhaustive` | Confirm database queries with Shop B session token reject Shop A records with 403 / 0 rows. | **PASSED (Automated)** |
| **ACC-03-GST** | Billing | Official Indian GST tax invoice (18% GST with CGST 9% + SGST 9% or IGST 18%, SAC 998313). | `test_indian_gst_tax_invoice_generation` | Cross-check generated monthly tax invoice against Indian GST Portal schema. | **PASSED (Automated)** |
| **ACC-04-FINGER** | Licensing | Ed25519 public-key SHA-256 colon fingerprinting (`SHA256:xx:xx:...`); zero private keys stored on server. | `test_license_center_device_enrichment_and_fingerprints` | Inspect license center dashboard to verify fingerprint display matches workstation local certificate. | **PASSED (Automated)** |
| **ACC-05-STOLEN** | Security | Instant revocation on stolen/replaced PC; immediate token invalidation; replacement code issued. | `test_stolen_or_replaced_pc_instant_revocation` | Trigger stolen PC report on counter workstation; confirm active Named Pipe closes and rejects jobs. | **PASSED (Automated)** |
| **ACC-06-SHARING** | Security | Conflicting public key pairing or rapid geo IP jump triggers CRITICAL security alert. | `test_suspicious_account_sharing_detection`, `test_rapid_ip_jump_detection` | Attempt enrolling second PC using cloned pairing credentials; verify alert raised. | **PASSED (Automated)** |
| **ACC-07-SAFETY** | Reliability | Revoked or powered-off PC preserves active leased jobs in `PAID_HELD`; ZERO automatic reprints. | `test_device_revocation_safety_preserves_paid_jobs` | Hard shutdown counter PC mid-print; verify cloud job transitions to `PAID_HELD` rather than lost. | **PASSED (Automated)** |
| **ACC-08-DUNNING** | Billing | Failed subscription renewal follows 3-stage dunning (`PAST_DUE` -> `GRACE` -> `SUSPENDED`). | `test_subscription_dunning_lifecycle` | Simulate renewal failure webhook; verify shop enters 5-day grace before suspension. | **PASSED (Automated)** |
| **ACC-09-BREAKGLS** | Privacy | Break-glass emergency platform support strictly prohibits customer document downloads. | `test_break_glass_emergency_support_protocol` | Superadmin initiates emergency session; attempt PDF asset fetch; confirm 403 Forbidden. | **PASSED (Automated)** |
| **ACC-10-AUDIT** | Audit | Cryptographic SHA-256 hash chaining detects any tampered or deleted audit trail event. | `test_cryptographic_audit_hash_chain_tamper_evidence` | Run automated chain verify; confirm error raised if database row hash is modified. | **PASSED (Automated)** |
| **ACC-11-STEPUP** | Security | High-risk actions (shop shredding, suspension) require step-up authentication via password or TOTP. | `test_step_up_reauth_challenge_and_verification` | Attempt data shredding without step-up challenge; verify 403 rejection. | **PASSED (Automated)** |
| **ACC-12-CANARY** | Fleet | Signed software release channels (`production_signed`, `beta_tested`); canary percentages; forced critical updates. | `test_fleet_release_channels_and_canary_rollout`, `test_fleet_forced_critical_update_policy` | Verify agent prompts for critical update when version is below security baseline. | **PASSED (Automated)** |
| **ACC-13-TELEMET** | Privacy | Agent telemetry strictly limited to operational metrics (raster ms, sheets, errors); ZERO customer PII or filenames. | `test_content_free_telemetry_privacy_compliance` | Packet capture agent outbound telemetry; verify payload contains no customer or document text. | **PASSED (Automated)** |
| **ACC-14-REDACT** | Privacy | Diagnostic bundle upload requires operator consent and automatically scrubs Windows paths and LAN IPs. | `test_diagnostic_bundle_automated_redaction` | Submit diagnostic report with raw `C:\Users\Admin` path; verify stored report has `C:\Users\[REDACTED]`. | **PASSED (Automated)** |
| **ACC-15-PREVIEW** | UX | Shop customization renders instant mobile QR microsite preview; retention ceiling enforced (<=72h). | `test_shop_customization_and_retention_ceiling_guardrail`, `test_microsite_preview_and_capability_validator` | Update brand color and logo; verify instant mobile preview reflects new branding. | **PASSED (Automated)** |
| **ACC-16-METRICS** | Ops | Open Prometheus `/metrics` endpoint emitting live business, subscriber, device, and queue metrics. | `test_prometheus_metrics_endpoint` | Query `curl http://localhost:8000/metrics`; verify valid Prometheus text format. | **PASSED (Automated)** |
| **ACC-17-MIGRATE** | Database | Migration 004 executes idempotently and enforces RLS across all Phase 6 tables. | `test_phase6_migration_004_and_rls_integrity` | Run migration runner report; confirm all tables created and policies applied. | **PASSED (Automated)** |
| **ACC-18-HARDWARE** | Hardware | Physical spooler raster verification on real Windows printer hardware. | In-memory Win32 spooler simulator passing. | **BLOCKED/UNVERIFIED** (Requires on-site physical pilot hardware). | **HARDWARE PENDING** |
