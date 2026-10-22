---
name: database-design
description: Schema standards, indexing strategies, tenant-safe foreign key constraints, and migrations for PostgreSQL on Supabase.
---

# Database Design Skill

## Schema Standards
1. **Mandatory Tenant Foreign Key**:
   - Every entity (`print_jobs`, `customers`, `printers`, `spool_events`, `pricing_rules`) MUST carry a non-null `tenant_id` UUID column.
2. **Row-Level Security (RLS)**:
   - For PostgreSQL / Supabase, enable RLS on all operational tables:
     `ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;`
     `CREATE POLICY tenant_isolation ON print_jobs USING (tenant_id = current_setting('app.current_tenant_id')::uuid);`
3. **Idempotency Record Table**:
   - Store idempotency keys with unique constraint: `UNIQUE (tenant_id, idempotency_key)`.
   - Store response status code, payload hash, and response body with a 24-hour TTL.
4. **Indexes**:
   - `idx_print_jobs_tenant_status_created` on `(tenant_id, status, created_at DESC)`.
   - `idx_spool_events_job_id` on `(job_id)`.
