# UI redesign handoff — 23 October 2026

## IMPLEMENTED
Shared light/dark/system appearance, saved preference, native control color scheme, prepaint bootstrap, responsive semantic CSS and reduced-motion-aware Motion surfaces. Original dimensional printer/paper artwork with replay. Redesigned customer, desktop, shop and superadmin interfaces. Both existing customer entry points share the customer flow. Interactive file selection/reorder/preferences, operational navigation/filter/details and local confirmations remain available. Local simulations are labeled; unverified live checkout/pairing are unavailable.

## TESTED
- `pnpm --filter @xerox/customer-web --filter @xerox/shop-web --filter @xerox/superadmin-web --filter @xerox/desktop build`: exit 0.
- `pnpm --filter @xerox/web build`: exit 0, static route generated.
- `pnpm --filter @xerox/ui type-check`: exit 0.
- `node --test tests/ui/theme.test.mjs`: 3 passed, 0 failed; observed missing-bootstrap failure before implementation.
- Browser: customer dark selection survives reload; light selection works; 390px viewport has no horizontal overflow. Desktop at 1440px switches both themes without overflow. Screenshots in `.playwright-mcp/customer-{light,dark,mobile}.png` and `desktop-{light,dark}.png`. Screenshots captured; comprehensive visual/accessibility approval remains unverified.
- Browser console showed missing favicon requests; no runtime exception observed in these checks.

## BLOCKED / UNVERIFIED
No updated EXE/MSI produced. `tauri:build` first failed because build.rs was missing; added standard tauri_build::build(). Retry fails because src-tauri/icons/icon.ico is absent. Tauri info also reports missing MSVC/Windows SDK. Signing certificate, installer launch, real printer behavior, real payment settlement, end-to-end tenant isolation, full browser matrix, contrast audit, 200% zoom and independent final review remain unverified. Do not claim phase completion or production readiness.

The former Next.js flow used a hardcoded tenant header, approximate fallback quote and unsupported payment-verification wording. Replacing it with the shared explicit local configuration flow disables those request paths. Production shop-bound upload/quote/checkout remains required; this is a material integration gap, not a completed live client service.

## Decisions and security/privacy
ADR: one shared customer flow and semantic theme system; CSS dimensional artwork avoids another graphics dependency. No new backend schema or API. Appearance storage contains no customer documents; legacy customer metadata persistence removed. No real payments, external messages, printer dispatch or secrets used. Existing native simulated commands and unset Tauri CSP still require production hardening.

## Changed files
Application App.tsx/index.css/index.html for customer-web, shop-web, superadmin-web and desktop; customer main.tsx; web app/page.tsx and layout.tsx; public/theme.js in all five apps; desktop src-tauri/build.rs; packages/ui/src/{theme.tsx,theme-bootstrap.js,studio.css,index.ts,components/Studio.tsx}; packages/ui/package.json; pnpm-lock.yaml; tests/ui/theme.test.mjs; .agents/skills/motion/**; .codex/config.toml; design specification/implementation plan; OSS_LICENSE_AUDIT.md; UI_DEPENDENCIES.json; this report. Pre-existing desktop package/tailwind changes and prior landing artifacts preserved.

## Run and next phase
Use `pnpm --filter @xerox/customer-web dev`, `pnpm --filter @xerox/desktop dev`, `pnpm --filter @xerox/shop-web dev`, `pnpm --filter @xerox/superadmin-web dev`, or `pnpm dev:web`. Installer attempt: `. ./scripts/phase0/env.ps1; pnpm --filter @xerox/desktop tauri:build`.

Handoff: themed UI builds pass. Complete remaining interaction/accessibility review, restore verified shop-bound production integration, provide approved app icons/build prerequisites, rebuild installers and test launch on Windows. Retain completion-unknown reconciliation and never infer physical delivery from a UI timer.
`nRegal follow-up: user palette applied centrally across all apps. Playfair Display headings, burgundy clay buttons, gold cursor-relative hover, bounded pointer attraction, frosted surfaces and 600ms reveal implemented. Shared type-check passed; screenshots and complete reference fidelity remain unverified. Existing installer blockers remain.
`nRun-all follow-up: customer localhost:5175, desktop web localhost:5176, shop localhost:5177, superadmin localhost:5178, Next localhost:3000 started. Browser theme switching and 1440px overflow checks passed on four Vite apps; screenshots regal-{port}-{Light,Dark}.png. Corrected body font overrides after computed-style inspection. Generated original app icons with Pillow to clear missing-icon packaging failure. Rust compilation still running at last observation; no installer success claim. Theme tests 3/3 and shared type-check pass.
`nWindows follow-up: release compilation succeeded; xerox-workstation.exe produced and launched (process observed). NSIS setup generated; MSI packaging still pending at last observation. Unsigned and native operational behavior unverified.
`n24 October refinement: added RoomEnvironment reflections, softened material response, shadow bias/radius, modeled hinges/vents/rollers and coordinated display/paper movement. Shared type-check and four Vite builds passed. Framer setup completed; only unrelated Mobile Mars project listed and left untouched. Browser verification blocked because local server was not running; installer rebuild initiated, result pending. No new photorealism/performance claim.
`n24 October verification: browser confirmed refined WebGL canvas without fallback, rotate and monochrome actions, completed paper-feed animation and dark theme. Screenshot .playwright-mcp/refined-printer-verified.png. Original target build hit file lock; isolated .local-evidence/regal-build target compiling dependencies. No updated installer produced yet.
`nCompletion verification: Next.js production build exited 0. Shared type-check and theme tests passed. Refined WebGL model and controls verified in browser. Isolated Windows build remains active in session 83758 compiling tao/webview2; installer completion not verified. Do not use previous installer as evidence of latest model.
