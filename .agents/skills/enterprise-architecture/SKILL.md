---
name: enterprise-architecture
description: Directives for clean modular monoliths, distributed system scaling, clear domain boundaries, and event-driven architectures.
---

# Enterprise Architecture Skill

## Principles
1. **Modular Monolith First**: Avoid premature microservices. Enforce clear package boundaries (`apps/`, `services/`, `packages/`, `infra/`).
2. **Contract-First Communication**: Standardize all API schemas via Pydantic v2 and OpenAPI before frontend consumption.
3. **Hexagonal / Clean Architecture**:
   - Primary adapters: HTTP Routers, WebSocket Handlers.
   - Core domain: Business logic, Pricing rules, Job state machines.
   - Secondary adapters: Database repositories, Redis caches, Cloudflare R2 object stores.
4. **Resilience & Fault Tolerance**:
   - Exponential backoff with jitter on network retries.
   - Circuit breakers for third-party payment gateways.
   - Idempotency on all mutating write operations.
