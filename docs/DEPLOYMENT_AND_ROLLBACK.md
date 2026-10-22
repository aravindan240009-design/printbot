# Print Bot Deployment, Migration & Rollback Runbook

## 1. Production Architecture Overview
The Print Bot cloud deployment follows an open-source-first, secure **modular monolith** topology designed to operate efficiently on self-hosted bare metal or standard virtual private servers (VPS).

```mermaid
flowchart TD
    InternetTraffic["Internet Customers & Desktop Agents"] -->|HTTPS (443) / WSS| Caddy["Caddy Reverse Proxy (Auto Let's Encrypt TLS)"]
    Caddy -->|Reverse Proxy :8000| FastAPI["FastAPI Modular Monolith (Uvicorn Workers)"]
    FastAPI -->|Connection Pool :5432| Postgres[("PostgreSQL 16 (Forced RLS)")]
    FastAPI -->|Cache & Outbox :6379| Valkey[("Valkey (OSS Redis Alternative)")]
    FastAPI -->|S3 Presigned API :8333| SeaweedFS[("SeaweedFS S3-Compatible Storage")]
```

---

## 2. Containerized Deployment (Podman / Docker Compose)

```yaml
version: "3.8"

services:
  caddy:
    image: caddy:2.8-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/caddy/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.api
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://printbot:secret_db_pass@postgres:5432/printbot_db
      - VALKEY_URL=redis://valkey:6379/0
      - S3_ENDPOINT_URL=http://seaweedfs:8333
      - S3_BUCKET_NAME=printbot-assets
      - SECRET_KEY=${PRODUCTION_SECRET_KEY}
    depends_on:
      - postgres
      - valkey
      - seaweedfs

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=printbot
      - POSTGRES_PASSWORD=secret_db_pass
      - POSTGRES_DB=printbot_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  valkey:
    image: valkey/valkey:7.2-alpine
    restart: unless-stopped
    volumes:
      - valkey_data:/data

  seaweedfs:
    image: chrislusf/seaweedfs:latest
    restart: unless-stopped
    command: "server -dir=/data -s3"
    volumes:
      - seaweedfs_data:/data

volumes:
  caddy_data:
  caddy_config:
  postgres_data:
  valkey_data:
  seaweedfs_data:
```

---

## 3. Database Migration & Rollback Strategy

All database schema changes are managed via idempotent SQL migration files located in `infra/migrations/`. Each migration includes both a forward (`schema.sql`) and a reverse rollback (`down.sql`) script:

| Phase | Forward Migration Script | Rollback Script | Core Tables Managed |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `001_phase1_schema.sql` | `001_phase1_down.sql` | `shops`, `subscriptions`, `print_jobs`, `devices`, `audit_events` |
| **Phase 4** | `002_phase4_schema.sql` | `002_phase4_down.sql` | `outbox_events`, `merchant_payment_configs`, `daily_settlement_reconciliations` |
| **Phase 5** | `003_phase5_schema.sql` | `003_phase5_down.sql` | `service_catalogues`, `bookings`, `booking_events` |
| **Phase 6** | `004_phase6_schema.sql` | `004_phase6_down.sql` | `break_glass_sessions`, `step_up_challenges`, `agent_fleet_releases`, `shop_tax_invoices` |
| **Phase 7** | `005_phase7_schema.sql` | `005_phase7_down.sql` | `shop_presets`, `prepaid_corporate_accounts`, `prepaid_transactions`, `resumable_upload_sessions` |

### Automated Migration Execution
```bash
# Apply pending migrations forward
python -m infra.migrations.runner --apply

# Rollback latest migration if emergency occurs
python -m infra.migrations.runner --rollback-step 1
```

---

## 4. Windows Desktop Agent Deployment & Updates

1. **Packaging**:
   - Built using Tauri 2 CLI: `cargo tauri build`.
   - Produces standalone installer: `PrintBot_Setup_1.0.0_x64.exe` / `.msi`.
2. **Fleet Release Channels**:
   - `CANARY`: Deployed to internal staging hardware and developer testbeds.
   - `STAGED_ROLLOUT`: Deployed to 10% pilot shops for 48-hour canary burn-in.
   - **`PRODUCTION`**: General commercial distribution.
3. **Emergency Desktop Rollback**:
   - If an agent version exhibits spooler instability on specific Windows drivers, Super Admin issues a fleet deprecation signal via `/api/v1/superadmin/fleet/releases`.
   - The desktop client checks version validity on heartbeat and downgrades or holds safely in supervised mode.
