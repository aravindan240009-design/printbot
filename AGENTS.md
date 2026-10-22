# Engineering Instructions & Agent Charter

## Mission
Build and maintain a world-class, secure, high-performance Print Shop SaaS platform ("Xerox / PrintFlow") consisting of:
1. **Mobile-First Customer Web App**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Motion.
2. **Workstation Operator Desktop App**: Tauri 2, React, TypeScript, Rust / Windows native printing APIs (`winspool.drv`).
3. **Core Cloud API**: Python 3.11+, FastAPI, Pydantic v2, PostgreSQL (Supabase), Redis, and Cloudflare R2 object storage.
4. **Reliable Worker Fleet**: Background asynchronous job processors for document page counting, thumbnail generation, rasterization, and automated cleanup.

---

## Architectural Principles
- **Unified Cloud Backend**: The website, desktop counter app, and worker fleet communicate with a single cloud API, sharing typed API contracts, authorization policies, and business logic.
- **Strict Multi-Tenant Separation**: Every database table, query, cache key, and storage path MUST be isolated by `tenant_id`. Cross-tenant data leakage is a zero-tolerance defect.
- **Idempotency & Replay Protection**: All payment webhooks, order submissions, and print spool dispatches MUST use idempotency keys. Re-delivering a webhook or network re-tries MUST NEVER cause duplicate credit deductions, duplicate charges, or duplicate physical prints.
- **Safe Print-Job Spool Reconciliation**: The desktop application tracks physical print spooler state. Offline workstations spool locally and reconcile with the cloud upon reconnection without duplicate printing.
- **Performance by Measurement**: Latency and throughput must be measured (p50, p95, p99) under load rather than claimed without evidence.

---

## Engineering Process
1. **Inspect before modifying**: Understand existing schemas, contracts, and components before making edits.
2. **Contract-First Development**: Define or update Pydantic models and TypeScript schemas in `packages/contracts` first.
3. **Test-Driven Discipline**: Write automated tests (`pytest`, Vitest, Playwright) before or alongside implementation.
4. **Quality Gates**: All code must pass type checks (`tsc`, `mypy`), linting (`ruff`), and security review before completion.
5. **Report Truthfully**: Provide benchmark numbers, test outputs, and explicit residual risks.

---

## Frontend Mandates (Web & Desktop)
- Mobile-first, fully responsive design tested down to 360px viewport.
- Accessible by default: WCAG 2.1 AA compliance, keyboard navigation, visible focus indicators, and screen-reader ARIA landmarks.
- Respect reduced-motion preferences (`prefers-reduced-motion`).
- Consistent design system leveraging Tailwind CSS, Radix UI primitives, and Lucide icons.
- Instant, client-side optimistic UI feedback paired with robust error boundaries.

---

## Backend & API Mandates
- Asynchronous FastAPI endpoints with typed Pydantic v2 schemas.
- Dependency injection for database sessions, tenant validation, and auth context.
- Centralized exception handlers converting business errors to standard RFC 7807 Problem Details.
- Never block HTTP request threads on heavy compute (PDF rasterization, file conversions, print streaming); dispatch to background worker queue.
- OpenAPI specification auto-generated and synchronized with `packages/api-client`.

---

## Security Directives
- NEVER hardcode secrets, API keys, or tokens in source code or repositories.
- Validate every incoming webhook using cryptographic signatures (HMAC-SHA256).
- Use signed URLs with strict TTLs for Cloudflare R2 document storage.
- Enforce Least Privilege on database roles and API scopes.
- Sanitize all file uploads (MIME type check, magic byte validation, anti-virus / malformed PDF checks).

---

## Windows Desktop & Native Printing Directives
- Native operations encapsulated in Rust Tauri commands and Windows winspool integrations.
- Handle hardware disconnections, out-of-paper, and spooler stalls gracefully with auto-reconnect.
- Maintain an append-only local SQLite ledger for offline print recovery.
- Atomic state transitions: `QUEUED -> SPOOLING -> SPOOLED_CONFIRMED -> PRINTED`.

---

## Agent Orchestration Workflow
- **Lead Architect / Coordinator**: Owns architecture, contracts, task decomposition, and final integration.
- **Parallel Subagents**: Assigned strictly non-overlapping directory scopes (e.g., `services/api` vs `apps/web` vs `infra`).
- Contracts and schemas must be locked before parallel agent execution.
