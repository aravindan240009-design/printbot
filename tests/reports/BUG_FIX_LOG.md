# Defect Triage, Self-Healing & Bug Fix Log

This log documents every defect discovered during platform test iterations, root causes, exact file changes, regression test coverage, and final verification status.

---

### Defect 1: TypeScript Contract Mismatch in Prototype Web App
- **Bug ID**: `BUG-TS-001`
- **Severity**: `P2` (Type Mismatch)
- **Reproduction Steps**: Execute `pnpm -r type-check` across the monorepo workspace.
- **Root Cause**: `apps/web/app/page.tsx` was written using early snake_case properties (`color_mode`, `duplex_mode`, `page_range`, `paper_size`, `pages_per_sheet`), whereas `@xerox/contracts` defines strict camelCase properties (`colorMode`, `duplexMode`, `pageRange`, etc.).
- **Files Changed**:
  - [`apps/web/app/page.tsx`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/apps/web/app/page.tsx)
  - [`packages/contracts/tsconfig.json`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/packages/contracts/tsconfig.json)
  - [`packages/api-client/tsconfig.json`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/packages/api-client/tsconfig.json)
  - [`packages/ui/tsconfig.json`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/packages/ui/tsconfig.json)
- **Regression Test**: `pnpm -r type-check`
- **Final Status**: **VERIFIED FIXED (0 errors across 9 projects)**

---

### Defect 2: Missing Styles in UI Badge Component
- **Bug ID**: `BUG-UI-002`
- **Severity**: `P2` (UI Type Narrowing)
- **Reproduction Steps**: Run `tsc --noEmit` on `packages/ui`.
- **Root Cause**: `packages/ui/src/components/Badge.tsx` defined `Record<JobStatus, { bg: string; text: string; label: string }>` while omitting `text` in object literals and failing to cover new Phase 4-8 job states (`COMPLETION_UNKNOWN`, `PAID_HELD`, `SPOOL_SUBMITTED`).
- **Files Changed**:
  - [`packages/ui/src/components/Badge.tsx`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/packages/ui/src/components/Badge.tsx)
- **Regression Test**: `pnpm -r type-check`
- **Final Status**: **VERIFIED FIXED (Partial record with robust fallback)**

---

### Defect 3: Webhook Idempotency Store Cross-Test Collision
- **Bug ID**: `BUG-PAY-003`
- **Severity**: `P1` (Test Isolation)
- **Reproduction Steps**: Run `pytest tests/` consecutively with static webhook event IDs.
- **Root Cause**: The global singleton `idempotency_store` retains recorded event IDs between tests in the same process, causing subsequent test calls with static event IDs like `evt_auto_001` to replay cached 200 responses rather than processing the new test order.
- **Files Changed**:
  - [`tests/phase8/test_enterprise_integration_and_hardening.py`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/tests/phase8/test_enterprise_integration_and_hardening.py)
- **Regression Test**: Test suite resets `idempotency_store.clear()` and uses dynamic UUID-prefixed event IDs (`f"evt_p8_{uuid.uuid4().hex[:8]}"`).
- **Final Status**: **VERIFIED FIXED (100% pass across 12 integration scenarios)**

---

### Defect 4: Tenant Context Requirement on Virtual Lab Endpoints
- **Bug ID**: `BUG-LAB-004`
- **Severity**: `P1` (Diagnostic API Accessibility)
- **Reproduction Steps**: Call `/api/v1/lab/devices` without supplying `X-Tenant-ID` header.
- **Root Cause**: `TenantContextMiddleware` blocked `/api/v1/lab/*` with `400 Bad Request` because lab diagnostic endpoints were not registered in the exempt paths list.
- **Files Changed**:
  - [`services/api/middleware/tenant.py`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/services/api/middleware/tenant.py)
- **Regression Test**: `tests/test_virtual_printer_lab.py` (7 tests passed in 1.88s).
- **Final Status**: **VERIFIED FIXED**

---

### Defect 5: Unsafe Auto-Reprint on Ambiguous Mechanical Jams
- **Bug ID**: `BUG-SPOOL-005`
- **Severity**: `P0` (Paper & Billing Safety Invariant)
- **Reproduction Steps**: Simulate printer jam or agent crash after print intent recorded.
- **Root Cause**: Spooler drivers that drop connection or jam can leave partial physical output in the output tray. Treating disappearance as a failure eligible for automatic reprint risks double-printing customer documents and wasting shop paper.
- **Files Changed**:
  - [`services/api/services/virtual_shop_lab.py`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/services/api/services/virtual_shop_lab.py)
  - [`services/api/services/reconciliation_service.py`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/services/api/services/reconciliation_service.py)
  - [`services/print-agent/src/journal.rs`](file:///c:/Users/ashok/OneDrive/Desktop/xerox/services/print-agent/src/journal.rs)
- **Regression Test**: `tests/test_virtual_printer_lab.py::test_printer_7_paper_jam_recovery_invariant`, `tests/test_print_reconciliation.py`.
- **Final Status**: **VERIFIED FIXED (Transitions strictly to `COMPLETION_UNKNOWN` with supervised operator confirmation)**
