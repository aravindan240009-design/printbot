# Print Bot

Print Bot is a multi-tenant print-shop SaaS platform for walk-in customers,
print-shop staff, and Windows workstations. A customer scans a shop-specific
QR code, uploads documents from a phone, configures print options, receives a
server-generated preview and quote, pays or chooses cash at the counter, and
tracks the order.

The shop operates the queue through a web dashboard and a Windows desktop
workstation. The workstation is built with Tauri 2 + Rust so printer discovery,
local files, spool journals, and future Windows spooler submission remain
outside the React UI.

> Current status: the customer flow, shop portals, API security hardening,
> Rust journal, native printer boundary, and release compilation are
> implemented. Physical printing, authenticated device pairing, real-printer
> validation, and signed installer distribution remain release gates.

## Product flows

### Customer

```text
Shop QR code
  -> mobile customer web app
  -> guest session bound to that shop
  -> upload supported document
  -> server scan and preview
  -> print options and server quote
  -> verified payment or cash-at-counter choice
  -> order tracking and collection status
```

The customer does not need a mobile app or mandatory account. The QR link is
shop-specific; the API must resolve the shop from the validated guest session,
not from an unchecked browser field.

### Shop

Staff use the shop portal to manage queue review, shop settings, pricing,
printers, payment choices, order mode, bookings, and reconciliation. A shop
can use exactly one all-inclusive subscription plan and unlimited printers;
there are no software tiers or per-printer software commissions.

### Windows workstation

The desktop application displays the operator queue and calls narrow, typed
Tauri commands for native operations. The Rust layer:

- discovers Windows printers through the print spooler API;
- validates shop binding, printer availability, capabilities, and spool paths;
- records print intent in a local SQLite journal before submission;
- rejects duplicate jobs and cross-shop requests;
- preserves ambiguous outcomes as `COMPLETION_UNKNOWN`;
- never performs an automatic reprint.

Physical submission is intentionally not enabled until server-authorized job
contracts, device pairing, PDF rendering, and real hardware verification are
complete.

## Repository structure

```text
apps/
  web/             Public marketing/product site (Next.js, port 3000)
  customer-web/    QR customer upload and checkout flow (Vite, port 3000)
  superadmin-web/  Platform owner administration portal (Vite, port 3002)
  desktop/         Tauri 2 + React + Rust Windows workstation

services/
  api/             FastAPI modular monolith and REST API
  worker/          Background document and queue processing
  print-agent/     Rust Windows service/IPC prototype and journal rules

packages/
  contracts/       Shared TypeScript contracts
  printplan-contract/ Canonical PrintPlan contract and schema
  api-client/      Typed frontend API client
  ui/              Shared React UI, motion, and 3D components

infra/
  migrations/      Database migrations and RLS-related schema
  docker/          Local/deployment container definitions

tests/             Python API, isolation, idempotency, payment, and print tests
docs/              Architecture, security, operations, and license documents
fixtures/          Test documents and shared test data
```

## Technology stack

| Area | Technology |
| --- | --- |
| Customer, shop, admin UI | React 18, TypeScript, Vite |
| Marketing site | Next.js 14 |
| Desktop UI | Tauri 2, React, TypeScript |
| Native workstation | Rust, SQLite journal, Windows print APIs |
| Cloud API | Python, FastAPI, Pydantic |
| Database | PostgreSQL with tenant isolation and RLS design |
| Cache/queue support | Valkey/Redis-compatible services and worker processes |
| Storage | Local filesystem for development; private S3-compatible storage in production |
| Payments | Razorpay integration boundary with signed webhook verification |
| Preview/conversion | Explicitly supported document converters and bounded processing |

## Prerequisites

Install the following before local development:

- Node.js 20+ and pnpm;
- Python 3.11+;
- Rust stable with the MSVC target;
- Visual Studio Build Tools with Desktop development with C++ and a Windows SDK
  for Tauri Windows builds;
- WebView2 Runtime for running the desktop application;
- PostgreSQL and Valkey/Redis-compatible service for live API development;
- an S3-compatible local object store if testing object storage paths.

On Windows, verify Rust with:

```powershell
cargo --version
rustc --version
rustup show
```

## Installation

From the repository root:

```powershell
pnpm install

python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Copy the environment template and replace development values as needed:

```powershell
Copy-Item .env.example .env
```

The development template contains local-only defaults. Never copy its secret
values into production and never commit real payment, database, storage, or
JWT secrets.

## Running the applications

### Marketing site

```powershell
pnpm dev
```

Open `http://localhost:5173`.

### Customer web

```powershell
pnpm --filter @xerox/customer-web dev
```

Open `http://localhost:3000`. A customer session is normally opened from a
shop QR URL containing the QR token, for example:

```text
http://localhost:3000/?qr=<shop-qr-token>
```

The customer app requires the API to be configured and reachable for server
scan, preview, quote, payment, and tracking behavior. Without that connection,
the UI can render but cannot create a real order.

### Super-admin portal

```powershell
pnpm --filter @xerox/superadmin-web dev
```

Open `http://localhost:3002`.

