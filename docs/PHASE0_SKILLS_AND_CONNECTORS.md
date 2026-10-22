# Phase 0 skills, plugins, connectors and MCP applicability

2026-10-22. Requested broad capability review. Installed/enabled, tool exposed,
authenticated resource access and successful operation are different observations.
No plugin was installed/uninstalled, permissions changed, cloud environment created,
message sent, site deployed or design file created during this review.

## Skills coverage

All **35 repository-local SKILL.md files** were read. Their **202 support files**
were inventoried and received targeted searches/selected inspection; large catalog
datasets were not reviewed row by row. External/global/plugin skills were selected
by relevance from the supplied session catalog, not all invoked indiscriminately.
Reading an instruction as audit data does not activate its unrelated workflow.

Applied to the review: security-review, secure-multitenancy, database-design,
api-contract-testing, backend-architecture/fastapi-backend-engineering principles,
windows-printing, windows-desktop-native, enterprise-architecture,
production-readiness-review, devops-ci-cd, devsecops-release-engineering,
requesting-code-review and verification-before-completion. Client review also applied
frontend accessibility guidance and fetched current Web Interface Guidelines.
Performance skills were compared for conflicting requirements; no infrastructure
performance benchmark was certified. Relevant plugin-management, Agent Reach,
Superpowers process and Cloud Environment runtime instructions were read.

Deferred workflows: code generation, TDD implementation, plan execution, worktree
creation, animation/3D creation, UI catalog scripts, production release, live printing,
pet generation, automation scheduling and unrelated office artifacts. They do not
advance this Phase 0 inspection merely by being available.

Local skill directory inventory (including root instruction):

```text
anthropic-frontend-design 2       api-contract-testing 1
backend-architecture 1           brainstorming 8
database-design 1                devops-ci-cd 1
devsecops-release-engineering 1   dispatching-parallel-agents 1
enterprise-architecture 1        executing-plans 3
fastapi-backend-engineering 1     frontend-design 1
motion-design-engineering 1      performance-audit 1
performance-profiling 1          postgresql-performance 1
production-readiness-review 1    react-view-transitions 9
receiving-code-review 1          requesting-code-review 2
secure-multitenancy 1            security-review 1
subagent-driven-development 14   systematic-debugging 11
test-driven-development 1        threejs-r3f-engineering 1
ui-ux-pro-max 73                 using-git-worktrees 1
vercel-composition-patterns 14   vercel-react-best-practices 76
verification-before-completion 1 web-design-guidelines 1
windows-desktop-native 1         windows-printing 1
writing-plans 1
```

## Material instruction conflicts

All paths below are under `.agents/skills`. Shared contract wins; no local skills
were rewritten or copied into global stores as part of this review.

| Reference | Conflict / required interpretation |
| --- | --- |
| secure-multitenancy/SKILL.md:11; api-contract-testing/SKILL.md:14 | Active X-Tenant-ID is not authenticated membership or a shop-bound guest session. Derive shop scope on server |
| windows-printing/SKILL.md:13,16,24-26; windows-desktop-native/SKILL.md:16,20; production-readiness-review/SKILL.md:23 | Raw PDF requires certified language support; queue state is not physical completion; zero-duplicate guarantees do not cover ambiguous crash windows. Use COMPLETION_UNKNOWN and supervised reconciliation |
| windows-desktop-native/SKILL.md:11 | UI IPC is not the sole hardware architecture: independent Rust service must survive UI closure |
| vercel-react-best-practices/rules/server-cache-lru.md:22-27 | Generic cache example keyed only by user ID must not be transplanted into tenant-owned data; include shop/auth context |
| enterprise-architecture/SKILL.md:14; devops-ci-cd/SKILL.md:15,20; devsecops-release-engineering/SKILL.md:17; production-readiness-review/SKILL.md:19,29; security-review/SKILL.md:15 | Hosted R2/Sentry, Redis, Docker Desktop or paid runners must not become local requirements. Contract requires OSS-first local alternatives |
| performance-audit/SKILL.md:11-13; performance-profiling/SKILL.md:11-13; production-readiness-review/SKILL.md:30 | Pricing/webhook/queue latency targets disagree. Approve measured workload-specific budgets; do not adopt fabricated p95 targets |
| postgresql-performance/SKILL.md:20 | Blanket ban on sequential scans is not a sound query policy; inspect actual plans/selectivity |
| frontend-design/SKILL.md:18 | Browser optimistic estimate cannot be authoritative payment pricing |
| security-review/SKILL.md:11-13 | Signing algorithm/retry windows depend on provider; financial dedup needs durable transactional ledger |
| database-design/SKILL.md:10-17; postgresql-performance/SKILL.md:16-18 | Fragmentary RLS examples omit composite tenant FKs, runtime roles, context lifecycle and worker scope |
| using-git-worktrees/SKILL.md:108-115; executing-plans/SKILL.md:110-113; subagent-driven-development/SKILL.md:103-106 | Work in current repo; pnpm and uv/venv win over generic npm/Poetry setup; dependency audit precedes install |
| subagent-driven-development/SKILL.md:304-316; references/fix-loop.md:63-68 | Parking review findings cannot establish completion when hardware/security/product gates remain blocked |
| react-view-transitions/SKILL.md:45-47; motion-design-engineering/SKILL.md:12; ui-ux-pro-max/SKILL.md:125 | No automatic React-canary/GSAP install without pinned compatibility/license review |

