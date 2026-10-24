# Print Bot: light and dark interactive redesign

Date: 23 October 2026. Status: proposed design; implementation approval pending.

## Intent and user decisions

Redesign the existing Windows software and user websites with a coherent palette, clearer layouts, richer interaction, dimensional print imagery, and polished motion. The user explicitly requires **both white/light and dark themes**, not a choice between them. Their original references are Awwwards 3D, Landing Love 3D, and Dribbble 3D website/animation collections. They also request Motion and the Motion AI installer.

The proposed design direction is Print Studio: paper, ink, and a recognizable printer/document composition. Light and dark are equal presentations of the same product. The user selected both themes; the specific palette, architecture, and motion treatments below are engineering/design proposals, not previously approved details.

## Existing state and audit limits

- Five applications: Vite customer-web, shop-web, superadmin-web and desktop, plus Next.js web. The Next.js page is also a customer ordering flow; it must not be overwritten with a marketing homepage.
- React 18, TypeScript, pnpm workspace, a shared `packages/ui`, and a Tauri Windows shell already exist. FastAPI and Rust services are separate from this presentation work.
- Customer/shop/admin styles contain literal inline colors; desktop has Tailwind plus a hardcoded dark body. Shared components depend on Tailwind utility classes, which are not uniformly configured across consumers. A body-color toggle alone cannot deliver complete theming.
- Shared motion variants exist but Motion is not installed in the inspected manifests. `SceneViewport` is a placeholder and does not substantiate its performance or WebGL claims.
- Customer-web includes inferred PDF page counts, local price calculations, and unscoped browser persistence. Shop/admin/desktop contain seeded state or local simulated actions. The Next.js flow makes API requests. An attractive UI must not imply those simulations are verified integrations.
- Existing uncommitted desktop modifications and `sites/`/landing artifacts belong to prior work and must be preserved. Inspect them before editing; do not reset or replace them wholesale.
- Discovery so far covers repository inventory, manifests, shared UI, application entry points/styles, representative handlers, and prior research. It is not a claim that every repository file or rendered screen has been reviewed. Complete the UI file/interaction inventory before implementation and record routes and remaining gaps.
- Reference pages were read as content, not verified as live animation experiences. Visual inspection of representative public references remains part of implementation preparation; do not copy third-party assets.

## Approaches

1. Separate light and dark page implementations: rejected as a proposal because duplicated controls and behavior would drift.
2. One semantic design system with two fully designed palettes: recommended. Shared structure, state and accessibility; theme-specific colors, elevation and illustrative lighting. This directly accommodates the user's both-theme requirement.
3. An immersive full-screen 3D interface: not recommended for working queues or checkout. Dimensional moments belong around tasks, while operational controls remain ordinary accessible HTML.

## Visual specification

| Role | White/light | Dark |
| --- | --- | --- |
| Canvas | `#F5F7FB` | `#111722` |
| Primary surface | `#FFFFFF` | `#1A2332` |
| Raised surface | `#EDF2FA` | `#243147` |
| Main text | `#17243B` | `#F4F7FC` |
| Secondary text | `#52627A` | `#B3C0D4` |
| Action | `#2459DA` | `#9DBBFF` |

Use white text on the light action fill and dark ink on the dark action fill. Treat these as candidates until contrast measurements validate all rendered pairings. Cyan and magenta may accent original print artwork; they do not replace readable status colors. Define separate semantic success/warning/danger/focus/border tokens and test them in both themes.

Typography uses the existing local system sans-serif stack, with Segoe UI on Windows and native fallbacks on phones. Strong headings, readable body text and tabular numeric values establish hierarchy without adding a font dependency. No external font request is needed. Body text targets 16px, secondary operational text at least 14px where practical. Tamil/Hindi content must wrap naturally.

Use generous main-page spacing, tighter queue rows, varied surface hierarchy, visible selection, and prominent primary actions. Use 12–20px rounded surfaces where grouping is useful, smaller control radii, and consistent spacing tokens. Avoid enclosing every line in a card.

## Theme behavior

