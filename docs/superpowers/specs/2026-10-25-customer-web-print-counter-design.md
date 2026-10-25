# Customer Web Print-Counter Editorial Design

## Intent

Redesign the existing customer print-order screen so a walk-in customer can understand the three-step workflow quickly on a phone while preserving all current behavior: local file selection, ordering, per-file options, apply-to-all, page-range validation, language selection, accessible controls, and explicit simulation notices.

## Product idea

On this page, the paper proof becomes the interface: the active step is a proof sheet, file rows read like a job ticket, and the quote area behaves like a receipt. This belongs to Print Bot because it uses the physical language of an Indian print counter rather than a generic SaaS dashboard.

## Direction

Use a print-counter editorial system: warm paper ground, ink typography, cobalt registration accent, restrained rules, receipt metadata, and a compact step rail. Keep the interface operational and welcoming; avoid gradients, decorative dashboard cards, saturated icon containers, and disconnected marketing sections.

## Scope

- Modify only the customer-web visual shell and styling.
- Preserve existing upload, reorder, remove, configuration, language, validation, and simulation behavior.
- Improve hierarchy for the three principal screens and the mobile fold.
- Keep 44px touch targets, visible focus, reduced-motion support, and readable Tamil/Hindi shaping.
- Do not add backend behavior or imply that simulated upload, quote, payment, or printing is live.

## Layout decisions

- Desktop: narrow shop context column plus a dominant working sheet.
- Tablet: two-column layout with reduced context and no artificial sticky dead space.
- Phone: single-column flow, compact header, persistent step/status context, and action bar that remains easy to reach.
- Use the existing Print Bot UI font assets and scene component only as a supporting visual; the document workflow remains the visual priority.

## Content hierarchy

1. Shop identity, language, and simulation boundary.
2. Current step and progress.
3. Primary task: upload, configure, or review.
4. File/job metadata and options.
5. Clear next/back action.

## Verification

- `pnpm --filter @xerox/customer-web build`
- Root TypeScript check.
- Skill inspector at desktop, tablet, and 390px phone widths when browser tooling is available.
- Confirm no interaction or accessibility regressions in the existing customer flow.
