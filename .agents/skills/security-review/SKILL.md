---
name: security-review
description: Security verification standards, tenant isolation checks, webhook signature verification, and secret safety for Print Shop SaaS.
---

# Security Review Skill

## Security Principles
1. **Multi-Tenant Boundary**: Tenant A must NEVER see or mutate Tenant B's documents, orders, printers, or metrics.
2. **Webhook Replay Protection**:
   - Verify HMAC signatures on all incoming payment webhooks (Stripe/Razorpay/Supabase).
   - Reject webhooks older than 300 seconds (timestamp replay window).
   - Enforce idempotent event processing via transactional ledger / Redis deduplication key.
3. **Document Security**:
   - Store documents in Cloudflare R2 / S3 with customer/tenant prefixed paths: `tenants/{tenant_id}/jobs/{job_id}/{file_name}`.
   - Serve files exclusively via short-lived pre-signed URLs (maximum 15 minutes TTL).
4. **Secret Management**:
   - Zero committed credentials in git.
   - All secret accesses via strongly-typed environment configuration.
