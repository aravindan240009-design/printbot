# Phase 0 implementation results — exit gate NOT COMPLETE

2026-10-22, Asia/Kolkata. Work stayed in current repository; existing AGENTS.md edit
was preserved. No Phase 1 features, release, provider configuration, database
migration or global agent synchronization was performed.

## IMPLEMENTED

- Isolated root Cargo workspace, locked proof dependencies and Rust CLI; the legacy
  Tauri app is excluded. Windows EnumPrinters/GetPrinter/DeviceCapabilities,
  DocumentProperties private DEVMODE, job observation, real PDFium raster-to-GDI
  submission, software copies and driver setting rejection are implemented.
- Version1 strict JSON Schema and Python/TypeScript/Rust reference adapters;
  85 shared positive/negative fixtures cover ranges, parity, malformed inputs,
  tenant mismatch, capabilities, Unicode/integer canonical recipe hashes, copies,
  collated/uncollated n-up, duplex boundary padding and allocation limits.
- Explicit simulator for ready/offline/no-paper/jam/restart/timeout/cancel/crash/
  zero-print. It never reports actual spool submission or physical completion.
  Create-new per-shop/job journal intent is flushed before native submission;
  repeated/concurrent identities cannot automatically reprint. Native process
  timeout and bounded pipe capture preserve unknown outcomes conservatively.
- Deterministic synthetic printable corpus, privacy-safe Windows inventory,
  five-model/six-driver-row bench with fifteen cases per row, all physical cases
  UNVERIFIED. Only explicit one-job operator opt-in submits a synthetic fixture.
- Required product/architecture/PrintPlan/hardware/risk/acceptance documents,
  three-screen and desktop/admin text wireframes, ADR0002, runbook/bootstrap and
  local verification commands; portable CI definition added but not run remotely.
- SPDX2.3 source/environment inventory with41 packages, official schema validation,
  23 registry Cargo archives/hash matches and preserved license notices, Python
  source notices, exact local PDFium wheel/DLL and build-tool notices. Legacy and
  future unresolved components are separated from resolved proof dependencies.

## TESTED — actual execution

| Command or experiment | Actual outcome |
| --- | --- |
| `scripts/phase0/verify.ps1 -Renderer` | Exit0: Cargo format/test/build/clippy, Python111 Phase0 tests, Node85 shared cases, corpus/SPDX evidence, explicit native renderer check |
| `cargo test --workspace --locked` | 9 proof tests +3 contract tests passed; native PDFium opt-in test ignored by default, then run separately and passed |
| `cargo clippy --workspace --all-targets --locked -- -D warnings` | Passed |
| `python -m pytest tests/ -q -p no:cacheprovider` | 118 passed in4.76s; seven are legacy tests and do not repair their known gaps |
| `python scripts/phase0/verify_evidence.py` | Eight fixture hashes/determinism, five parsed valid files/three malformed rejects, SPDX2.3 schema/relations41 packages, notice hashes, privacy inventory and bench defaults passed |
| Real CLI Windows enumeration/capabilities | PDF/OneNote queues returned; Microsoft PDF driver A4/color supported, duplex0/copies1, no physical device evidence |
| Local native PDFium raster test | Real DLL rendered fixture; wrong source/DLL hashes rejected; RGB content, grayscale channel equality and binary B&W output checked |
| GDI virtual B&W submission | Actual Windows spooler job2; three sides, software copies1, submitted_to_spooler=true, physical_complete=null |
| Virtual output parse/visual inspection | Three pages; PDF SHA256 c77d96874826846bf33c59964b8b498a77119d58f3fb9424be147d755f7c5618; first page rendered and visually inspected, no clipping observed |
| `scripts/phase0/run-demo.ps1 -Copies 2 -Color color` | Actual virtual spooler job3, six raster sides, driver copies1; six output pages, RGB patches retained, copy page pixel order1/2/3/1/2/3 independently checked |
| Color virtual output hash | 627ccb53e641921f3db2a25e4cbd34b49b955217856d51586fda1f2d01a18c1f |
| Repeat job identity with new output path | Exit2 before resubmission: existing intent, COMPLETION_UNKNOWN, automatic retry refused |
| `git diff --check` | Exit0; CRLF conversion notices only |

