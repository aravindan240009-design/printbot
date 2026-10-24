# Landing discovery and design-selection handoff

Date: 2026-10-23. Status: design directions prepared; selection and design-document approval pending. This is not a completed implementation phase.

## Existing state

- `apps/web/app/page.tsx` is the customer printing flow, not a marketing homepage. Preserve it.
- Other apps: customer-web, shop-web, superadmin-web, desktop. Existing pnpm monorepo and FastAPI/Rust services remain intact.
- Locked versions found: React 18.3.1, Next 14.2.35, Vite 5.4.21, TypeScript 5.9.3, Tailwind 3.4.19. Motion, Three.js and R3F are not installed. No dependency was added.
- Shop and desktop interfaces contain seeded demonstration state. Desktop simulates completion after two seconds. They must not be presented as verified operational integrations.
- `GET /api/v1/subscriptions/plan` contains seeded monthly/annual prices. Commercial approval is unverified; do not publish these prices.
- Fleet release checks seed a purported signed release, placeholder URL and empty-file checksum. No approved installer artifact found. Never reuse these as verified release metadata.
- Login returns a bearer token; no real shop login page found in the reviewed sources. Tenant-header acceptance and wildcard credentialed CORS require security review before marketing security assurances.

## Proposed directions, not yet selected

Paper Precision (recommended): off-white editorial composition, ink typography, cobalt actions, dimensional paper/phone/printer hero and supporting workflow controls. Explains the physical product immediately.

Midnight Workshop: centered typography and prominent dark Windows workspace; paper scene moves below the product. Stronger software-first emphasis, with more care needed for dark-surface contrast.

Both previews are explicitly concepts with synthetic data. Native CSS perspective and a finite user-triggered paper animation communicate the intended dimensional direction; neither is a production WebGL asset. A full lazy-loaded Three/R3F scene, license checks and Context7 API verification belong after approval.

## Implemented for this design review

- Two inline concept variants, release-unavailable information, automatic/manual comparison, finite paper animation, reduced-motion handling and optional accent adjustment.
- Research notes in `docs/landing-research.md`.
- No production app source, dependencies, schemas, tenant data or release configuration changed.

## Checks performed

- Visualize renderer successfully produced a local browser wrapper. Initial overwrite attempt was refused; rerun with `--force` replaces only the task-owned preview wrapper.
- Playwright: manual mode changes status to Awaiting staff approval; release button reveals unavailable information.
- Paper Precision: no document horizontal overflow at outer viewport widths 320, 390, 768 and 1024 (inner widths 274, 343, 722 and 978).
- User-triggered animation count 1; with reduced motion, 0. Midnight manual mode and 390px outer viewport overflow check passed.
- Desktop screenshot inspected; phone text shortened afterward to resolve overflow. Screenshot captures are design-review evidence, not production QA.
- Screenshots: `.playwright-mcp/landing-direction-desktop.png`, `.playwright-mcp/landing-direction-mobile.png`.
- No production build, Lighthouse, full accessibility audit, Safari/Firefox matrix or real printer test performed.

## Blocked / unverified

Design selection and subsequent written-design approval; Figma connection and editable source; approved installer, signing and release manifest; approved commercial pricing; real onboarding and shop authentication. No production readiness claim.

## Decisions and privacy

Proposed decision: create an isolated marketing app after approval, preserving customer routes. Do not record an accepted architecture ADR until the design is approved. Show no installer download until approved artifact verification. No real files, payments, user data, secrets or external form submissions used. No new third-party runtime dependency added to the project.

## Next-step handoff

User selects Paper Precision or Midnight Workshop. Write the full design doc using that choice, obtain the required approval, then invoke writing-plans. Build the complete marketing/download experience in the existing monorepo, with verified integrations or honest unavailable states. Continue license, security, responsiveness, accessibility and performance verification without treating this concept review as a shipping product.
