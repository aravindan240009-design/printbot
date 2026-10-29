# ADR 0003 — Precision studio marketing experience

Date: 2026-10-29

## Context
The repository is an existing pnpm monorepo with a root React 18 / TypeScript / Vite landing site, separate customer/shop/admin/desktop applications, FastAPI services and a Rust print agent. The working tree already contained changes across those surfaces. The requested work is one cohesive futuristic website, preserving Print Bot's product contract.

## Decision
Rebuild only the root marketing composition with graphite, lime and locally hosted Manrope. Use a procedural Three.js 0.170.0 printer, physically based metallic materials, directional lighting, and canvas-generated print artwork. No purchased model, remote texture, commercial SDK or external font request is required.

Use direct Three.js in a lazy React component. R3F, GSAP and Motion are not added to the root: this scene and these short transitions do not justify overlapping render/animation engines. CSS handles reveals and hover; requestAnimationFrame only runs during scene changes. Cap pixel density at 1.5, stop work offscreen and in background tabs, dispose all GPU resources. Mobile, reduced-motion and Save-Data use an HTML/CSS poster. No scroll hijacking or continuous particle loop.

The journey, mode selector and queue are clearly illustrations. The mode selector cannot mutate a real shop. Preserve one all-inclusive plan, two billing intervals and unlimited compatible printers. Do not invent subscription prices. Replace the old localStorage-only pilot submission with honest availability information; no contact data is collected by this page.

## Consequences
The main bundle avoids the 3D renderer's cost on mobile. A returning mobile visitor may already have downloaded the desktop chunk; viewport changes do not undo prior network transfers. The poster is stylized; photorealistic hardware reproduction and real printer performance are not claimed. Signup and installer production readiness remain external integration gates. Existing app source files remain present, including earlier landing components no longer mounted by the root composition.
