# Tauri 2 + Rust Workstation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the desktop workstation's fake printer discovery and fake spool result with a tested Tauri/Rust native boundary, while keeping real physical dispatch blocked until server authorization and Windows hardware gates are available.

**Architecture:** Keep React as an unprivileged Tauri UI. Add a small Rust workstation core for typed printer discovery, capability validation, persistent journal operations, and explicit simulator/native adapters. Do not connect physical submission until the command contract can carry a server-authorized, shop-bound print plan.

**Tech Stack:** Tauri 2, Rust 2021, serde, SQLite journal, Windows `winspool.drv`/Windows crate behind `cfg(windows)`, React/TypeScript invoke client, Cargo tests.

**Spec:** `docs/superpowers/specs/2026-10-25-tauri-rust-workstation-design.md`

## Global Constraints

- React must not access printers, filesystem paths, or private credentials directly.
- The server-authorized shop/device binding is authoritative; UI-provided tenant IDs are not trusted.
- The local journal records intent before physical spool submission.
- Ambiguous spool outcomes become `COMPLETION_UNKNOWN`; no automatic reprint.
- Real Windows printer tests are a release gate and must not be simulated as passed.
- No commercial SDK or closed PDF/printing library may be introduced.
- Existing simulation remains available only through explicit development/test adapters.

## Review Focus

- Duplicate job submission after restart: journal must reject it before any native submission.
- Cross-shop job payload: command must reject it before printer lookup or spool.
- Printer capability mismatch: color, duplex, and paper size must fail closed.
- Missing/offline printer and uncertain Win32 return values: no success response or automatic retry.
- Untrusted frontend file paths: native code must only accept app-owned spool paths.

---

### Task 1: Rust workstation core contracts and persistent journal

**Files:**
- Create: `apps/desktop/src-tauri/src/workstation.rs`
- Create: `apps/desktop/src-tauri/src/journal.rs`
- Modify: `apps/desktop/src-tauri/Cargo.toml`
- Test: `apps/desktop/src-tauri/src/journal.rs` unit tests

**Interfaces:**
- Produces `PrintRequest`, `PrinterInfo`, `SpoolState`, `JournalEntry`, and journal operations consumed by Tauri commands.
- `SpoolJournal::record_intent(job_id, shop_id, document_path)` rejects an existing job and persists before submission.
- `SpoolJournal::mark_submitted(job_id, spooler_job_id)` and `SpoolJournal::mark_unknown(job_id, reason)` are monotonic.

- [ ] Write failing Rust tests for duplicate intent, cross-shop identity, monotonic ambiguous state, and restart persistence.
- [ ] Run `cargo test` and confirm the new tests fail because the core types/journal are absent.
- [ ] Implement the journal using SQLite in the application data directory; keep the test database isolated in a temporary directory.
- [ ] Run the focused Cargo tests and confirm they pass.
- [ ] Run `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings` for the Tauri crate.

### Task 2: Typed Tauri printer commands

**Files:**
- Modify: `apps/desktop/src-tauri/src/main.rs`
- Create: `apps/desktop/src-tauri/src/printers.rs`
- Modify: `apps/desktop/src-tauri/tauri.conf.json`
- Test: `apps/desktop/src-tauri/src/printers.rs` unit tests

**Interfaces:**
- `get_system_printers() -> Result<Vec<PrinterInfo>, WorkstationError>` returns native data on Windows and an explicit simulator adapter in development tests.
- `validate_print_request(request: &PrintRequest, printer: &PrinterInfo) -> Result<(), WorkstationError>` checks shop binding and capabilities.
- `prepare_spool_job(request: PrintRequest) -> Result<SpoolReceipt, WorkstationError>` records journal intent but does not claim physical printing until native submission is implemented and authorized.

- [ ] Write failing tests for color/duplex/paper mismatch, offline printer, foreign shop ID, and unsafe document path.
- [ ] Run focused tests and observe failure.
- [ ] Implement typed commands and register only required commands with Tauri.
- [ ] Restrict the allowed document root to `%LOCALAPPDATA%/PrintBot/spool` and return structured errors.
- [ ] Run focused tests, format, and clippy.

### Task 3: Connect the React workstation UI

**Files:**
- Modify: `apps/desktop/src/App.tsx`
- Create: `apps/desktop/src/native.ts`
- Test: `apps/desktop/src/native.test.ts` or existing frontend test harness

**Interfaces:**
- `native.ts` owns typed `invoke` calls and maps native errors to user-safe messages.
- The queue uses server-authorized job fields and no longer changes a job to PRINTING merely from a local button click.
- The printer screen renders discovered printers and clearly labels simulator mode.

- [ ] Write failing frontend tests for command failure, empty printer list, and dispatch not claiming printing before native acknowledgement.
- [ ] Run the focused frontend tests and observe failure.
- [ ] Implement the typed invoke adapter and UI state transitions.
- [ ] Run frontend tests and all relevant workspace type/build checks.

### Task 4: Agent boundary and release verification

**Files:**
- Modify: `services/print-agent/src/ipc.rs`
- Modify: `services/print-agent/src/printer_adapter.rs`
- Modify: `services/print-agent/Cargo.toml` only if required
- Create: `docs/OPERATIONS_RUNBOOK.md` section for Tauri workstation build and hardware gate

**Interfaces:**
- The standalone agent and Tauri core share the same job state and tenant/journal invariants; no hardcoded shop or spooler ID remains in production paths.
- Windows native calls remain behind `cfg(windows)` and use real return/error values.

- [ ] Write failing Rust tests for hardcoded shop/spool IDs and simulator-only dispatch paths.
- [ ] Implement the smallest shared change that removes hardcoded production values and preserves simulator tests.
- [ ] Run `cargo test --workspace`, `cargo clippy --workspace -- -D warnings`, and frontend builds.
- [ ] Mark real-printer enumeration/submission and Authenticode signing as `BLOCKED/UNVERIFIED` unless executed on the target Windows hardware/certificate.

## Exit Criteria

- Tauri/Rust core tests pass.
- Frontend builds and no longer reports a local fake print as physical printing.
- Cross-shop and duplicate-print negative tests pass.
- Real Windows printer submission is explicitly not claimed until hardware verification is performed.
