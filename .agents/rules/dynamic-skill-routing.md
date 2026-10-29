# Dynamic Contextual Skill Routing & Activation

This directive governs how AI agents (Antigravity, Claude Code, Cursor, Codex, Gemini CLI) autonomously discover, select, and activate specialized engineering skills without requiring manual invocation.

## 1. Core Operating Principles

1. **Task & Stack First**: Never load all skills indiscriminately. Analyze the user request, inspect the active workspace files, detect the framework/runtime, and choose the **smallest sufficient set** of skills.
2. **Progressive Disclosure**: Read skill metadata (`SKILL.md` frontmatter) first. Only load deep reference files or execution scripts when the current step directly requires them.
3. **Strict Conflict Resolution**:
   - If a generic skill conflicts with the project contract (`AGENTS.md`), **the project contract strictly wins**.
   - For multi-tenancy: Never trust client headers like `X-Tenant-ID`; resolve tenant context from verified sessions.
   - For Windows printing: Spooler job departure does NOT prove physical paper delivery; handle ambiguous states with `COMPLETION_UNKNOWN` and supervised reconciliation.
   - For infrastructure: Prefer OSS-first local components over cloud-hosted commercial defaults.

---

## 2. Dynamic Activation Matrix

When a user request matches a domain, automatically evaluate and load the corresponding verified skills:

| User Task / Scenario | Primary Active Skills | Auxiliary / Validation Skills |
| :--- | :--- | :--- |
| **SaaS Dashboard / UI Design** | `ui-ux-pro-max`<br>`shadcn`<br>`frontend-design` | `web-design-guidelines`<br>`design-taste-frontend`<br>`a11y-debugging` |
| **React / Next.js Development** | `vercel-react-best-practices`<br>`vercel-composition-patterns` | `react-view-transitions`<br>`performance-audit` |
| **Mobile App (React Native / Expo)** | `vercel-react-native-skills`<br>`ui-ux-pro-max` | `artemis` (Device test)<br>`a11y-debugging` |
| **Native Windows Workstation** | `windows-printing`<br>`windows-desktop-native` | `printer-proof`<br>`verification-before-completion` |
| **Animations & Transitions** | `motion`<br>`gsap-react`<br>`react-view-transitions` | `motion-design-engineering`<br>`gsap-performance` |
| **Backend API & Multi-Tenancy** | `secure-multitenancy`<br>`fastapi-backend-engineering`<br>`backend-architecture` | `database-design`<br>`postgresql-performance`<br>`api-contract-testing` |
| **Database & Migrations** | `database-design`<br>`postgresql-performance`<br>`supabase-postgres-best-practices` | `secure-multitenancy` |
| **Testing & Verification** | `test-driven-development`<br>`verification-before-completion` | `systematic-debugging`<br>`chrome-devtools` |
| **Security & Release** | `security-review`<br>`devsecops-release-engineering`<br>`production-readiness-review` | `devops-ci-cd` |

---

## 3. Negative Constraints (When NOT to Activate)

- **Do NOT load 3D/WebGL skills** (Three.js) for 2D document processing and printing workflows.
- **Do NOT load mobile skills** when editing desktop Rust/Win32 or backend Python services.
- **Do NOT load backend/DB skills** when working exclusively on client-side CSS or UI component styling.
- **Do NOT load external cloud deployment skills** (e.g. AWS/R2) when developing on local OSS storage.

---

## 4. Verification Checkpoint

Before declaring any implementation complete:
1. Verify against TypeScript typechecking (`pnpm type-check`).
2. Verify against backend unit/integration tests (`pytest tests/`).
3. Verify against mobile/responsive breakpoints (390px, 768px, 1440px) and minimum 44px touch targets.
