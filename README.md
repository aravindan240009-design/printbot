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

The repository root is a pnpm + Rust workspace. Application code lives under
`apps/`, shared code under `packages/`, backend processes under `services/`,
and deployment/database support under `infra/`.

```text
.
|-- .github/workflows/       CI and desktop release workflows
|-- apps/
|   |-- customer-web/        Standalone customer upload and checkout web app
|   |   |-- public/           Customer app static assets
|   |   `-- src/
|   |       |-- components/  Cart, checkout, common, dashboard, print,
|   |       |                services, and order-tracking UI
|   |       |-- design/      Customer app design tokens
|   |       |-- locales/     English, Hindi, and Tamil translations
|   |       |-- types/       Customer app TypeScript types
|   |       `-- utils/       Pricing, storage, and tenant helpers
|   `-- desktop/              Windows workstation app (React + Tauri)
|       |-- public/           Desktop-specific static assets
|       |-- src/
|       |   `-- components/   Workstation, queue, printer, and settings UI
|       `-- src-tauri/
|           |-- gen/schemas/  Generated Tauri schema snapshots
|           |-- icons/        App and installer icons
|           `-- src/          Native Rust commands and workstation logic
|-- infra/
|   |-- docker/               API container and local service definitions
|   `-- migrations/           Database schema migrations and migration runner
|-- packages/
|   |-- contracts/src/        Shared TypeScript and Python contracts
|   |-- printplan/
|   |   |-- python/           Python PrintPlan implementation
|   |   |-- rust/src/         Rust PrintPlan implementation
|   |   `-- typescript/       TypeScript PrintPlan implementation
|   `-- ui/src/
|       |-- components/       Shared React UI components
|       |-- fonts/            Bundled fonts and their licenses
|       |-- motion/            Shared animation helpers
|       `-- three/             Shared 3D scene components
|-- public/
|   |-- assets/                Images used by the website
|   `-- downloads/             Installer files served as customer downloads
|-- scripts/
|   `-- phase0/                Bootstrap, inventory, verification, and SBOM tools
|-- services/
|   |-- api/
|   |   |-- core/              API settings, security, and shared primitives
|   |   |-- middleware/        Request middleware, including tenant context
|   |   |-- routers/           FastAPI route modules
|   |   `-- services/          API business logic and integrations
|   |-- print-agent/src/       Rust print-agent service and IPC code
|   `-- worker/                Background document-processing worker
|-- src/                       Root marketing website and embedded customer UI
|   |-- components/            Website navigation, footer, and shared UI
|   |-- config/                Website configuration
|   |-- customer-web/          Customer portal embedded in the root website
|   |   |-- components/        Embedded cart, checkout, print, and order UI
|   |   |-- design/            Embedded portal design tokens
|   |   |-- locales/           Embedded portal translations
|   |   |-- types/             Embedded portal TypeScript types
|   |   `-- utils/             Embedded portal pricing, storage, and tenant helpers
|   |-- hooks/                 Website React hooks
|   `-- pages/                 Marketing, download, and policy pages
`-- tools/printer-proof/src/   Rust printer-proofing and simulation utility
```

### Why there are two customer-web folders

`src/customer-web/` is loaded by the root website when a customer opens a shop
or QR link. `apps/customer-web/` is a separate pnpm app with its own Vite
configuration and deployment settings. They are separate entry points; do not
assume one folder is simply nested inside or built from the other.

### Important files at the root

- `package.json`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` define the
  JavaScript workspace, commands, and locked dependencies.
- `wrangler.jsonc` configures the root Vite website's Cloudflare Worker static
  assets deployment from `dist/`, including its single-page-app fallback.
- `Cargo.toml` and `Cargo.lock` define the Rust workspace. The Tauri desktop
  crate has its own manifest and lockfile in `apps/desktop/src-tauri/`.
- `requirements.txt` lists Python dependencies; `.env.example` is the safe
  environment-variable template. Real `.env` files are local and must not be
  committed or shared.
- `index.html`, `src/main.tsx`, and `vite.config.ts` are the root website
  entry and build configuration. `tsconfig*.json`, `tailwind.config.js`, and
  `postcss.config.js` configure its frontend toolchain.
- `vercel.json` and `.vercelignore` configure root website deployment;
  `Launch-PrintBot-Workstation.bat` is a Windows workstation launch helper.

### App entry points and configuration

- `apps/customer-web/package.json`, `index.html`, `vite.config.ts`, and
  `vercel.json` configure and deploy the standalone customer app.
- `apps/desktop/package.json` and `vite.config.ts` configure the desktop UI;
  `apps/desktop/src-tauri/tauri.conf.json` and `Cargo.toml` configure its
  native Tauri application.
- `services/api/main.py` starts the FastAPI application,
  `services/worker/worker.py` starts the background worker, and
  `services/print-agent/Cargo.toml` defines the Rust print agent.
- `packages/printplan/schema.v1.json` is the shared PrintPlan schema used by
  its Python, Rust, and TypeScript implementations.

### Generated and local-only folders

`node_modules/` contains installed dependencies; `dist/` and `apps/*/dist/`
contain built web assets; `target/` and `apps/desktop/src-tauri/target/`
contain Rust build output; and `.vercel/` contains deployment output. These are
generated artifacts, not source folders. `public/downloads/` is different:
those are the installer files intentionally served by the website.

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

### FastAPI service

```powershell
uvicorn services.api.main:app --reload --host 127.0.0.1 --port 8000
```

In development, API documentation is available at `http://localhost:8000/docs`.
Production disables interactive API documentation and other development-only
diagnostic endpoints.

Set `SUPERADMIN_PASSWORD` explicitly to provision the API's Super Admin login.
The API no longer creates built-in demo users, shops, devices, QR links, or
software releases.

For customer-web deployments, set `VITE_API_BASE_URL` to the public API URL
including `/api/v1` when API forwarding is required. Production builds no
longer fall back to a visitor's `localhost`; without this setting, the app
continues using its configured Supabase order flow without attempting API
forwarding. A configured API URL must use HTTPS and cannot target a loopback
address.

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

## Build checks

```powershell
pnpm --filter @xerox/customer-web build
pnpm --filter @xerox/desktop build
cargo fmt --all -- --check
```

Standalone API/conformance test suites and shared fixture datasets are not
included; a few self-contained Rust unit tests remain in source files.
Real printer behavior must be validated on dedicated Windows hardware before a
production release.

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
- [docs/superpowers/specs/2026-11-17-cloudflare-migration-design.md](docs/superpowers/specs/2026-11-17-cloudflare-migration-design.md): Cloudflare migration design

## Contributing

Keep changes inside the existing monorepo boundaries, add tests for new
behavior, and preserve the tenant and print-safety invariants. Before opening a
pull request, run the relevant Python, TypeScript, Rust, security, and build
checks. Do not commit `.env` files, production credentials, customer uploads,
private keys, or unsigned artifacts as if they were production releases.
