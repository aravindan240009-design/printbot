# Unified Print Bot interface delivery — 2026-10-29

## IMPLEMENTED

Reviewed the existing pnpm monorepo, shared UI, customer PWA, shop/admin consoles, desktop login/setup/admin/workstation, secondary Next.js site and native packaging path. Preserved existing application logic and uncommitted work. The prior landing-only scope is extended across the existing interfaces.

- One original folded-paper identity across all sites, favicons and native PNG/ICO assets.
- Local Manrope and Playfair Display, calmer icon stroke weights, clearer headings/copy, readable controls and consistent semantic badges.
- Obsidian/champagne dark mode and ivory/bronze light mode with generated theme-specific architectural/print imagery and SVG linework.
- Shared button/card/header/theme/focus/disabled styles. Existing app tabs retain their functions.
- Motion depth entrances, restrained GSAP stagger, CSS hover/entry effects; immediate visible content with reduced motion. No continuous GPU scene was added to operational queues.
- Customer welcome, upload, configuration/review and sample confirmation polished. Preview estimate/order/payment limitations are explicit.
- Shop queue/hardware/policy and admin shops/activity/access-policy tabs polished. Unsupported TPM/connected-hardware assertions removed.
- Desktop login/setup/admin and queue/printers/pairing/preferences use the shared system; Windows app/installer icons regenerated.
- Both unsigned Windows installer formats rebuilt, with source font/library notices included. Artifacts are excluded from git.

## TESTED

Actual commands and outcomes:

| Command / check | Result |
| --- | --- |
| `python scripts/generate-brand-assets.py` | Rendered original web SVG and native PNG/ICO identity |
| `pnpm build` | Root TypeScript + Vite passed |
| `pnpm --filter @xerox/customer-web build` | Passed |
| `pnpm --filter @xerox/shop-web build` | Passed |
| `pnpm --filter @xerox/superadmin-web build` | Passed |
| `pnpm --filter @xerox/web build` | Next production compile, type validation and prerender passed |
| `pnpm --filter @xerox/ui type-check` | Passed |
| `pnpm -r --if-present type-check` | All projects defining that script passed |
| `pnpm typecheck` | Root passed |
| `./scripts/build-desktop.ps1` | Tauri frontend/native release + NSIS/MSI packaging passed; final package contains notices |
| Bundled toolchain `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --locked` | 8 native tests passed |
| `git diff --check` for changed app/UI sources | Passed; only Windows line-ending normalization warnings |
| `scripts/verify-atelier-suite.mjs` through Playwright Page | 56 assertions passed; saved in ATELIER_BROWSER_RESULTS.json |

Browser assertions cover all six surfaces: original logo; local typography; dark/light application and persistence; no horizontal overflow at 390/768/1440; reduced-motion readable content; no remote Google font requests. Additional actual browser checks exercised all shop tabs, all admin tabs, all four workstation tabs, desktop local admin and fixture-driven incomplete setup, and customer upload/configure/review with fixtures/printable/portrait-3.pdf. These are local UI checks, not live payment or printing certification.

Captured actual screenshots in this docs folder: atelier-shop-{dark,light,mobile}, atelier-admin-{dark,light,mobile}, atelier-customer-{dark,light,mobile,configure,review}, atelier-desktop-{dark,light,mobile}, atelier-workstation-{dispatch-queue,printers,device-pairing,preferences}, atelier-native-{admin,setup}, atelier-platform-{dark,light}. All filenames end in `.png`. Finite animations were completed/disabled for readable screenshots.

Failures corrected during work: shared exported logo timing during concurrent builds; ES2020 replaceAll/type inference issues; transient old Next chunk 404s after rebuilding a running preview (restart fixed); test locators corrected for accessible-name whitespace. No failing check was represented as passing.

## BLOCKED / UNVERIFIED

- Installers are **NotSigned**, and are **testing artifacts**. No clean-machine installation or physical-printer test was performed.
- Existing desktop local credentials/license preview are not server-authorized shop/device pairing. Existing native unpaired state, production subscription enforcement, hardware assurance and paid jobs remain release gates.
- Customer sample pricing/order state is local and is not server-authoritative payment/dispatch. Preview notices disclose this. No live settlement or backend integration claim.
- Existing GSAP custom license and wider OSS source/deployment audit require release clearance. Compilation and notices do not clear these gates.
- No field Core Web Vitals, guaranteed FPS, screen reader certification or real iOS/low-end Android validation. No backend tenant-isolation regression suite was rerun for this visual scope.
- No production deployment. Full phase/release completion is not claimed while those gates remain open.

## Installer handoff

- `artifacts/PrintBot-Atelier-1.0.0-x64-setup.exe` — 5,402,912 bytes, unsigned.
- `artifacts/PrintBot-Atelier-1.0.0-x64.msi` — 7,835,648 bytes, unsigned.

Exact SHA-256 values, timestamps, toolchain and verification evidence: DESKTOP_BUILD_2026-10-29.md. Root independently recomputed hashes and inspected signatures. Keep original bundle outputs intact.

## Changed files and architecture

Exact scoped file paths are recorded in ATELIER_CHANGED_FILES.json; includes source, generated brand assets, public license notices, screenshots and reports, and excludes unrelated preexisting edits. ADR: ADRs/0005-unified-atelier-suite.md. Bounded source/asset inventory: atelier-sbom.json. Existing platform SBOM and license audit remain applicable.

## Security/privacy checklist

- No production credentials, keys, customer documents or payment data added to git.
- Original shop/tenant/API/native logic preserved; UI theme storage is appearance only.
- Sample native fixture state restored after setup-screen verification. Only repository PDF fixtures used.
- Explicit unverified payment/TPM/hardware labeling; no fake success or benchmark claims introduced.
- Font/image assets local; no runtime paid service added. Motion respects reduced-motion preference.
- Focus/disabled affordances retained, 44px theme targets, semantic text and consistent stroke icons.
- Native signing, CSP hardening, live authorization, hardware and legal gates remain documented rather than silently certified.

## Local commands and URLs

Run each development process in a separate terminal:

```powershell
pnpm dev                                        # landing 5173
pnpm --filter @xerox/customer-web dev            # 5174
pnpm --filter @xerox/desktop dev                 # 5175 browser view
pnpm --filter @xerox/shop-web dev                # 5176
pnpm --filter @xerox/superadmin-web dev          # 5177
pnpm --filter @xerox/web dev                     # Next site 3000
./scripts/dev-desktop.ps1                       # native app, existing toolchain helper
./scripts/build-desktop.ps1                     # unsigned local installer build
```

Current production QA previews are running at 127.0.0.1 ports 4173 (landing), 5174 (customer), 5175 (desktop frontend), 5176 (shop), 5177 (super-admin), 3003 (Next platform). Production preview reuses the dist output; restart Next after rebuilding it. No unrelated existing port-3000 or IPv6 services were terminated.

## Copy-paste handoff

Continue the unified atelier Print Bot interfaces via ADR 0005 and shared packages/ui. All six surfaces passed 56 local browser checks; all relevant builds/typechecks passed, plus 8 native tests. Updated unsigned NSIS/MSI are in artifacts/, with hashes and release gates documented. Preserve preview disclosures, one plan/unlimited printers, reduced motion and tenant boundaries. Complete clean-machine/hardware/live authorization/signing/license review before any production release.
