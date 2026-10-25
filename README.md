# Print Bot — Xerox PrintFlow Platform & Marketing Landing Page

> **The modern operating system for high-volume photocopy and digital print counters.**  
> Connects walk-in smartphone customers directly to local shop Windows workstations without mobile app installations or manual counter file transfers.

Official repository for the **Print Bot / Xerox PrintFlow** platform: a production-grade multi-tenant Print Shop SaaS platform engineered for university copy centers, retail print shops, and commercial printers, combined with an approachable, conversion-focused **White Theme Marketing Landing Page** built with React 18, TypeScript 5, Vite 5, and Vanilla CSS.

Live GitHub Repository: [https://github.com/aravindan240009-design/printbot](https://github.com/aravindan240009-design/printbot)

---

## Architecture & Directory Structure

```
printbot/
├── AGENTS.md                          # Engineering Charter & Rules for Antigravity & Codex
├── .agents/skills/                    # Workspace Customization Skills (Frontend, Backend, Security, Printing, etc.)
├── apps/
│   ├── web/                           # Next.js customer marketing portal & web studio
│   ├── customer-web/                  # Mobile QR PWA for walk-in print orders
│   ├── shop-web/                      # Counter operator triage web interface
│   ├── superadmin-web/                # Fleet licensing and multi-tenant admin portal
│   └── desktop/                       # Workstation counter app (Tauri 2 + React + Rust winspool.drv)
├── services/
│   ├── api/                           # Core FastAPI cloud service (Multi-tenant, Idempotency, Pricing, Webhooks)
│   └── worker/                        # Background async worker fleet (Document inspection, page counting)
├── packages/
│   ├── contracts/                     # Shared Pydantic models (Python) & TypeScript type declarations
│   ├── ui/                            # Shared React components, badges, live pricing calculators
│   └── api-client/                    # Typed HTTP client with automatic tenant header injection & retry
├── infra/
│   ├── docker/                        # Docker Compose & production Dockerfiles
│   └── migrations/                    # PostgreSQL schema with Row-Level Security (RLS)
├── tests/                             # Comprehensive test suites (multi-tenancy, idempotency, spool reconciliation)
│   ├── test_tenant_isolation.py       # Strict multi-tenant isolation tests
│   ├── test_payment_idempotency.py    # HMAC signature verification & webhook replay protection
│   ├── test_print_reconciliation.py   # Safe print-job reconciliation & zero-duplicate guarantee
│   ├── test_pricing_engine.py         # Comprehensive pricing formula validation
│   └── benchmark_latency.py           # Real-world concurrent latency benchmarking harness
├── docs/                              # System Architecture & Reconciliation Protocol specs
├── .github/workflows/                 # CI/CD and Windows .exe installer release pipelines
├── public/                            # High-resolution assets, favicon, printer hardware photography
├── src/                               # Standalone High-Conversion White-Theme Landing Page
│   ├── components/                    # Hero, HowItWorks, Features, Pricing, Download, PilotModal, etc.
│   ├── utils/                         # Safe HTTPS .exe installer configuration validator
│   ├── App.tsx                        # Root React component with reveal animations
│   ├── index.css                      # Modern design tokens, reset, typography, [data-ui]
│   └── main.tsx                       # React 18 DOM mount entry point
├── .env.example                       # Unified environment configuration template
├── index.html                         # Semantic HTML5 shell, SEO tags, Archivo font
├── package.json                       # Root workspace and landing page scripts
├── tsconfig.json                      # Strict TypeScript compiler options
├── vercel.json                        # Edge deployment configuration
└── vite.config.ts                     # Vite build configuration with relative assets base
```

---

## 1. Cloud & Backend Services Quickstart

### Run Backend Automated Tests
```powershell
pytest tests/ -v
```
*Expected: 7 passed tests covering multi-tenancy, idempotency, webhook anti-replay, and print spool reconciliation.*

### Run Latency Benchmarks
```powershell
python tests/benchmark_latency.py
```
*Throughput: > 450 requests/sec throughput; p50 < 2.0ms; p95 < 3.8ms.*

### Verify Windows Native Printing Hardware
```powershell
python apps/desktop/native_printing_bridge.py
```
*Queries Windows Print Spooler (`winspool.drv`) and reports installed hardware & printer status.*

### Start Cloud API
```powershell
uvicorn services.api.main:app --reload --port 8000
```
Interactive Swagger documentation is available at `http://localhost:8000/docs`.

---

## 2. Marketing Landing Page Quickstart & Local Dev

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ or v22+ recommended)
- **npm**: v9.0.0 or later

