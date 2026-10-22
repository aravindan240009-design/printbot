---
name: api-contract-testing
description: Methodologies for maintaining strict type-level parity between backend Pydantic models, OpenAPI specifications, and frontend/desktop TypeScript interfaces.
---

# API Contract Testing Skill

## Contract Sync Protocol
1. **Single Source of Truth**: Backend data models in `services/api` define the contract schemas.
2. **Schema Export**: OpenAPI 3.1 specification exported to `packages/contracts/openapi.json`.
3. **Type Generation**: Automated TypeScript schema generation in `packages/contracts/src/types.ts`.
4. **Validation**:
   - Automated contract test in CI asserts that every backend schema change reflects in frontend client types without breaking field deprecations.
   - Idempotency key headers (`Idempotency-Key`) and Tenant headers (`X-Tenant-ID`) must be validated on all mutating routes.
