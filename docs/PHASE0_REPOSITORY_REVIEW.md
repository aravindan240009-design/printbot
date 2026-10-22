# Phase 0 whole-repository review

Date: 2026-10-22. Scope: the user's follow-up request to go through repository files
and available skills/plugins/connectors/MCPs. This is an inspection artifact, not
implementation, release clearance or Phase 0 completion.

## Coverage and methods

The initial review snapshot contains **306 nonignored files**: **69 project files**,
**35 local SKILL.md files** and **202 skill support files**. Excluded `.git`, installed
dependencies, build outputs and caches. Files generated during this review are
listed below separately and do not retroactively change snapshot counts.

The project files were reviewed across API/contracts/tests/SQL, clients/shared UI,
native printing, deployment/workflows/scripts, root configuration and documentation.
All 35 local skill instructions were read by the instruction reviewer. Supporting
skill assets were inventoried and inspected selectively; no claim is made that all
CSV/catalog rows and upstream reference prose received a line-by-line review.
Every inventoried file was read for byte count and SHA-256. All 26 JSON files parsed;
all 39 Python files passed AST parsing. Syntax checks do not establish functionality.
See `PHASE0_FILE_INVENTORY.json` for the snapshot, hashes and per-file machine checks.

Three focused read-only reviewers covered server security, clients/release and local
instructions. Their findings were inspected against source; six security/contract
probes were independently repeated in a fresh local TestClient process using only
synthetic in-memory data. No production service, real payment or physical printer
was used. No global agent synchronization or setup script was executed.

## Stop-ship findings

| Priority | Finding and source evidence | Observed consequence / required direction |
| --- | --- | --- |
| P0 | `services/api/middleware/tenant.py:29-40` accepts X-Tenant-ID as identity | Unauthenticated read with victim's header returned victim order, HTTP 200. Resolve shop from authenticated membership or shop-bound guest session |
| P1 | `services/api/routers/reconciliation.py:12-17`, `services/api/services/reconciliation_service.py:26-45` trust body tenant and reported job IDs | Header shop-other/body shop-victim changed victim unpaid job to PRINTING, HTTP 200. Bind paired device/shop and enforce payment/state/evidence policy |
| P1 | `services/api/routers/printers.py:65-74`, `services/api/services/job_service.py:94-97` ignore workstation ownership and accept arbitrary enum transitions | Unrelated workstation rolled job back to PENDING_PAYMENT, HTTP 200. Enforce ownership, event/state machine and immutable acceptance policy |
| P1 | `services/api/routers/webhooks.py:58-66` strips mock ID prefix without amount/currency/merchant/checkout verification | Correctly signed zero-value EUR event queued a USD order. Require server-created checkout binding and provider-specific verified settlement state |
| P1 | `services/api/core/config.py:7-11` permits public fallback signing secret in production | Configuration omission permits signatures generated with a checked-in test value. Fail closed outside explicit simulation; this is not evidence of a real leaked production credential |
| P1 | `services/api/services/job_service.py:75-84` uses non-atomic claim | Two threads synchronized after QUEUED check both returned successful SPOOLING claims. Use transactional single-winner claim/lease and durable outbox |
| P1 | `services/api/services/job_service.py:15-17`, `services/api/core/idempotency.py:13-15` use process dictionaries | Restart loses records; Docker command starts four independent workers. SQL/Redis declarations do not provide running persistence; check/start dedup is also non-atomic |
| P1 | `services/api/services/job_service.py:19-20,55-59` uses delimiter key plus prefix filter | Tenant shop-prefix listed job belonging to shop-prefix:other, HTTP 200. Use exact structured tenant keys and validated identities |
| P1 | `infra/migrations/001_initial_schema.sql:58-59,71-77` lacks composite tenant FK and operational role/policy setup | Spool event tenant can differ from referenced job; idempotency/spool tables have no policies. Runtime never uses DB context; RLS enforcement remains UNVERIFIED |
| P1 | `services/api/routers/webhooks.py:73-90` acknowledges/caches all processing exceptions | Transient/missing-order processing failure can be permanently deduplicated as handled. Persist reception separately from retryable business processing |
| P1 | `apps/desktop/src-tauri/src/main.rs:30-55,69-79`, `apps/desktop/src/App.tsx:69-91` invent hardware/submission/completion | Native call returns fixed ID 1042 without Win32 submission; UI completes by timer. Replace only in scoped proof or label/exclude legacy simulation; never use as printer evidence |
| P1 | `packages/api-client/src/index.ts` forwards camelCase PrintOptions to snake_case Pydantic model | Color/A3/duplex/200gsm silently normalized to bw/A4/simplex/75gsm in repro. Generate/validate wire contracts; forbid unknown fields and verify parity |

## Build, release and product gaps

- `infra/docker/Dockerfile.api:12` copies absent `requirements.txt`; image build is
  not reproducible from checkout. Compose API/Postgres passwords differ. No container
  build was attempted or reported passed.
