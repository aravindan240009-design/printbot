# Phase 0 risk register

Latest implementation status: isolated proof/schema/simulator/corpus are now
implemented and virtual Windows output verified; see PHASE0_IMPLEMENTATION_RESULTS.
Rows below retain inspection evidence about the legacy scaffold, which remains
unsafe and unchanged. R05 local-toolchain blocker is resolved for this experiment;
R06 now has exact DLL hashes/notices but production provenance/runtime license gate
is unresolved. R01 physical certification and R07 missing references remain BLOCKED.
Windows power-loss journal durability/private driver blank/finishing behavior and
final independent whole-change signoff remain UNVERIFIED.

All owners below are engineering roles; no external person has accepted an assignment.

| ID | Priority / owner | Evidence and required mitigation | Status |
| --- | --- | --- | --- |
| R01 | Critical / Windows | No physical queue/PnP device; supervised two-model minimum plus five-target matrix | BLOCKED |
| R02 | Critical / Security | X-Tenant-ID and default-tenant trusted by current middleware; authenticate server-derived scope, negative read/write/worker tests, RLS and composite FKs | OPEN; current scaffold unsafe for production |
| R03 | Critical / Print | Native Rust returns fake names/id 1042; build isolated real proof, label simulator explicitly | OPEN |
| R04 | Critical / Print | Existing reconciliation can propose re-spool from incomplete local list; durable ambiguity journal and no auto-retry after possible submission | OPEN |
| R05 | High / Release | No Rust/Cargo on PATH or conventional user install; verify/install audited toolchain and prerequisites after design approval | BLOCKED |
| R06 | High / Release | No exact PDFium DLL, locks, notices or SPDX inventory | BLOCKED |
| R07 | High / Product | Named master DOCX/Claude PDF absent | BLOCKED; reconcile when supplied |
| R08 | High / Security | Worker returns simulated valid/scan passed; untrusted conversion unimplemented | OPEN; proof limited to trusted samples |
| R09 | High / Payments | KYC, settlement ownership and live confirmation integration unverified | BLOCKED for live automation; mock later |
| R10 | High / Privacy | Document deletion, privacy roles, phased Indian duties and breach procedure unreviewed | OPEN; obtain qualified review |
| R11 | High / Operations | Compressed size not render complexity; bound pixels/pages/time/RAM/storage/egress and measure large synthetic fixtures | OPEN |
| R12 | High / Release | Production signing identity/certificate/update channel absent | BLOCKED production release |
| R13 | Medium / Hardware | Driver metadata can lie/coerce settings; per-model DEVMODE and physical proof | UNVERIFIED |
| R14 | Medium / Product | Scanner/copier timed control not established by printing APIs | BLOCKED unattended copier feature |
| R15 | Medium / Product | Pickup/dispatch capacity, timezone, outages and subscription-expiry policies need executable tests | DESIGN ONLY |
| R16 | Critical / Contracts | Client camelCase selections silently become B&W/A4/simplex/75gsm; independently reproduced | CONFIRMED; wire parity/regression gate |
| R17 | Critical / Security | Cross-tenant reconciliation write and prefix disclosure independently reproduced, HTTP 200 | CONFIRMED; current scaffold unsafe |
| R18 | Critical / Payments | Signed zero-value/wrong-currency event queued order; amount/checkout binding absent | CONFIRMED; no live automation |
| R19 | High / Print | Non-atomic claim returned success to two synchronized threads; arbitrary workstation status rollback reproduced | CONFIRMED; duplicate/false state risk |
| R20 | High / Tooling | Global sync script overwrites agent configurations and skills without merge/backup | OPEN; do not use as routine setup |
| R21 | High / Release | Missing desktop/Docker build inputs; workflow requests nondraft production release without signing/SBOM/hardware gate | UNVERIFIED BUILD; release blocked |

Follow-up review evidence and scope: PHASE0_REPOSITORY_REVIEW.md and
PHASE0_SKILLS_AND_CONNECTORS.md. These findings were recorded without product-code
changes or Phase 1 work.

No paid job may be silently abandoned on expiry; resolve/refund path is required.
Every submitted outcome with uncertainty stays COMPLETION_UNKNOWN until supervised
reconciliation. No claim of guaranteed physical delivery or zero duplicates across
all failures is justified by the existing tests.
