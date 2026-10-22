---
name: postgresql-performance
description: Production PostgreSQL optimization directives, composite indexing, query profiling, connection pooling, and Row-Level Security (RLS) enforcement.
---

# PostgreSQL Performance & Optimization Skill

## Core Directives
1. **Indexing Strategy**:
   - Create composite B-tree indexes matching filter + sort patterns: `CREATE INDEX idx_jobs_tenant_status ON print_jobs (tenant_id, status, created_at DESC);`
   - Use partial indexes for active queues: `CREATE INDEX idx_jobs_active_queue ON print_jobs (tenant_id) WHERE status IN ('QUEUED', 'SPOOLING');`
2. **Preventing N+1 Queries**:
   - Always use `selectinload` or joined queries in SQLAlchemy when fetching relationships.
3. **Connection Pooling**:
   - Use PgBouncer or native asyncpg connection poolers (min 5, max 20 connections per API container).
4. **Row-Level Security (RLS)**:
   - Ensure RLS policies use indexed session variables:
     `CREATE POLICY tenant_isolation ON print_jobs USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);`
5. **Execution Plan Audits**:
   - Run `EXPLAIN (ANALYZE, BUFFERS)` on slow queries. Ban sequential table scans on production multi-tenant tables.
