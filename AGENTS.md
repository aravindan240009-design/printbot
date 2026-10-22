# Engineering Instructions & Agent Charter

## Mission
Build and maintain a world-class, secure, high-performance Print Shop SaaS platform ("Xerox / PrintFlow") consisting of:
1. **Mobile-First Customer Web App**: Next.js 14/15, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, Motion.
2. **Workstation Operator Desktop App**: Tauri 2, React, TypeScript, Rust / Windows native printing APIs (`winspool.drv`).
3. **Core Cloud API**: Python 3.11+, FastAPI, Pydantic v2, PostgreSQL (Supabase with RLS), Redis, and Cloudflare R2 object storage.
4. **Reliable Worker Fleet**: Background asynchronous job processors for document page counting, thumbnail generation, rasterization, and automated cleanup.

---

## Architectural Principles
- **Unified Cloud Backend**: The website, desktop counter app, and worker fleet communicate with a single cloud API, sharing typed API contracts, authorization policies, and business logic.
- **Strict Multi-Tenant Separation**: Every database table, query, cache key, and storage path MUST be isolated by `tenant_id`. Cross-tenant data leakage is a zero-tolerance defect.
- **Idempotency & Replay Protection**: All payment webhooks, order submissions, and print spool dispatches MUST use idempotency keys. Re-delivering a webhook or network re-tries MUST NEVER cause duplicate credit deductions, duplicate charges, or duplicate physical prints.
- **Safe Print-Job Spool Reconciliation**: The desktop application tracks physical print spooler state via a two-phase local journal. Offline workstations spool locally and reconcile with the cloud upon reconnection without duplicate printing.
- **Performance by Measurement**: Latency and throughput must be measured (p50, p95, p99) under load rather than claimed without evidence.

---

## Multi-Agent Orchestration Matrix

| Role | Responsibility & File Scope | Handoff Protocol & Gates |
| :--- | :--- | :--- |
| **Lead Architect** | Overall system design, `contracts/`, `AGENTS.md`, and final integration | Freezes API contracts before parallel agent execution |
| **UI/UX Designer** | `packages/ui/`, `apps/web/`, Design tokens, accessibility WCAG AA | Must verify mobile responsiveness (360px) and dark mode |
| **Motion & 3D** | `packages/ui/src/motion/`, Three.js canvas, GSAP guidelines | Requires reduced-motion fallback and demand rendering (`frameloop="demand"`) |
| **Backend Architect** | `services/api/`, `services/worker/`, FastAPI routers, pricing engine | Validates multi-tenant boundaries (`X-Tenant-ID`) and idempotency |
| **Windows Desktop** | `apps/desktop/`, Tauri 2, Rust native winspool integrations | Hardware offline recovery and zero duplicate print guarantees |
| **QA / Security Lead** | `tests/`, benchmark harnesses, security reviews, GitHub Actions | Requires 100% test pass rate and p95 benchmark evidence |

### Parallel Workstream Safety Rules
1. **Contract Freeze**: API contracts in `packages/contracts` must be locked before parallel subagents begin work.
2. **Non-Overlapping Scopes**: Subagents are strictly partitioned by directory (e.g. `services/api` vs `apps/web` vs `apps/desktop`). Never assign two agents to edit the same file simultaneously.
3. **Git Worktree Isolation**: Use independent Git worktrees (`git worktree add`) when parallel agents work on separate features.

---

## Engineering Quality Gates
- **Type Checking**: `pnpm -r type-check` and `mypy` must pass with zero errors.
- **Automated Tests**: All unit and integration tests (`pytest tests/`) must pass.
- **Performance**: p95 pricing and order creation latency must stay < 25ms under concurrent load.
- **Security**: No secrets committed; HMAC signatures required for webhooks; all storage paths tenant-prefixed.
