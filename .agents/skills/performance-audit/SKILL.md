---
name: performance-audit
description: Procedures for profiling latency, measuring throughput (p50, p95, p99), diagnosing bottlenecks, and optimizing database queries and bundle sizes.
---

# Performance Audit Skill

## Latency & Benchmark Directives
1. **Never make unverified performance claims**: Always quantify using automated benchmark scripts.
2. **Key Metric Targets**:
   - Cloud API pricing calculation: < 25ms p95.
   - Idempotent webhook processing: < 50ms p95.
   - Order creation & queue dispatch: < 100ms p95.
   - Desktop UI frame rate: 60fps steady; initial boot < 1.2s.
3. **Database Performance**:
   - Composite indexes on high-frequency filters: `(tenant_id, status, created_at)`.
   - Prevent N+1 queries by using joined loads or eager preloading.
4. **Benchmarking Tooling**:
   - Python `httpx` async concurrent stress harness (`benchmark_latency.py`).
   - Playwright Performance metrics (LCP, FID, CLS).
