# Phase 0 evidence tooling execution

2026-10-22. Scope: synthetic fixtures, read-only Windows inventory, supervised bench
record tooling, license evidence and bounded source/environment SBOM. No real job,
spooler change, network printer discovery, payment or global configuration action.

IMPLEMENTED:

- `scripts/phase0/generate_corpus.py`: stdlib, deterministic valid/malformed corpus.
- `scripts/phase0/inventory.ps1`: read-only OS, queue, driver, redacted ports,
  PrintConfiguration, PnP and service snapshots; no user/job/document data.
- `scripts/phase0/bench.py`: six model/driver rows, fifteen cases each, all initially
  UNVERIFIED; no-overwrite output; explicit opt-in one-submission native CLI adapter.
  Pre-submit unknown record and no automatic retry/reprint/restart/cancel/jam.
- `scripts/phase0/generate_sbom.py`: available Cargo.lock + official checksum/license
  metadata; actual Python environment versions/source artifacts; local PDFium wheel
  and DLL; source declarations separated from resolved packages.
- `scripts/phase0/verify_evidence.py`: independent pypdf parsing, hashes/determinism,
  official SPDX2.3 JSON schema and relationship integrity, privacy inventory shape.
- `docs/licenses/registry`, `pdfium-5.14.0`, `future-candidates`, schema, hardware
  inventory and UNVERIFIED bench template; updates to HARDWARE_MATRIX,
  OSS_LICENSE_AUDIT, PRD_DECISIONS; generated `docs/SBOM.spdx.json`.

TESTED (actual commands):

| Command | Actual result |
| --- | --- |
| `python scripts/phase0/generate_corpus.py` | Exit 0, eight files and manifest |
| `powershell -NoProfile -File scripts/phase0/inventory.ps1` | Exit 0; two virtual queues; no errors; no physical hardware |
| `python scripts/phase0/bench.py --output docs/licenses/bench-unverified.json` | Exit 0; six rows, every case UNVERIFIED |
| `python scripts/phase0/generate_sbom.py` | Exit 0; generates bounded inventory, scope comments and unresolved declarations |
| Final generator with pytest root and active dependencies | Exit 0; 41 SPDX packages; 14 official Python source archives verified, 30 source notice file hashes passed |
| `python scripts/phase0/collect_cargo_notices.py` | Exit 0; all 23 registry crate source archives match Cargo.lock, notices preserved |
| `python scripts/phase0/verify_evidence.py` | Exit 0; 8 hashes/determinism, page/media assertions, malformed rejection, official SPDX schema/relations, inventory shape |
| Agent Reach Exa `mcporter call exa.web_search_exa` for Gotenberg helpers | Exit 0; official helper documentation and maintainer evidence returned |
| `agent-reach check-update` | CLI command unavailable; no update/install performed |

During authoring, an ad hoc tuple-versus-JSON-list comparison and Windows-default
text encoding produced verification errors; canonical JSON and explicit UTF-8
corrected the checks. Official SPDX schema caught `documentComment`; changed to
the schema-defined `comment` before the passing final run. No failed check is
represented as a hardware or release pass.

BLOCKED/UNVERIFIED: zero actual physical models tested; driver fault recovery;
mobile visual/accessibility QA; full legacy resolved dependencies; exact release
container/installer/toolchain SBOM; PDFium source commit/bundled versions and
production clearance; signing/provider/privacy reviews. Missing master DOCX and
Claude PDF remain missing inputs. Future source-license candidates are not installed
or approved based on the register.

Security/privacy: synthetic content only; no customer upload; inventory excludes
queue names, addresses, serials and identities; physical adapter requires explicit
opt-in and corpus hash match; no automatic reprint. Actual bench outputs containing
queue/operator details should remain private outside Git. No new telemetry or
provider connection. Existing ADR 0001 governs isolated proof authority; no new ADR.

Handoff: regenerate SBOM after the parent finishes Cargo.lock, rerun evidence
verification, review the exact proof executable path/plan in hardware commands,
then use a dedicated supervised real bench to populate evidence. A process exit or
spooler disappearance never proves physical completion.
