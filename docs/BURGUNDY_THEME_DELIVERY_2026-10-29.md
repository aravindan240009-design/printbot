# Burgundy print-studio refinement — 2026-10-29

## IMPLEMENTED

Changed the shared palette across the customer, shop, super-admin, desktop and secondary Next site, plus the root marketing website. Light mode uses cream, burgundy and bronze/gold. Dark mode uses wine, warm cream and champagne gold. Matching brand SVGs, favicons and native icons regenerated.

Removed the faint architecture/paper-sculpture atmosphere. Two new product-relevant print-studio concept images show a professional printer producing a sample print, paper stock and burgundy stationery. Page headers display these at full opacity with text-side masks. Tables/forms remain opaque. Mobile header text is separated from the photo strip. Customer welcome and workstation login use the same theme images. Next hero uses a product photograph rather than placeholder hardware telemetry. Root editorial imagery now depicts printing.

Assets: dark WebP 56,290 bytes; light WebP 58,156 bytes. No new dependency or runtime paid service. Prior Atelier installers preserved.

## TESTED

Actual results:
- Root `pnpm build`: passed (TypeScript/Vite).
- `pnpm --filter @xerox/customer-web build`: passed.
- `pnpm --filter @xerox/shop-web build`: passed.
- `pnpm --filter @xerox/superadmin-web build`: passed.
- `pnpm --filter @xerox/web build`: passed, including type validation and static prerender.
- `pnpm --filter @xerox/ui type-check`, `pnpm -r --if-present type-check`, `pnpm typecheck`: passed.
- `scripts/verify-atelier-suite.mjs` evaluated through Playwright: **56 passed / 0 failed**, recorded in BURGUNDY_BROWSER_RESULTS.json. Existing local desktop admin session initially caused a fixture mismatch; the test now explicitly starts from its intended local login fixture.
- Additional browser checks verified all eight customer/shop/admin/desktop light/dark product images load with natural width greater than 1000px, correct theme background values, and header opacity 1. Mobile overflow checked; screenshots captured.
- New Next hero photo resolved to its built local media URL.
- Small light-mode gold text contrast issue reproduced mathematically and corrected to bronze. Brand text against the burgundy rail checked and corrected.
- Desktop bundled native tests: **8 passed**. `scripts/build-desktop.ps1`: Vite/native optimized build and both NSIS/MSI packaging passed. Final build includes bronze correction and both WebPs. Native build report records exact commands and outcomes.
- No fabricated performance, payment, hardware or psychological-effect metrics.

## BLOCKED / UNVERIFIED

Both Burgundy installers are unsigned test artifacts. Clean-machine installation, real physical printing, live device pairing/subscription authorization, production payment integration, final license clearance, real-device FPS/Core Web Vitals and complete accessibility certification remain unverified. No backend or tenant-isolation suite was rerun for this styling scope. No production deployment or full release completion is claimed.

## Changed files

Exact scoped paths: BURGUNDY_CHANGED_FILES.json. Main source changes:
- packages/ui/src/studio.css, tokens.ts, components/PrintBotLogo.tsx
- packages/ui/src/assets/print-room-light.webp and print-room-dark.webp
- src/index.css, src/components/LuxuryEditorial.tsx; matching public/assets copies
- apps/web/app/page.tsx and globals.css
- scripts/generate-brand-assets.py, verify-atelier-suite.mjs, verify-luxury-browser.mjs
- regenerated public SVG favicons and desktop PNG/ICO icons
- new Burgundy installer artifacts, screenshots, ADR and reports

ADR: ADRs/0006-burgundy-print-studio.md. Bounded asset/hash inventory: burgundy-assets-sbom.json. Existing platform OSS audit and SBOM gates remain applicable.

## Security/privacy checklist

- No auth/payment/native print policy changes; no customer documents, secrets or live settlement used.
- Generated imagery is concept media, not a claim about customer hardware.
- No remote fonts, stock downloads or new runtime image API added.
- Existing reduced-motion behavior, theme persistence, focus/disabled controls and preview notices retained.
- Readable solid work surfaces; no image beneath critical form/queue text.
- Installer signing, hardware assurance and legal release gates remain explicit.

## Run and review

```powershell
pnpm dev
pnpm --filter @xerox/customer-web dev
pnpm --filter @xerox/desktop dev
pnpm --filter @xerox/shop-web dev
pnpm --filter @xerox/superadmin-web dev
pnpm --filter @xerox/web dev
./scripts/build-desktop.ps1
```

Current production previews: root 4173, customer 5174, desktop frontend 5175, shop 5176, admin 5177, Next 3003. Use `?theme=light` or `?theme=dark` for explicit initial appearance. Screenshots `burgundy-*.png` show actual browser renders; finite animations were completed for captures.

## Installer handoff

artifacts/PrintBot-Burgundy-1.0.0-x64-setup.exe and artifacts/PrintBot-Burgundy-1.0.0-x64.msi. Exact final sizes, hashes, signatures and build evidence: DESKTOP_BURGUNDY_BUILD_2026-10-29.md. Old Atelier artifacts remain intact.

## Copy-paste handoff

Continue from ADR 0006. Burgundy/cream/gold now spans all existing surfaces with visible, relevant printer imagery in headers and solid controls. 56 cross-app browser checks, all relevant builds/typechecks and 8 native tests passed. Burgundy installers are rebuilt unsigned tests. Preserve mobile image/text separation and bronze contrast correction; complete live authorization/payment, hardware, signing and license release gates before production.
