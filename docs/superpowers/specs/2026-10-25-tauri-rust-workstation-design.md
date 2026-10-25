# Tauri 2 + Rust Workstation Design

## Intent

Turn the existing Windows workstation shell into a real, auditable Print Bot
desktop application without replacing the React UI. The workstation must be
able to authenticate a paired device, discover the shop's installed printers,
submit only server-authorized jobs, and reconcile ambiguous spool outcomes.

## Current state

- `apps/desktop` is a React/Vite UI wrapped by a Tauri 2 project.
- `apps/desktop/src-tauri/src/main.rs` exposes sample printer data and a fake
  spooler ID (`1042`). It has no persistent journal or native Win32 calls.
- `services/print-agent` contains a Rust agent prototype with tenant checks,
  printer capability validation, a pre-spool journal invariant, and simulator
  tests, but it currently uses mock printers/spool IDs and is not connected to
  the Tauri UI.
- The API and customer flow are not yet durable enough to authorize real print
  dispatch, so real dispatch must remain blocked until the paired-device API
  contract is available.

## Goals

1. Use Tauri 2 + Rust for the Windows workstation application.
2. Keep filesystem, printer, credential, and spool access out of React.
3. Persist a local spool journal before every physical submission.
4. Reject cross-shop jobs and incompatible printer capabilities locally.
5. Report `COMPLETION_UNKNOWN` when Windows spooler state is ambiguous; never
   automatically reprint.
6. Produce a signed-ready NSIS/MSI build configuration, with signing clearly
   marked as a release gate.

## Non-goals for this milestone

- No change to the customer web experience.
- No automatic payment settlement implementation.
- No claim that a print is physically delivered merely because the spooler
  accepted a job.
- No production device credential stored in the frontend or repository.

## Approaches considered

### Native WinUI 3 rewrite

Provides the most Windows-native UI and APIs, but requires replacing the
existing React/Tauri workstation and duplicating the current interface. It is
not selected because it discards working frontend code and the existing Rust
agent direction.

### Electron rewrite

Would reduce Rust learning for the UI layer, but embeds a larger runtime and
does not improve the existing Rust printing boundary. It is not selected for
the shop workstation's security and footprint requirements.

### Tauri 2 + Rust native boundary (selected)

Preserves the React UI, keeps privileged operations in Rust, and allows the
printing implementation to be shared with the standalone Rust agent. Tauri
commands will be narrow, typed, capability-limited, and backed by the same
tenant and journal invariants as the agent.

## Proposed architecture

```text
React workstation UI
        │ typed invoke()
Tauri Rust commands
        │ local state + authenticated API client
Rust workstation core
        ├── encrypted device credential store
        ├── SQLite spool_journal
        ├── Win32 printer discovery/submission/reconciliation
        └── server event/queue synchronization
```

The first implementation will extract shared domain types and journal rules
without introducing a second competing print implementation. The Tauri app
will use real Win32 APIs only on Windows and an explicit simulator adapter for
non-Windows development/tests.

## Security decisions

- Tauri capabilities will expose only the commands required by the workstation
  UI; no unrestricted shell or arbitrary filesystem access.
- Temporary files will be confined to the application data spool directory and
  removed after successful reconciliation or retention expiry.
- Device credentials will be kept in the Windows credential/key storage path;
  identifiers are safe to display, private keys are not.
- The server's paired device identity and shop binding are authoritative. The
  UI cannot choose a different `shop_id` for a print job.
- The local journal records intent before `StartDocPrinter`/submission.

## Release gates

- Rust toolchain, Windows SDK/MSVC, and WebView2 installed.
- Real printer enumeration and submission tested on a dedicated Windows queue.
- Ambiguous spool result reconciled under supervision.
- Authenticode certificate and signed update plan supplied before production
  distribution; unsigned local builds remain test-only.

## Acceptance criteria

- `cargo test` passes for the shared Rust workstation core.
- Tauri UI can display printers returned by the native command rather than
  hardcoded samples.
- Duplicate job submission is rejected by the persistent local journal.
- Cross-shop job requests are rejected before printer submission.
- A missing printer, incompatible capability, or uncertain spool result is
  surfaced as an actionable error and does not trigger an automatic reprint.
