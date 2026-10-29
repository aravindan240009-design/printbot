---
name: developer-tool-router
description: Intelligent capability router that dynamically selects the smallest appropriate verified skill, repository, or toolset for any software engineering task.
---

# Developer Tool & Skill Router

## Core Mandate
Select the **smallest appropriate verified capability set** for the current user task.
Follow the progressive disclosure model: know what tools and skills exist, but load and invoke them only when strictly relevant.

## Routing Logic Matrix
1. **"Design a SaaS dashboard / form / settings screen"**
   - **Load:** `ui-ux-pro-max`, `frontend-design`, `shadcn`.
   - **Do NOT load:** Three.js, WebGL, or heavy 3D canvases.
   - **Enforce:** Semantic HTML, accessible 44px touch targets, responsive breakpoints, clean contrast tokens.

2. **"Create a cinematic 3D landing page / product visualizer"**
   - **Load:** `ui-ux-pro-max`, `threejs-r3f`, `gsap-scrolltrigger`, `motion`.
   - **Enforce:** Reduced-motion checks, GLTF model compression, canvas disposal on unmount.

3. **"Animate a product explainer / marketing video"**
   - **Load:** `remotion-render`.
   - **Do NOT load:** Live Three.js web scenes when a rendered MP4 video is required.

4. **"Build / optimize asynchronous backend APIs"**
   - **Load:** `fastapi-backend-engineering`, `backend-architecture`, `secure-multitenancy`.
   - **Enforce:** Pydantic v2 schemas, RFC 7807 problem details, dependency injection, async I/O.

5. **"Design relational schema or optimize slow queries"**
   - **Load:** `database-design`, `postgresql-performance`.
   - **Enforce:** Composite foreign keys, RLS policies, indexing strategies, `EXPLAIN (ANALYZE, BUFFERS)`.

6. **"Automated mobile testing or Android exploration"**
   - **Load:** `artemis-mobile-testing`.
   - **Gate:** Device manipulation commands remain permission-gated under Tier E.

7. **"Analyze proprietary binary or format behavior"**
   - **Load:** `rea-reverse-engineering`.
   - **Gate:** Authorized user analysis targets only; do not infer authorization for external services.

8. **"Cross-platform developer research"**
   - **Load:** `agent-reach-research`.
   - **Gate:** Install strictly from verified GitHub source commit (reject PyPI `agent-reach`).

9. **"Customer notification / WhatsApp messaging"**
   - **Load:** Official Meta WhatsApp Cloud API recommendations first.
   - **Caution:** Unofficial WhatsApp Web bridges carry account ban warnings.
