# Print Bot website implementation — 2026-10-29

## IMPLEMENTED
Root marketing website: responsive graphite/lime composition, local typography, procedural interactive PBR printer, output-sheet interaction, progressive scan/configure/track walkthrough, order-mode illustration, one plan with monthly/annual billing, expandable FAQs, accessible availability dialog, mobile navigation and reduced-motion fallback.

Repository review: inventoried tracked/nonignored files and inspected the root entry points, prior landing components, manifests, shared 3D dependencies, installer config, product limitations and existing license register. This is not a claim that every backend source line or binary document was read. No supplied master DOCX or Claude PDF appeared in the file inventory. Existing uncommitted work outside this landing scope was preserved.

## TESTED
Commands actually run:
- `pnpm add -w three@0.170.0`: succeeded; reuse pinned shared workspace version.
- `pnpm add -Dw @types/three@0.170.0`: succeeded.
- `pnpm install --offline`: succeeded.
- `pnpm build`: succeeded (TypeScript + Vite).
- `pnpm typecheck`: succeeded, exit 0.
- `pnpm preview --host 127.0.0.1`: served production build on port 4173.
- Playwright browser automation against port 4173: 19 assertions passed. Desktop WebGL, output interaction, journey click and arrow-key selection, manual-mode preview, annual billing, dialog focus trap/restoration, FAQ, no horizontal overflow at 320/390/768/1024/1440px, mobile poster, mobile menu open/close, reduced-motion poster, no Google Font request.
- Production browser console: zero errors or warnings.
- Desktop and mobile full-page screenshots captured and inspected. Initial overflow from transformed orbit/poster and 320px navigation was reproduced and fixed.

Final build sizes: initial JS 166.88 KB / 53.15 KB gzip; lazy 3D JS 470.63 KB / 119.42 KB gzip; CSS 19.06 KB / 5.02 KB gzip. Local font 164,700 bytes. These are build sizes, not field performance measurements.

## BLOCKED / UNVERIFIED
- Core Web Vitals, real device FPS, screen reader audit, Safari/iPhone and inexpensive Android hardware testing have not been measured. No Lighthouse score or 60 FPS guarantee is claimed.
- Public signup/contact endpoint is not connected. Availability dialogs disclose this and collect no information.
- Public installer requires a configured HTTPS `.exe` URL; production signing, subscription/device authorization and real printer certification remain release gates.
- No backend/payment/printer integration or tenant isolation regression suite was run for this frontend-only scope.
- No production deployment performed. Existing repository-wide license/release blockers remain.

## Changed files in this work
- `src/App.tsx`
- `src/index.css`
- `src/components/PrecisionPrinter.tsx` (new)
- `index.html`
- `package.json`
- `pnpm-lock.yaml`
- `public/fonts/Manrope.ttf` and `public/fonts/OFL.txt` (copied existing licensed font)
- `public/licenses/three-MIT.txt`, `public/licenses/types-three-MIT.txt`
- `docs/ADRs/0003-precision-studio-landing.md`
- `docs/WEBSITE_IMPLEMENTATION_2026-10-29.md`
- `docs/landing-sbom.json`
- `docs/OSS_LICENSE_AUDIT.md` (append only)
- `docs/printbot-desktop.png`, `docs/printbot-mobile.png`

## Security and privacy checklist
- No customer files, API credentials, contact data or production secrets added.
- No localStorage pilot submissions or fake success states in the mounted page.
- No external font/texture/model connections required by the composition.
- Device/shop identifiers are not used as secrets; no authentication or tenant API behavior changed.
- Dialog supports focus entry, containment, Escape and focus restoration.
- Reduced motion avoids WebGL and CSS animations; native page scrolling retained.
- Installer URL still passes the existing HTTPS / `.exe` validation; no forced download when unavailable.
- Deployment CSP and server headers are not validated by this local preview.

## Run locally
```powershell
pnpm install --offline
pnpm dev
# production verification
pnpm build
pnpm typecheck
pnpm preview
```

Open http://localhost:5173 (development) or http://localhost:4173 (production preview).

## Handoff
Continue from the root React/Vite precision-studio landing. Keep the existing customer/shop/admin/desktop apps intact. The website build, typecheck and 19 production-browser assertions passed. Connect an approved pilot/contact flow before advertising signup. Validate real device performance, accessibility, release signing and printer hardware before production launch. Follow ADR 0003; keep one plan and unlimited compatible printers. Screenshots are actual browser captures, not mockups.

