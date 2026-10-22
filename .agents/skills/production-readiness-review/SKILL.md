---
name: production-readiness-review
description: Comprehensive pre-flight release checklist covering security, observability, multi-tenancy, idempotency, testing, and Windows packaging.
---

# Production Readiness Review Skill

## Go/No-Go Verification Checklist
Before approving any production deployment or release build, verify:

### 1. Architecture & Reliability
- [ ] Automated test suite (`pytest`, Vitest) passes with 100% success.
- [ ] Database migrations are tested forwards and backwards; no locking alterations on large tables.
- [ ] Background worker queues handle retries with dead-letter storage.

### 2. Multi-Tenancy & Security
- [ ] All database queries filter strictly by `tenant_id`.
- [ ] Payment webhooks verify cryptographic HMAC signatures and reject expired replay timestamps.
- [ ] Cloudflare R2 / S3 paths are prefixed by `tenant_id` and use presigned URLs with maximum 15-minute TTL.
- [ ] Zero secrets committed in repository (`.env.example` verified).

### 3. Windows Native & Hardware
- [ ] Two-phase spool ledger ensures zero duplicate prints across network dropouts.
- [ ] Offline recovery protocol reconciles successfully with cloud API.
- [ ] Windows installer builds cleanly with verified SHA-256 hash.

### 4. Observability & Performance
- [ ] Structured JSON logging active across all services.
- [ ] Sentry / OpenTelemetry error tracking enabled.
- [ ] Benchmark latencies confirmed: p95 API response < 25ms.
- [ ] Health and readiness endpoints (`/health/live`, `/health/ready`) return 200 OK.
