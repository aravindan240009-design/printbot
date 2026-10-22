---
name: performance-profiling
description: Methodologies for measuring latency percentiles (p50, p95, p99), throughput, Web Vitals, database queries, and desktop resource consumption.
---

# Performance Profiling & Optimization Skill

## Benchmarking Protocol
1. **Never Make Unmeasured Claims**: Every performance statement must be backed by reproducible benchmark metrics.
2. **Key Metric Targets**:
   - Backend API Pricing Quotes: < 10ms p95.
   - Idempotent Webhook Verification: < 15ms p95.
   - Order Queue Submission: < 50ms p95.
   - Frontend Core Web Vitals: LCP < 1.8s, CLS < 0.05, INP < 150ms.
   - Workstation Desktop Boot: < 1.2s to interactive; memory footprint < 120MB.
3. **Execution Tooling**:
   - Python async load harness (`httpx.AsyncClient` concurrent batch runner).
   - Chrome DevTools MCP & Playwright Performance APIs for Web Vitals profiling.
   - PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` for database execution plan verification.
