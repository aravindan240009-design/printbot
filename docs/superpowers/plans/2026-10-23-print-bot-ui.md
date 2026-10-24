# Print Bot UI Implementation Plan

> **For agentic workers:** Execute task-by-task using executing-plans; independent application edits may use dispatching-parallel-agents with nonoverlapping file ownership. Steps use checkbox syntax for tracking.

**Goal:** Deliver the approved light/dark interactive redesign across existing customer websites and Windows/management frontends, with verified builds and an attempted Windows package.

**Architecture:** Shared semantic CSS tokens, ThemeProvider, ThemeSwitch, MotionSurface and PaperScene in packages/ui. Applications retain existing business contracts; simulations are explicit and never masquerade as payment or hardware success.

**Tech Stack:** Existing React/TypeScript/pnpm, Motion React, CSS/SVG, Vite/Next.js, Tauri.

**Spec:** docs/superpowers/specs/2026-10-23-print-bot-ui-design.md (user authorized implementation in latest message).

## Global Constraints
- Work in current repository; preserve pre-existing changes. No unrelated backend rewrite.
- Both themes, Light/Dark/System preference, reduced motion, 44px controls.
- No paid Motion+ setup; pinned license review before dependencies.
- One plan, unlimited printers; no fake real-world integrations or completion claims.

## Review Focus
- Storage denial or corrupt theme preference: app must still load.
- System changes and reload: explicit choice wins and form state survives switching.
- Narrow screen and Tamil/Hindi labels: no clipped primary controls.
- API failure/simulation: no false paid, paired, synced or physically printed status.
- Reduced motion/keyboard: same actions remain reachable without travel animation.

### Task 1: Shared theme and motion foundation
Files: packages/ui/src/theme.tsx, theme-bootstrap.js, studio.css, components/Studio.tsx, src/index.ts, package.json, pnpm-lock.yaml; tests/ui/theme.test.mjs.
Interfaces: ThemeProvider({children}), ThemeSwitch(), MotionSurface({children,className,transitionKey?}), PaperScene({compact?}), StudioHeader({title,subtitle?,children?}). CSS tokens --pb-bg/surface/raised/text/muted/border/accent/on-accent.
- [ ] Write/run failing theme preference bootstrap tests using Node test runner.
- [ ] Verify/install pinned Motion and inspect/install project-local free Motion AI kit.
- [ ] Implement foundation; rerun tests and shared type-check.

### Task 2: Customer experiences
Files: apps/customer-web/src/*, apps/customer-web/index.html, apps/web/app/* and build CSS configuration.
- [ ] Inspect all customer controls; preserve configuration, languages and steps.
- [ ] Build a purposeful upload/configure/track UI using shared tokens and dimensional art.
- [ ] Integrate themes and transitions; label simulator and disable unverified live checkout.
- [ ] Build/type-check both apps; browser test upload, settings, theme persistence and reduced motion.

### Task 3: Operational frontends
Files: apps/desktop/src/* and index.html; apps/shop-web/src/*; apps/superadmin-web/src/*.
- [ ] Apply shared shell/tokens and real interactive navigation/filter/details in both themes.
- [ ] Preserve existing desktop edits; correct misleading simulation and error wording.
- [ ] Build/type-check all three; verify filter, dialogs, theme switch and mobile overflow.

### Task 4: Windows packaging and final verification
Files: desktop build/config only where required; docs/UI_REDESIGN_REPORT.md, docs/OSS_LICENSE_AUDIT.md or existing audit path, docs/sbom UI addition.
- [ ] Attempt existing Tauri build with local toolchain; fix bounded packaging defects and document external blockers.
- [ ] Browser visual QA screenshots in both themes, relevant automated assertions and fresh independent code review.
- [ ] Resolve important findings; record exact command results, changed paths, risk gates and artifact paths.

## Execution rulings / ledger
- User's “now enhance” explicitly authorizes implementation; no further plan approval loop.
- Preserve current checkout and uncommitted work per AGENTS.md; no automatic commits of mixed user changes.
- Independent app edits can run concurrently per dispatching-parallel-agents skill, with one owner for shared UI/dependencies/lockfile.
- Context7 became unavailable; use official Motion docs as fallback.