### FastAPI service

```powershell
uvicorn services.api.main:app --reload --host 127.0.0.1 --port 8000
```

In development, API documentation is available at `http://localhost:8000/docs`.
Production disables interactive API documentation and other development-only
diagnostic endpoints.

### Worker

```powershell
python -m services.worker.worker
```

The worker requires the configured database, queue/cache, and storage services
when running a non-simulated document pipeline.

## Building the Windows workstation

Build the frontend only:

```powershell
pnpm --filter @xerox/desktop build
```

Build the Tauri release executable and installers:

```powershell
pnpm --filter @xerox/desktop tauri:build
```

The release executable is written to:

```text
apps/desktop/src-tauri/target/release/xerox-workstation.exe
```

Tauri installers are written below:

```text
apps/desktop/src-tauri/target/release/bundle/
```

The local build is unsigned. A production release also needs an Authenticode
certificate, signing configuration, update strategy, and verification on the
target shop hardware. If Tauri reports that `cargo` cannot be found, add
`%USERPROFILE%\.cargo\bin` to `PATH` and reopen PowerShell.

## Testing and verification

### Python API tests

```powershell
python -m pytest tests/ -q
```

These tests cover API behavior including tenant isolation, authorization,
payment webhook replay protection, pricing, malformed input, and print-job
reconciliation.

### Rust tests

```powershell
cargo test --workspace --no-fail-fast
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --no-fail-fast
```

### Rust quality checks

```powershell
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo clippy --manifest-path apps/desktop/src-tauri/Cargo.toml --all-targets -- -D warnings
```

### TypeScript and production builds

```powershell
pnpm -r build
git diff --check
```

Real printer tests must be executed on a dedicated Windows machine with the
target printer and driver installed. A simulator or a successful spooler API
call is not evidence that paper was physically delivered.

## Security model

Print Bot treats every shop as a separate tenant. The security boundary applies
to customers, files, previews, quotes, orders, printers, devices, jobs,
payments, logs, and analytics.

Important rules:

- the server resolves `shop_id` from authenticated membership or a validated
  shop-bound guest session;
- client-provided shop or tenant fields are never trusted as authorization;
- storage keys and download permissions are tenant- and owner-scoped;
- uploads are size-bounded and checked by MIME, file signature, and supported
  format policy;
- conversion work must be isolated, resource-bounded, and denied network access;
- payment callbacks are not trusted until the signed provider webhook is
  verified and processed idempotently;
- cookies, CSRF, CORS, CSP, RBAC, MFA, audit logging, and retention policies
  are environment-sensitive;
- no customer document content or credentials belong in telemetry;
- device IDs and shop IDs are identifiers, not secrets;
- ambiguous spooler outcomes require supervised reconciliation and never
  trigger automatic reprinting.

Read [AGENTS.md](AGENTS.md), [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md),
and [docs/SOFTWARE_BILL_OF_MATERIALS.md](docs/SOFTWARE_BILL_OF_MATERIALS.md)
before changing security, deployment, or native-printing behavior.

## Production readiness gates

The following are deliberately not represented as complete just because local
tests pass:

1. PostgreSQL, Valkey, private object storage, HTTPS, backups, and monitoring
   must be deployed and tested.
2. Device pairing needs an authenticated server challenge, revocable device
   credentials, and preferably TPM-backed non-exportable keys.
3. The Rust workstation must receive an immutable server-authorized `PrintPlan`
   and verify its shop/device binding before native submission.
4. Supported PDFs must be rendered through a verified compatible path for each
   target driver and printer family.
5. Real printers must be tested for enumeration, capabilities, offline states,
   spooler failures, restart recovery, and ambiguous completion.
6. Razorpay production credentials and webhook secrets must be stored outside
   the repository and rotated if exposed.
7. Installer and update artifacts must be Authenticode-signed and tested on a
   clean Windows machine.
8. Dependency licenses and shipped notices must be reviewed before commercial
   redistribution.

## Documentation map

- [AGENTS.md](AGENTS.md): product, security, architecture, and engineering contract
- [docs/OPERATIONS_RUNBOOK.md](docs/OPERATIONS_RUNBOOK.md): local operation and incident procedures
- [docs/SOFTWARE_BILL_OF_MATERIALS.md](docs/SOFTWARE_BILL_OF_MATERIALS.md): dependency/license record
- [docs/superpowers/specs/2026-10-25-tauri-rust-workstation-design.md](docs/superpowers/specs/2026-10-25-tauri-rust-workstation-design.md): Tauri workstation design
- [docs/superpowers/plans/2026-10-25-tauri-rust-workstation-plan.md](docs/superpowers/plans/2026-10-25-tauri-rust-workstation-plan.md): implementation plan and verification ledger

## Contributing

Keep changes inside the existing monorepo boundaries, add tests for new
behavior, and preserve the tenant and print-safety invariants. Before opening a
pull request, run the relevant Python, TypeScript, Rust, security, and build
checks. Do not commit `.env` files, production credentials, customer uploads,
private keys, or unsigned artifacts as if they were production releases.
