---
name: test-driven-development
description: Test-driven development standards for Print Shop SaaS across backend (pytest), frontend (vitest), and end-to-end user journeys (playwright).
---

# Test-Driven Development Skill

## Testing Hierarchy
1. **Unit Tests**:
   - Pricing formulas (paper weights, duplex multipliers, volume discounts).
   - Idempotency key hash generation and replay check.
   - Print job state machine transitions.
2. **Integration Tests**:
   - Multi-tenant boundary enforcement (assert 403/404 across tenants).
   - Webhook processing with signed HMAC tokens.
   - Spool reconciliation when printer simulates paper out or offline status.
3. **End-to-End Tests**:
   - Customer document upload -> price review -> payment simulation -> order tracking.
   - Workstation queue monitor -> job claim -> simulated spool -> status synchronization.
