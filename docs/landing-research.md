# Print Bot landing reference research

Date: 23 October 2026 (Asia/Calcutta). Scope: design reference research for the landing-page direction, not production integration or competitor verification.

## Method and limitations

Read all seven requested reference URLs through Agent Reach's documented Jina Reader backend using `curl.exe -s -L --max-time 35 https://r.jina.ai/<URL>`. All seven returned nonempty page content. This was **text/content inspection**, including headings and image descriptions; it was **not visual browser inspection**. No reference-site animation, frame rate, actual rendered spacing, mobile layout, or accessibility behavior was verified. No media was downloaded or copied. Source marketing claims do not verify Print Bot capabilities or licenses.

The optional `agent-reach check-update` command could not run because the CLI is not installed/on PATH; Jina Reader itself worked. No installation was performed.

## Transferable principles

| Reference | Evidence in retrieved content | Proposed Print Bot adaptation (design inference) |
| --- | --- | --- |
| [Raycast for Windows](https://raycast.com/windows) | Platform-specific landing page, product feature examples, download CTA repeated with version and Windows requirement. | Put the Windows action beside truthful release metadata. Repeat it after workflow explanation. Until a verified installer exists, show an explicit unavailable state rather than a fake download. |
| [Linear](https://linear.app) | Product-interface examples are woven into a workflow narrative, including status, issues, activity and planning. | Use a focused, clearly labeled illustrative queue to explain what a shop owner sees. Pair workflow stages with concrete UI, without invented business metrics or testimonials. |
| [Stripe Payments](https://stripe.com/payments) | Organizes a broad offering into named capabilities, with documentation, how-it-works and pricing sections. | Separate the customer journey, shop controls, Windows agent and subscription explanation. Keep shop subscription payments distinct from customer printing receipts. |
| [Framer](https://framer.com) | Couples creation capabilities with shipped examples and platform depth. | Establish Print Bot's visual character immediately, then substantiate it through realistic product illustrations and explicit availability. Do not borrow its uptime or customer claims. |
| [Motion](https://motion.dev) | Explains layout, gesture, scroll and spring animation as different tools; links performance guidance. | Give each motion a job: short feedback for controls, a finite paper-to-printer sequence for explanation, restrained entry reveals. Preserve readable static content and a reduced-motion presentation. No dependency approval is implied. |
| [Rive](https://rive.app) | Describes interactive UI through timelines, state machines and data binding, alongside product examples. | Model the brand animation as understandable states: document, configuration, approval/payment eligibility, routing. Avoid decorative perpetual motion that competes with the download action. This does not select or license Rive. |
| [Spline documentation](https://docs.spline.design) | Separates modelling/materials/lighting from interaction states, events and actions; exposes scene optimization guidance. | Keep one lightweight dimensional printer/paper scene with deliberate states and a static fallback. Treat full 3D runtime integration as a separately measured and licensed implementation choice. |

These adaptations are original design judgments, not claims that the reference sites visually use the proposed Print Bot layout.

## UI UX Pro Max local exploration

The primary agent reported two local design-system queries. The first, printing software/editorial/premium, suggested liquid-glass/luxury styling and was rejected as inappropriate for a practical Indian print-shop product. A retry using SaaS/minimal/productivity suggested Product Demo + Features, flat styling and Plus Jakarta Sans. The selected adaptation uses ink, paper and cobalt with a product demonstration emphasis. Typography availability and licensing must be checked before bundling any font; this research does not authorize a new dependency.

## Product constraints for the design

- One all-inclusive subscription, monthly or annual, with unlimited printers. No invented prices, tiers or per-page software commissions.
- Distinguish FULL AUTOMATIC eligibility from MANUAL APPROVAL; automatic does not mean cash or unverified payment bypasses approval policy.
- Show the customer path as scan, configure/pay, and track/collect, without mandatory customer app installation or login.
- Represent future dispatch, ready-by/pickup and assisted physical Xerox bookings as different services.
- Label illustrative UI, unavailable downloads and unverified hardware honestly.
- Maintain 44px controls, keyboard access, clear focus and reduced motion. Assess the actual implementation separately; this research is not accessibility or performance test evidence.

## Research execution record

- Read Agent Reach `SKILL.md` and `references/web.md`.
- Seven Jina Reader fetches completed with exit code 0 and usable content.
- Re-read Stripe, Framer and Motion headings in bounded output after combined tool output truncation; exit code 0.
- `agent-reach check-update`: exit code 1, command unavailable.
- Visual reference inspection: not performed. Production implementation and tests: outside this research task.
