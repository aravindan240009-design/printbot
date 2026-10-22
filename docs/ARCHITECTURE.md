# Architecture & System Design Documentation

## System Overview
The Xerox / PrintFlow SaaS platform is a unified cloud-and-edge printing ecosystem designed for retail print shops, university copy centers, and commercial reprographics franchises.

```mermaid
flowchart TD
    subgraph Client Tier
        W[Mobile/Web Client - Next.js]
        D[Counter Desktop Workstation - Tauri 2 / Rust]
    end

    subgraph Cloud Gateway & API
        API[FastAPI Cloud API]
        MW[Tenant Context Middleware]
        IDEM[Idempotency & Replay Store]
    end

    subgraph Persistence & Infrastructure
        DB[(Supabase PostgreSQL + RLS)]
        R[(Redis Queue & Cache)]
        R2[(Cloudflare R2 Encrypted Storage)]
    end

    subgraph Native Windows Hardware
        SPOOL[Windows Print Spooler - winspool.drv]
        PRINTERS[Physical Xerox / Canon High-Speed Printers]
    end

    W -->|Submit Order / Pay| API
    D -->|Claim Paid Jobs / Sync| API
    API --> MW
    MW --> IDEM
    IDEM --> DB
    API --> R
    API --> R2
    D -->|Direct Win32 Spool| SPOOL
    SPOOL --> PRINTERS
```

## Security & Multi-Tenancy Architecture
1. **Tenant Separation**:
   - `X-Tenant-ID` header required on all operational endpoints.
   - Database Row-Level Security (RLS) ensures SQL queries cannot cross tenant boundaries.
2. **Idempotency & Zero Double-Charge Guarantee**:
   - Webhook events validated with HMAC-SHA256 signatures with 300-second replay rejection window.
   - Transactional deduplication via unique `(tenant_id, event_id)` records.
3. **Hardware Reconciliation**:
   - Local journal records physical spool submission before communicating status back to cloud.
   - Zero duplicate print dispatch across power outages or network reconnects.
