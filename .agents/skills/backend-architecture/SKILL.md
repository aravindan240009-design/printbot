---
name: backend-architecture
description: Directives for clean, asynchronous Python FastAPI services, strict multi-tenant isolation, dependency injection, and Pydantic v2 schemas.
---

# Backend Architecture Skill

## Architectural Pattern
- **Application Structure**:
  - `routers/`: Clean HTTP endpoints delegating to service layers.
  - `services/`: Pure business logic, pricing formulas, job lifecycle state machines.
  - `db/`: Data persistence, repositories with mandatory `tenant_id` filters.
  - `core/`: Application settings, security, cryptographic hashing, and idempotency cache.
  - `middleware/`: Tenant resolution, request tracing, security headers.

## Rules
1. Never execute raw SQL without parameterized queries or ORM models.
2. Every database query and cache lookup MUST include the resolved `tenant_id`.
3. Background tasks (file uploads, page counting, rendering) must use Redis task queues or background workers, never blocking the request thread.
4. All errors return structured RFC 7807 responses.