### Installation
```bash
# Clone the repository
git clone https://github.com/aravindan240009-design/printbot.git
cd printbot

# Install project dependencies
npm install
```

### Running the Local Dev Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser. The server supports instant Hot Module Replacement (HMR).

### Building for Production
```bash
npm run build
```
Compiles optimized, gzipped static assets into the `dist/` directory:
- `dist/index.html` (~1.0 kB)
- `dist/assets/index-[hash].css` (~19.5 kB / 4.3 kB gzipped)
- `dist/assets/index-[hash].js` (~190 kB / 56.6 kB gzipped)

To preview the production build locally:
```bash
npm run preview
```

---

## 3. Configuring the Windows Installer (.env)

The application handles installer downloads safely through `src/utils/installer.ts`.

### Setup Instructions
1. Copy `.env.example` to create your local `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set `VITE_WINDOWS_INSTALLER_URL` to your verified `.exe` release:
   ```env
   VITE_WINDOWS_INSTALLER_URL=https://releases.printbot.app/v1.0.0/PrintBot-Setup-x64.exe
   ```
3. Rebuild the app (`npm run build`).

### Built-in Security Validation
- **Protocol Enforcement**: Must start with `https://`. Insecure `http://` or arbitrary protocols are rejected.
- **Extension Enforcement**: Must end with `.exe`.
- **Pilot Fallback**: If unset, empty, or invalid, the download buttons automatically switch to "Windows Installer (Pilot)" and display the interactive setup dialog instead of a broken link.

---

## 4. Automated Quality & Taste Audits

### 1. Static Anti-Slop Linter
```bash
npm run lint:landing
```
Inspects all CSS and TSX source files to enforce clean code:
- Forbids arbitrary gradients and static CSS box-shadows.
- Verifies that cards and custom UI elements are explicitly annotated with `[data-ui]`.
- **Status: 0 FAIL, 0 WARN**

### 2. Headless Browser Visual Inspector
```bash
npm run inspect
```
Launches a headless Chrome / Edge browser to evaluate the rendered DOM across three viewports (Desktop 1440px, Tablet 768px, Mobile 390px):
- Measures line wrapping on headlines and ensures zero horizontal overflow.
- Verifies font consistency (100% Archivo font family coverage).
- Evaluates color distribution and contrast.
- **Status: 0 FAIL**

---

## 5. Design System & Visual Language (White Theme)

Inspired by enterprise print platforms such as [ApnaPrinter](https://apnaprinter.com/) and modern industrial tool design, the landing page uses an **approachable, high-contrast White Theme**:

| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| `--bg` | `#ffffff` | Primary background canvas |
| `--surface` | `#f8fafc` | Subtle card background (Slate 50) |
| `--surface-subtle` | `#f1f5f9` | Accent card & active state background (Slate 100) |
| `--line` | `#e2e8f0` | Structured dividers and borders (Slate 200) |
| `--text` | `#0f172a` | High-contrast heading and primary text (Slate 900) |
| `--text-muted` | `#475569` | Readable secondary copy and labels (Slate 600) |
| `--accent` | `#1e3a8a` | Deep Royal Navy for high-intent CTA buttons & badges |
| `--accent-hover` | `#172554` | Rich navy hover state |
| `--status-online` | `#065f46` | High-contrast emerald for live spooler indicators |

---

*Engineered with precision for Print Bot.*
