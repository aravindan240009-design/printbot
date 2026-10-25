# Real Customer-to-Workstation Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the customer-to-shop simulation with the first durable, tenant-safe, mock-paid manual-approval workflow.

**Architecture:** Build from the API boundary inward: signed shop sessions, PostgreSQL-backed repositories and migrations, server-owned document/quote/order state, then device queue APIs and customer integration. Preserve simulation adapters for local proof and isolate real hardware behind the existing Rust agent contract.

**Tech Stack:** FastAPI, Pydantic v2, PostgreSQL, Valkey-compatible queue/cache, Python PDF tooling already approved for Phase 0, React/Vite/TypeScript, Rust workstation agent.

**Spec:** `docs/superpowers/specs/2026-10-25-real-customer-to-workstation-slice-design.md`

## Global Constraints

- Never trust an unchecked client tenant identifier.
- Every persisted operational object has a non-null shop tenant key and composite tenant references.
- Prices are server-authoritative INR paise and locked to an immutable PrintPlan.
- Mock payment is the only local settlement path; browser callbacks never mark orders paid.
- Manual approval is required for the first real slice.
- Ambiguous spool outcomes are `COMPLETION_UNKNOWN`; never automatically reprint.
- No production secrets, customer uploads, live payment credentials, or unsigned release claims are added.

## Review Focus

- A guest token for Shop A cannot read or mutate Shop B assets, quotes, or orders.
- A request body/query cannot switch the resolved shop.
- Replayed payment webhooks and wrong amount/currency cannot mark an order paid.
- Duplicate customer submission and concurrent workstation claims produce one durable result.
- Malformed, encrypted, oversized, or unsupported files fail safely and clean up temporary data.
- Subscription expiry or device revocation prevents new claims without stranding safe resolution/refund of already paid jobs.

---

### Task 1: Database and persistence foundation

**Files:**
- Modify: `infra/migrations/` with a new forward/down migration
- Create/modify: `services/api/db/` repository and connection modules
- Modify: `services/api/core/config.py`, `infra/docker/docker-compose.yml`
- Test: `tests/real_slice/test_persistence_schema.py`

- [ ] Add shops, guest sessions, assets, print jobs, print plans, payment intents/events, devices, idempotency records, outbox events, and audit records with composite tenant constraints.
- [ ] Add indexes and RLS policies for operational tables.
- [ ] Add explicit dev database configuration and fail-closed production settings.
- [ ] Write migration and repository tests before implementation.

### Task 2: Secure tenant context and guest entry

**Files:**
- Modify: `services/api/middleware/tenant.py`, `services/api/routers/qr.py`, `services/api/routers/auth.py`
- Create/modify: `services/api/services/guest_service.py`, `services/api/services/auth_service.py`
- Test: `tests/real_slice/test_guest_tenant_isolation.py`

- [ ] Define signed short-lived guest sessions bound to one shop.
- [ ] Reject unauthenticated operational requests that only supply `X-Tenant-ID`.
- [ ] Preserve authenticated staff/device/super-admin scope rules.
- [ ] Add negative tests for cross-shop read/write, expired sessions, token tampering, and body/query spoofing.

### Task 3: Durable upload, inspection, PrintPlan, and quote

**Files:**
- Modify: `services/api/routers/assets.py`, `services/api/routers/documents.py`, `services/api/routers/orders.py`
- Modify: `services/api/services/asset_service.py`, `conversion_engine.py`, `pricing.py`
- Modify: `packages/contracts/models.py`
- Test: `tests/real_slice/test_document_quote_pipeline.py`

- [ ] Implement shop-scoped upload intents and local private storage adapter.
- [ ] Inspect file magic, MIME, size, supported formats, and page count server-side.
- [ ] Create and lock immutable PrintPlan data used by quote and later rendering.
- [ ] Return logical pages, rendered sides, physical sheets, paise amount, quote hash, and expiry.
- [ ] Test malformed files, page ranges, duplex padding, n-up, price tampering, and cleanup.

### Task 4: Mock payment and manual approval lifecycle

**Files:**
- Modify: `services/api/routers/webhooks.py`, `services/api/routers/orders.py`
- Modify: `services/api/services/payment_provider.py`, `job_service.py`, `state_machine.py`, `idempotency.py`
- Test: `tests/real_slice/test_payment_and_approval.py`

- [ ] Bind payment intents to order, shop, amount, currency, and locked quote.
- [ ] Persist webhook receipt separately from retryable business processing.
- [ ] Enforce idempotency and server-side status verification.
- [ ] Move paid jobs to `AWAITING_APPROVAL`, then `APPROVED` only through authorized staff action.
- [ ] Add refund/cancel safety for failed or expired work.

### Task 5: Paired workstation queue and reconciliation

**Files:**
- Modify: `services/api/routers/devices.py`, `printers.py`, `reconciliation.py`
- Modify: `services/api/services/device_service.py`, `job_service.py`, `reconciliation_service.py`
- Modify: `services/print-agent/src/` only where the authenticated contract requires it
- Test: `tests/real_slice/test_device_queue_and_reconciliation.py`

- [ ] Enforce device-to-shop binding and revocation on heartbeat/claim.
- [ ] Implement a single-winner durable lease for approved jobs.
- [ ] Require immutable job/plan identity in spool events.
- [ ] Record spool submission and unknown outcome without automatic reprint.
- [ ] Add cross-shop claim and concurrent-claim negative tests.

### Task 6: Customer-web API integration

**Files:**
- Modify: `apps/customer-web/src/App.tsx`, `apps/customer-web/src/locales.ts`
- Modify: `packages/api-client/src/index.ts`, `packages/contracts/src/types.ts`
- Test: `tests/real_slice/test_customer_flow_e2e.py` and Playwright coverage when browser dependencies are available

- [ ] Resolve the shop-bound guest session from QR context.
- [ ] Upload files through API intents and show server validation/preview state.
- [ ] Replace placeholder quote values with the locked server quote.
- [ ] Start mock payment and show verified order status.
- [ ] Keep graceful offline/error states and retain the simulation notice only where integration is not available.

### Task 7: Verification and local runbook

**Files:**
- Modify: `infra/docker/docker-compose.yml`, `README.md`, `docs/PHASE0_EXECUTION.md`
- Create: `docs/REAL_SLICE_RUNBOOK.md`, `tests/real_slice/fixtures/`

- [ ] Run migration tests and API integration tests against local PostgreSQL.
- [ ] Run frontend build/type-check and browser journey.
- [ ] Run Rust agent tests where toolchain is available.
- [ ] Document exact commands, evidence, and blocked external gates.
- [ ] Perform a final tenant/security review before describing the slice as working.
