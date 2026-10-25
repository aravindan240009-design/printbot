# Print Bot Operations & Incident Response Runbook

## 1. System Operations & Service Management

### 1. Starting the Cloud Platform (Local Dev / Staging)
```bash
# 1. Start backend virtual environment
.\.venv\Scripts\Activate.ps1

# 2. Run database migrations
python -m infra.migrations.runner --apply

# 3. Start FastAPI server with Uvicorn
uvicorn services.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Starting the Windows Print Agent Service
```powershell
# Open administrative PowerShell
Set-ExecutionPolicy Bypass -Scope Process
. .\scripts\phase0\env.ps1

# Start the Rust Windows Print Service in foreground debug mode
cargo run --bin print_agent -- --foreground

# Alternatively, register and start as a native Windows Service
sc.exe create PrintBotService binPath= "C:\Program Files\PrintBot\print_agent.exe" start= auto
net start PrintBotService
```

### 3. Starting the Desktop Operator Interface
```bash
# In apps/desktop-ui/
pnpm install
pnpm tauri dev
```

### 4. Building the Tauri 2 + Rust workstation

The workstation keeps printer and spool access in Rust. React is only the
unprivileged operator interface. A fresh Windows machine needs the Rust MSVC
toolchain, Visual Studio C++ Build Tools, Windows SDK, and WebView2.

```powershell
$env:Path = "C:\Users\$env:USERNAME\.cargo\bin;" + $env:Path
cd "D:\print bot"
pnpm.cmd --filter @xerox/desktop build
pnpm.cmd --filter @xerox/desktop tauri:build
```

The unsigned local installers are written below
`apps\desktop\src-tauri\target\release\bundle\`. Authenticode signing and
real-printer verification remain release gates. The local SQLite journal is
created under the Tauri application data directory in `spool\`; it records
intent before any future native submission and treats uncertain outcomes as
`COMPLETION_UNKNOWN` without automatic reprinting.

Before enabling physical dispatch, verify all of the following on a dedicated
shop workstation: authenticated device pairing, server-authorized shop/job
binding, real printer enumeration, PDF render-to-driver compatibility,
spooler reconciliation after restart, supervised ambiguous-outcome handling,
and signed installer/update delivery.

---

## 2. Platform Telemetry & Observability Endpoints

| Endpoint | Target Consumer | Purpose & Contents |
| :--- | :--- | :--- |
| `GET /api/v1/health/live` | Container Orchestrator | Liveness probe; returns 200 OK if process is running. |
| `GET /api/v1/health/ready` | Caddy / Load Balancer | Readiness probe; verifies PostgreSQL, Valkey, and S3 connectivity. |
| `GET /metrics` | Prometheus Scraper | System performance metrics, active device leases, job latency histograms. |
| `GET /api/v1/superadmin/kpis` | Super Admin Dashboard | Real-time aggregated business KPIs (MRR, active shops, devices, failure %). |

---

## 3. Incident Response Playbooks

### Incident 1: Print Workstation Offline / Jobs Held in `PAID_HELD`
- **Symptom**: Customer phone displays "Order Held Safely: Print workstation is currently offline."
- **Triage Steps**:
  1. Check if the shop owner's Windows PC is turned on and connected to Wi-Fi/Ethernet.
  2. Verify that `PrintBotService` is running in Windows Services (`services.msc`).
  3. Inspect local agent log file: `%PROGRAMDATA%\PrintBot\logs\agent.log`.
  4. Ensure outbound port 443 to cloud API is not blocked by local shop firewall or antivirus.
- **Resolution**: Once the agent establishes an outbound connection, all `PAID_HELD` jobs automatically transition to `QUEUED`.

### Incident 2: Paper Jam / Spooler Drop (`COMPLETION_UNKNOWN`)
- **Symptom**: Job status in desktop UI turns Amber with badge `COMPLETION_UNKNOWN`.
- **Triage Steps**:
  1. Operator must physically inspect the printer output tray.
  2. Check how many physical pages were successfully delivered.
  3. In desktop UI, click the Amber job card to open the Supervised Triage modal.
- **Resolution**:
  - If paper delivered successfully: Click **Confirm Printed** (`PRINT_CONFIRMED`).
  - If paper crumpled / destroyed: Clear jam, then click **Reprint** (`QUEUED`).
  - If customer cancelled or out of stock: Click **Refund Customer** (`REFUNDED`).
  - **Rule: The software NEVER auto-reprints without human supervisor authorization.**

### Incident 3: Payment Webhook Latency / Bank Network Slowdown
- **Symptom**: Customer sees "Waiting for bank confirmation..." on mobile screen for > 30 seconds.
- **Triage Steps**:
  1. Check Razorpay / payment provider status dashboard.
  2. Verify webhook delivery logs in provider merchant portal.
  3. Ensure shop owner has not manually marked cash without collecting money.
- **Resolution**: When the verified webhook arrives, the backend state machine atomically updates the job and pushes real-time SSE event to the customer's phone browser.

### Incident 4: Suspected Stolen Workstation / Unauthorized Account Sharing
- **Symptom**: Anomaly alert in Super Admin dashboard: "Rapid IP Jump" or duplicate device key fingerprint detected.
- **Triage Steps**:
  1. Navigate to Super Admin Licensing Center (`/superadmin/licenses`).
  2. Locate the reported device ID and inspect its public key SHA-256 fingerprint.
  3. Contact the shop owner to confirm whether a PC was replaced or stolen.
- **Resolution**:
  - Click **Revoke Device**: Revocation executes immediately, invalidating all rotating device tokens.
  - In-flight jobs are safely reassigned to other approved devices or held in `PAID_HELD`.