Development failures were corrected, not reported as successful integration:
initial GNU linker setup lacked CRT while extraction was incomplete; gnu-lld
spelling was unstable, changed to stable ld.lld; windows-sys needed LLVM dlltool
instead of GNU dlltool without assembler; a missing Read import and an overly
broad edit were caught by compiler. Initial virtual DEVMODE attempts rejected before
StartDoc; exact-driver virtual profile now handles fixed virtual metadata. Their
intent records remain retained; no failed attempt was relabeled as printed.

Independent review identified mutable FFI buffers and geometry checked too late.
Changed Vec::as_ptr cast to mutable buffers/as_mut_ptr; moved every selected side's
deterministic placement check before StartDoc; regression test added. Native integer
access now accepts schema-equivalent integral JSON numbers. Supervisor drains
pipes while waiting to avoid output-buffer deadlock. Reviewer was interrupted by
service usage limit before a final whole-change approval; no final reviewer signoff
is claimed. Parent integrated and ran all available checks.

## BLOCKED / UNVERIFIED

- **Zero physical printer models tested.** No installed physical queues/device
  evidence. Every five-model hardware/fault case remains UNVERIFIED. Virtual output
  proves Windows adapter integration only, never paper/duplex/jam/restart behavior.
- Master plan DOCX and Claude PDF are absent from checkout and connected Word
  sessions; reconciliation with them is pending. Competitor report not supplied.
- Complete final redistributable/source legal review remains blocked: PDFium source
  commit/transitive build versions absent; Rust GNU CRT/GCC runtime exception and
  source/notice obligations unresolved; project source licensing unspecified.
  No legacy pnpm resolution/container/font/installer SBOM or binary vulnerability
  clearance is claimed. SPDX syntax and source notices are not legal signoff.
- Native supported subset is narrower than reference accounting: one PDF/one-up,
  plain paper, explicit orientation, fit/actual and available duplex/color. Booklet,
  photo/bin/n-up/multi-file native operations reject. Retain these product features
  for later renderer work; do not silently drop them.
- Windows inherited journal ACL, directory power-loss persistence, disk loss,
  privileged tampering, scanner/copier automation and physical blank preservation
  require production/hardware work. No exactly-once physical guarantee.
- Untrusted upload conversion sandbox, payments/provider KYC/settlement, production
  subscription/device authentication, signing certificates and privacy/legal duties
  are not implemented/certified by this local experiment. Legacy security findings
  remain in PHASE0_REPOSITORY_REVIEW; do not deploy that application.

## Security/privacy checklist

- [x] Synthetic corpus only; no customer document or secret in Git.
- [x] Explicit local tenant-context mismatch negatives and strict contract fields.
- [x] Hash-bound recipe/source, fixed-size input/raster limits, DLL digest and scoped load.
- [x] Unsupported/coerced physical settings fail closed; no raw PDF passthrough.
- [x] Submission and physical completion remain separate; duplicate intent refused.
- [x] Bench does not automate jams/restarts/cancellation/reprints.
- [ ] Production tenant RLS/RBAC/paired credentials and authenticated service trust.
- [ ] Sandbox/malware/deletion/key assurance/release signing and full redistribution audit.
- [ ] Real hardware certification and final independent review signoff.

## Changed files, decisions and handoff

Exact path inventory: `PHASE0_CHANGED_FILES.json` (includes earlier review records,
excludes user's AGENTS.md modification; do not assume its hashes stay current after
future edits). Primary source directories: tools/printer-proof, packages/printplan,
scripts/phase0, tests/phase0, fixtures and docs/licenses. Root Cargo manifests,
requirements-phase0, .gitignore, README, required docs and phase0 CI are additive.
No production migration was needed for this isolated proof. ADR0002 records choices.

Runnable commands are in PHASE0_RUNBOOK; visual QA used the actual synthetic
source/output first page in ignored `.phase0-local`, not a fake app screenshot.
Copies/color output checks are virtual, no physical paper claim.

Copy-paste handoff: Continue Phase0 gates only. Run verify.ps1 -Renderer and the
explicit virtual run-demo; preserve intent journals. Obtain master DOCX/Claude PDF,
two available physical models and supervised five-model bench results, complete
artifact-specific licensing/provenance review and independent signoff. Keep all
unknown physical outcomes supervised; never auto-reprint. Do not begin Phase1 or
publish the existing scaffold as production while these gates remain blocked.
