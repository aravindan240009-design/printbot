---
name: fastapi-backend-engineering
description: Guidelines for high-performance Python FastAPI applications, async I/O, Pydantic v2 validation, dependency injection, and RFC 7807 problem details.
---

# FastAPI Backend Engineering Skill

## Best Practices
1. **Async by Default**: Use non-blocking `async def` for I/O-bound operations (database queries, network requests, object store uploads).
2. **Lifespan Management**: Initialize database connection pools and Redis clients in FastAPI `lifespan` context handlers.
3. **Dependency Injection**: Inject database sessions, tenant validators, and authenticated user contexts via `fastapi.Depends`.
4. **Structured Error Handling**:
   - Return RFC 7807 Problem Details (`{ type, title, status, detail, instance }`).
   - Catch domain exceptions in global exception handlers.
5. **Worker Offloading**:
   - Heavy compute tasks (PDF rendering, rasterization, page counting) MUST be offloaded to background workers.
   - Never block an HTTP request thread on physical hardware or slow file transformations.