- An accessible Light / Dark / System selector is visible in every application shell. Default to System when no choice is saved.
- Store only the appearance choice under a versioned browser preference key. This is not tenant/customer/order storage. Do not persist document metadata as part of theme handling.
- Explicit Light/Dark overrides system changes; System follows OS changes while the app is open. Handle unavailable storage safely and synchronize same-origin tabs. Separate origins may retain independent preferences; no cross-origin account synchronization is promised.
- Apply the resolved theme before first paint where the host permits it, using a CSP-compatible bootstrap. Handle Next.js server/client hydration explicitly. Set `color-scheme` for native controls.
- Preserve focus, open dialogs, upload selections and form values when switching. Theme switching must not remount application state or send any business mutation.
- Theme every surface, form control, dialog, dropdown, tooltip, empty/error state, preview surround, focus ring and status badge. Document preview paper stays white because it represents the printed page.
- A short color transition may soften user-triggered changes; no page-wide flash, curtain or full-screen animation. Reduced motion uses an immediate switch.

## Layout and interaction by surface

### Customer websites: both existing implementations

Keep three principal screens: upload; configure with server preview and quote; confirm/pay and track/collect. Rework headers, progress navigation, file cards, options and sticky mobile actions. Keep shop identity and language selection visible. Show basic choices first and advanced settings in accessible disclosure controls. File removal, selection and supported reordering provide immediate visual feedback. Preserve separate per-file/apply-to-all semantics.

An original dimensional paper/printer composition welcomes the user without blocking upload. It depicts an illustrative workflow, never the customer's actual document. Real document previews must remain server-derived. Illustrations must not imply verified payment or physical printing completion.

### Windows workstation

Use a stable navigation rail, clear connection/pairing status, a searchable/filterable queue, readable status groups, and a job-detail panel. Printers, pairing and settings remain first-class destinations. Animate navigation selection and details opening while keeping queue data stable. Preserve rejection reasons and supervised completion-unknown reconciliation. Clipboard, refresh and other available actions need explicit success/failure feedback.

### Shop portal

Organize queue, printers/devices and shop settings coherently; expose useful filters and row details. Keep subscription information compact. Order-mode changes remain authorized/audited operations and do not reinterpret already accepted jobs. Pairing must distinguish a real server-issued code from a simulation.

### Super-admin portal

Provide a readable shop list with functional search/filtering, scoped details, clear subscription states and audit information. Preserve reason capture and confirmation for sensitive actions. No animation or convenience feature may bypass authorization or reveal customer documents.

### Existing landing work

The inspected `sites/` inventory contains only `sites/print-bot-premium/dist/index.html`, with no maintained source project alongside it. Preserve that prior artifact; it is not a sixth application to rebuild under this design. Do not replace either customer route with a landing page. Record this non-integrated artifact separately in the UI inventory.

## Motion and dimensional content

- Use CSS for control color/focus feedback; Motion React for action-driven enters/exits, selected navigation indicators, dialogs and file-list transitions. Typical feedback is 120–180ms, navigation/dialog transitions 180–280ms, and a finite explanatory print illustration up to 1.2s. These are design targets, not measured performance claims.
- Respect `useReducedMotion` and the media query. Disable travel, tilt and looping ornament under reduced motion, while retaining complete functionality and readable feedback.
- Animate transforms and opacity; avoid animating layout dimensions. Do not hide focusable controls in exiting panels. Dialogs require focus management, Escape handling, accessible naming and return focus.
- Start with original CSS perspective/SVG paper and printer forms that adapt their lighting to both themes. This is dimensional artwork, not a claim of a WebGL renderer or document preview. Users can replay an explanatory sequence; no perpetual printer/queue animation.
- Fine-pointer tilt is optional and bounded; touch and keyboard receive explicit equivalent controls. Avoid scroll hijacking. Pause nonessential animation when hidden.
- Full mesh-based Three.js scenes are not required by this design. If CSS/SVG cannot meet the approved art direction, document a revised dependency/asset/performance proposal before adding a new renderer.

## Dependencies and licensing

