---
name: secure-multitenancy
description: Zero-tolerance tenant isolation policies, defense-in-depth, cryptographic verification, and cross-tenant leakage prevention.
---

# Secure Multi-Tenancy Skill

## Directives
1. **Never Trust Client Tenant Identifiers**:
   - Extract `tenant_id` from cryptographically signed JWTs or authenticated server-to-server API keys.
   - For client portal uploads, require `X-Tenant-ID` header and validate against active tenants repository before processing.
2. **Database Isolation**:
   - Every single table must have a non-nullable `tenant_id UUID` column.
   - Enforce multi-tenancy at both query level (`WHERE tenant_id = :tenant_id`) and database engine level via PostgreSQL RLS.
3. **Storage Isolation**:
   - S3 / R2 buckets must partition paths strictly: `tenants/{tenant_id}/jobs/{job_id}/{filename}`.
   - Never generate pre-signed download URLs without verifying the requester belongs to `{tenant_id}`.
4. **Automated Cross-Tenant Testing**:
   - Write integration tests asserting that Tenant B receives `404 Not Found` when trying to view, update, or cancel Tenant A's orders.