Support notes: `brainstorming/scripts/server.cjs:100` defaults loopback; optional
branding image creates an external request unless disabled. No claim of document
exfiltration is supported. Companion scratch keys must stay private/ignored.
UI skill CLAUDE_PLUGIN_ROOT examples do not match this `.agents/skills` layout.
Some execution helpers require Bash and mutate scratch ledgers; they are not
read-only audit utilities. Two local skills both declare the name frontend-design;
use full paths to disambiguate. Generic skills omit many Print Bot requirements,
so combining them cannot replace the shared contract.

## Verified connector/plugin observations

| Capability | Evidence used | Result / applicability |
| --- | --- | --- |
| Context7 | Plugin search plus successful resolve/query | Installed/enabled; retrieved official Tauri migration guidance. Earlier Phase 0 retrieved PDFium rendering docs. No repository code uploaded |
| Figma | Plugin search and manifest dependency lookup | Installed/enabled; dependency resolved. No supplied Figma design/file to inspect; Phase 0 permits text wireframes. File access/plan entitlement not tested |
| Superpowers | Plugin search and process skill reads | Installed/enabled; process/review instructions used. It supplies workflow skills, not a printer integration |
| Cloud Environment | Manifest dependency lookup plus exposed-tool inventory | Installed/enabled with optional cloud-environment app dependency. No environment_status or remote executor tool exposed; no managed instance readiness established. Local Windows remains actual execution host |
| Connected Word references | Codex document session discovery with surface=word | No connected document sessions found; named master DOCX and Claude PDF still missing from repository |
| Plugin Management | Search and dependency metadata calls | Successfully returned relevant installed/enabled states; metadata lookup did not install/connect/change anything |
| Agent Reach / web | Earlier Exa source research; current official guideline research | Official license/API/UI evidence available; not a substitute for pinned binary inventory |
| Code Review connector | Exposed tool metadata inspected | Only PR CI-diagnostics reader available; no requested PR to inspect. Local source review used independent reviewers |
| Playwright/CUA | Tool metadata inspected | Browser/UI capability exposed; no runnable integrated app/build or selected browser artifact to validate in this inspection. No passing screenshot fabricated |
| Artifact/office tooling | Tool metadata inspected | Useful when creating office artifacts; no reference file or connected Word session available here |
| Sites/image/pets/safety/account/chat tools | Capability metadata inventoried | Outside local Phase 0 source review. No unrelated mutations were performed |

Plugin search results are not a complete installed-plugin directory. Installed does
not mean connected OAuth/resource access. Tool names and namespace counts are in
`PHASE0_TOOL_INVENTORY.json`; separately exposed collaboration/CUA/function wrappers
are outside that dynamic list. Other external skills from the session catalog remain
available for matching tasks; no claim is made that every global skill was read.

## Current official technical references

Tauri 2 migration guidance confirms the API/core and capabilities migration surface:
https://v2.tauri.app/start/migrate/from-tauri-1/

Current UI review guidelines fetched by the client reviewer:
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

These references guide review; they do not prove that this repository builds or
that its prototype is secure. Exact version/build/license validation remains pending.
