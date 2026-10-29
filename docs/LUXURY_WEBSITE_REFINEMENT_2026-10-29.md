# Luxury website refinement — 2026-10-29

## IMPLEMENTED
- Obsidian / champagne / ivory palette and local Playfair Display typography.
- Detailed procedural 3D printer: molded shells, glass, lid hinges, vents, touchscreen, power ring, paper stack, rubber feet, output tray, reflective trim, studio environment reflections and limited shadows.
- Automatic slow rotation and repeated curved-sheet feed; replay and global pause/resume.
- Bespoke AI-generated print-studio editorial photograph, encoded as a 261,598-byte lazy WebP. Two original animated SVG art prints and a signature illustration.
- Staggered headline text, scrolling section/text/image reveals, image curtain and scale transitions, SVG line drawing and orbit, hover interactions.
- Mobile compositor poster, reduced-motion support, pause-safe readable content, no horizontal overflow at tested widths.

## TESTED
- `pnpm build`: TypeScript + Vite succeeded, exit 0.
- `pnpm typecheck`: succeeded, exit 0.
- Production preview `http://localhost:4173` exercised using the Playwright browser tool.
- Reusable browser checks: `scripts/verify-luxury-browser.mjs`, exported `verifyLuxuryLanding(page, baseURL)`. Execute with an existing Playwright Page; the browser tool evaluated this file's source, since its VM does not support dynamic module imports. No Playwright runtime dependency is added to the website.
- 24 assertions passed: automatic feed and rotation advance; pause/focus/heading visibility; image decode and SVG presence; existing journey/keyboard/mode/billing behavior; offscreen feed; responsive overflow at 320/390/768/1024/1440px; mobile navigation and poster; reduced-motion text, SVG and 3D fallback.
- Initial tablet transient overflow traced to renderer-set inline canvas dimensions. Fixed with `setSize(width, height, false)` and responsive canvas CSS.
- Pause initially held finite reveal animations before content became readable. Fixed by making paused finite content fully visible while stopping decorative motion.
- Image initially missing from preview before rebuilding static assets. Rebuilt and verified 1536px natural image width and successful decode.
- Final build: initial JavaScript 172.45 KB / 54.81 KB gzip; deferred 3D JavaScript 484.56 KB / 123.94 KB gzip; CSS 30.78 KB / 7.47 KB gzip.
- Actual browser captures: `luxury-hero.png`, `luxury-desktop.png`, `luxury-mobile.png`, `luxury-editorial.png` in this docs folder. Finite CSS animations were fast-forwarded for readable screenshots. Screenshots do not certify FPS.

## BLOCKED / UNVERIFIED
- No real-device FPS, field Core Web Vitals, Safari/iPhone, low-end Android or screen reader certification. Local browser validation is not a 60 FPS guarantee.
- Public signup, release signing and real-printer hardware validation remain the existing release gates.
- No backend changes, payment tests, tenant-suite rerun or production deployment in this visual-only scope.

## Exact files changed in this refinement
- `src/App.tsx`
- `src/index.css`
- `src/components/PrecisionPrinter.tsx`
- `src/components/LuxuryEditorial.tsx` (new)
- `index.html` (theme color)
- `public/assets/print-studio-editorial.webp` (new)
- `public/fonts/PlayfairDisplay.ttf`, `public/fonts/Playfair-OFL.txt` (existing font copied with license)
- `scripts/verify-luxury-browser.mjs` (new)
- `docs/ADRs/0004-champagne-atelier-motion.md` (new)
- `docs/LUXURY_WEBSITE_REFINEMENT_2026-10-29.md` (this report)
- `docs/OSS_LICENSE_AUDIT.md` (append only)
- `docs/landing-sbom.json` (add font inventory)
- `docs/luxury-hero.png`, `docs/luxury-desktop.png`, `docs/luxury-mobile.png`, `docs/luxury-editorial.png` (new)

## Security/privacy and licensing
No contact collection, browser storage, customer uploads, credentials, tenant API mutations or external analytics added. No network textures or fonts. Existing MIT Three.js notices retained. Reused Playfair Display has an existing SIL OFL-1.1 notice copied alongside its unmodified font. Original SVG/canvas artwork and generated editorial image are project assets. Generated media is static: development and runtime do not require an image-generation API. One all-inclusive plan, unlimited compatible printers and honest availability dialogs remain.

## Run
```powershell
pnpm dev
pnpm build
pnpm typecheck
pnpm preview
```

## Handoff
Continue the champagne atelier root landing. Follow ADR 0004. Keep auto motion pausable, stop offscreen GPU work, preserve mobile/reduced-motion fallbacks and readable paused content. Maintain one plan and explicit pilot availability. Connect only approved live signup/installer flows. Measure actual hardware performance and accessibility before launch.