- Desktop lacks `index.html`, JS entrypoint, TypeScript/Vite configuration, Tauri
  `build.rs` and configured icons. Rust/Cargo and node_modules are unavailable.
  Shared `Badge.tsx:9-17` declares a required `text` style field missing from every
  entry. These are source-level build findings, not an executed compiler diagnostic.
- `.github/workflows/ci.yml` installs floating Python dependencies, omits the
  EmailStr validation dependency, has no database/RLS/hardware/contract checks and
  skips missing workspace type-check scripts. No resolved lockfiles exist.
- `.github/workflows/desktop-release.yml:30-47` resolves unlocked dependencies and
  requests a non-draft release labeled production without signing/SBOM/hardware
  gate. Tauri config has CSP disabled and no configured signing identity. No release
  workflow was run. No assertion is made that it would currently build successfully.
- `scripts/sync-all-agents.ps1` force-writes several global agent configurations
  and overwrites skills; uses floating MCP packages. `setup-environment.ps1` copies
  skills globally by default and can print completion after failures. Running these
  is not necessary to review MCP availability and was deliberately excluded.
- Client UI upload/payment/queue states are simulated. API printers are global
  fixtures. Worker reports a valid PDF/security scan for arbitrary paths without
  inspecting a file. Health readiness reports connected services without checks.
- Pricing remains global USD/cents, accepts client page counts and lacks per-shop
  immutable pricing/PrintPlan. Guest flow, two explicit order modes, one subscription,
  entitlement, pairing, booking capacity, real conversion and deletion are absent.
  Do not start those Phase 1 features during this inspection.
- Native bridge genuinely queries installed queue names, but does not establish
  printer capabilities, render compatibility or physical output. Two virtual queues
  do not satisfy any real-model hardware certification gate.
- Existing benchmark makes sequential in-process ASGI calls and acknowledges
  nonexistent payment orders; it does not establish real infrastructure throughput
  or successful payment processing. Prior README metrics were not re-certified.

## Executed validation

`python -m pytest tests -q -p no:cacheprovider`: **7 passed in 0.83s** in the
security review process. These tests do not cover the reproduced failures.

Independent fresh `python -B -` TestClient probe produced:

```json
{
  "unauthenticated_victim_read": {"http": 200, "returned_victim_job": true},
  "cross_tenant_reconciliation": {"http": 200, "victim_status": "PRINTING"},
  "unowned_status_rollback": {"http": 200, "victim_status": "PENDING_PAYMENT"},
  "zero_amount_wrong_currency": {"http": 200, "status": "QUEUED"},
  "tenant_prefix_disclosure": {"http": 200, "foreign_job_present": true},
  "camelcase_options_effective": {
    "color_mode": "bw", "paper_size": "A4", "duplex_mode": "simplex", "paper_gsm": 75
  }
}
```

The probe created synthetic orders, signed the synthetic event with the configured
local test secret without printing it, performed the requests above, then cleared
both in-memory stores. No file/customer document or external payment was touched.
The claim race used Python thread tracing to place a barrier at job_service.py:82
after both status checks; both threads then executed the unlocked assignments.
This is a deterministic scheduling demonstration, not a measured race frequency.
PostgreSQL migration execution, TypeScript/Rust builds, container builds, mobile
E2E/accessibility and printer tests remain UNVERIFIED.

## Skills, plugins and connectors

See `PHASE0_SKILLS_AND_CONNECTORS.md` for applicability, conflicts and verified
connection observations. `PHASE0_TOOL_INVENTORY.json` inventories exposed tool
names only. A tool being exposed or plugin being installed does not certify that
an account, remote environment or provider data is accessible.

## Status and handoff

IMPLEMENTED: full project inspection report, hash inventory and tool/applicability
records. Product implementation remains as before this review.
TESTED: existing Python tests, machine syntax/JSON checks and synthetic attack/
contract probes. BLOCKED/UNVERIFIED: Phase 0 proof/schema/fixtures/SBOM, missing
master DOCX/Claude PDF, design approval, Rust toolchain, audited PDFium artifact,
physical models, live payment/signing/privacy gates.

New review files: `docs/PHASE0_REPOSITORY_REVIEW.md`,
`docs/PHASE0_FILE_INVENTORY.json`, `docs/PHASE0_TOOL_INVENTORY.json`,
`docs/PHASE0_SKILLS_AND_CONNECTORS.md`. Updated: `docs/PHASE0_EXECUTION.md`,
`docs/RISK_REGISTER.md`. Existing user AGENTS.md edit remains untouched.
No product source, global agent config, provider setting, database or printer was
changed. No new ADR is needed: proposed ADR 0001 already records the governing
contract and isolated proof direction.

Copy-paste handoff: Continue Phase 0 only. Read this review and dated design. Treat
all existing apps as unsafe scaffold. Implement the isolated proof after the existing
written design gate is resolved; do not retrofit Phase 1 under this review. Preserve
the cross-tenant/payment/concurrency/contract failures as future regression cases.
Resolve toolchain, exact artifact licenses, schema parity and hardware evidence;
keep physical gate BLOCKED and do not claim release readiness.
