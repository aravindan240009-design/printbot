# Customer Web Print-Counter Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the customer print-order workspace into a print-counter editorial interface while preserving all existing customer interactions and simulation boundaries.

**Architecture:** Keep the existing React component tree and behavior; replace the customer-specific visual layer with a focused token system and responsive app-screen layout. Override shared studio defaults only where they introduce gradients, shadows, or decorative chrome that conflicts with the framed-sheet direction.

**Tech Stack:** React 18, TypeScript, Vite, CSS custom properties, existing `@xerox/ui` components and icons.

**Spec:** `docs/superpowers/specs/2026-10-25-customer-web-print-counter-design.md`

## Global Constraints

- Preserve existing upload, reorder, remove, configuration, language, validation, and simulation behavior.
- Keep 44px touch targets, visible focus, reduced-motion support, and readable Tamil/Hindi shaping.
- Do not add backend behavior or imply that simulated upload, quote, payment, or printing is live.
- No gradients, glows, glass, repeated tinted icon containers, or heavy resting-card shadows.
- Keep the customer workflow to upload, configure, and review/payment screens.

## Review Focus

- Empty upload state: the primary upload action must be obvious without fake data.
- Multi-file state: file identity, reorder/remove actions, and count must remain readable at 390px.
- Invalid page range: the error must remain visible and the next action disabled.
- Tamil/Hindi labels: controls must wrap without clipping or destructive word breaking.
- Sticky action bar: it must not obscure content or create horizontal overflow on phone widths.

---

### Task 1: Customer visual system and responsive shell

**Files:**
- Modify: `apps/customer-web/src/index.css`
- Test: `pnpm --filter @xerox/customer-web build`

**Interfaces:**
- Consumes: existing class names emitted by `apps/customer-web/src/App.tsx` and shared `StudioHeader`/`PrinterScene` markup.
- Produces: framed-sheet tokens, responsive layout, accessible controls, and styling for empty, populated, invalid, and review states.

- [ ] Write the new customer-specific token and layout styles, retaining every existing class selector used by `App.tsx`.
- [ ] Neutralize conflicting shared studio effects for this screen: gradients, backdrop blur, saturated icon treatments, and resting shadows.
- [ ] Add desktop, tablet, phone, reduced-motion, and Tamil/Hindi typography rules.
- [ ] Run the customer-web build and inspect the generated CSS for compilation errors.

### Task 2: Regression and visual verification

**Files:**
- Modify: `.taste-skill/customer-web/direction.json` only if the skill tooling refreshes it
- Test: customer-web build, root TypeScript check, and browser inspector if available

**Interfaces:**
- Consumes: Task 1 visual system.
- Produces: evidence that the redesign compiles and remains usable across target widths.

- [ ] Run `pnpm --filter @xerox/customer-web build`.
- [ ] Run root `npm.cmd run typecheck`.
- [ ] Run the design-taste lint/inspect commands against the customer-web app when the local browser tooling supports its Vite server.
- [ ] Record any unavailable hardware/backend behavior as unchanged simulation scope, not as a regression.