Registry checks on 23 October 2026 returned Motion 14.6.0 MIT and motion-ai 14.2.0 MIT. Recheck pinned package metadata and distributed notices before installation. Use pnpm for the workspace rather than creating a second npm lockfile. Add the runtime to the package that owns the shared animated components and verify React 18 compatibility.

Inspect the pinned Motion AI CLI and its options before executing the requested setup. Prefer project-scoped installation for Codex. Preserve existing agent configuration. Its free skills/installer are MIT; hosted services and Motion+ features have separate availability/access requirements. Do not enable paid features or transmit repository/customer data as a side effect. Record exact installed files, configuration changes, licenses and SBOM updates. Official reference: https://motion.dev/docs/ai-kit-install.

## Functional integrity and boundaries

Inventory every visible interactive control and connect it to a real supported action or display an honest unavailable state. Pure UI interactions (tabs, filters, details, disclosures, theme selection) must work. Where existing backend contracts are usable, preserve them and show actual request loading/error/success states. Do not invent API contracts or successful payments/pairing/printing.

Keep simulators explicitly isolated and labeled. Remove misleading real-success wording from simulated paths. If an operational control lacks a verified backend path, disable the live operation with an actionable explanation and record that integration as blocked/unverified; this does not satisfy production-readiness criteria. Broad new authentication, payment, print-agent and schema work is outside this visual redesign and must not be silently bundled into it.

Preserve one all-inclusive plan, unlimited printers, tenant isolation, server-authoritative locked prices, verified payment policy, explicit automatic/manual modes, immutable print-plan semantics and completion-unknown safety. Backend/security findings discovered during UI inspection are recorded with precise evidence. Do not present existing unsafe behavior as acceptable because it predates the redesign.

## Verification and exit criteria

- Maintain an inventory mapping every screen/control to implementation and test status, including disabled or simulated integrations.
- Build and type-check all five frontend applications and shared UI. Add focused tests for theme initialization/persistence/system updates and preservation of form state.
- Exercise each navigation path and key workflow with browser automation in both themes; cover keyboard focus, dialog dismissal/return focus, upload/configuration state and failure feedback. Test simulated behavior only as explicitly labeled simulation.
- Capture and inspect desktop and mobile screenshots in both themes. Cover 360px, 390px, 768px and 1440px widths, 200% zoom, English/Tamil/Hindi content where available, and reduced motion. Require 44px interactive targets and no page-level horizontal overflow. Tables may use a labeled, keyboard-accessible scroll region.
- Measure contrast (WCAG AA text/control targets), accessibility and browser console errors. Record actual bundle sizes and performance measurements; no unmeasured FPS or Lighthouse promises. If Safari/real low-end hardware is unavailable, mark that verification unavailable.
- Verify theme changes never initiate order/payment/device mutations. When request code is changed, run relevant authorization, idempotency and cross-tenant negative tests; a presentation test cannot prove tenant security.
- At handoff include IMPLEMENTED, TESTED, BLOCKED/UNVERIFIED, exact changed files, accepted ADR, security/privacy checklist, exact runnable commands and results, screenshot paths, risks and next-phase handoff. Hardware, live settlement and production signing remain unverified unless separately tested.

## Decisions delegated to implementation

Component extraction boundaries, icon selection from the existing set, exact spacing within these constraints, test tooling already available in the repository, and small animation tuning are implementation decisions. No additional design approval is needed for routine choices within the approved scope. New product behavior, paid services, additional applications or materially different visual direction require an explicit scope decision.

## Discovery execution record

Read-only inspection used `git status --short`, `rg --files`, `Get-Content` for manifests/application/shared UI sources, `npm view` for package metadata, and official Motion documentation via Context7. One `rg` search using a literal Windows glob (`apps/*/src`) failed for that argument; subsequent searches must use explicit paths or `rg` glob flags. No application source or dependency has been modified in this design step. No build, browser QA or production integration test has run for this redesign.

The search was rerun successfully with explicit application source paths. Final `git status --short` confirms this specification is the only newly authored file in this step; pre-existing changes remain. The required independent builder check returned “nothing important left.” This is a specification review, not implementation or runtime validation.
