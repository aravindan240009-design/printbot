# Phase 0 product contract — design draft

Authority: latest shared contract and Phase 0 request. Reference DOCX/PDF missing.
Decisions below describe intended behavior; existing apps do not implement them.

## Customer: three principal screens

1. **Upload and configure:** shop name/logo and language; anonymous shop-bound QR
   session, upload status and file reorder. Basics: pages, copies, color, paper,
   duplex. Expand applicable settings for margins, scaling, n-up, orientation,
   quality, finishing and photo crop/layout. Per-file values with explicit apply-to-all.
2. **Preview and confirm/pay:** server-rendered thumbnails and selection, separate
   logical pages/sides/sheets, paise price locked to shop pricing version, dispatch
   or pickup choices, cash/online options and any manual-approval requirement.
   Never infer payment success from redirect or uploaded screenshot.
3. **Track and collect:** opaque shop-bound tracking link/receipt, payment/approval/
   printing/collection states, failure help and safe refund/cancel policies. Do not
   label spooler disappearance as paper delivered. No required phone/email/login.

English/Tamil initially, Hindi support; 44px minimum interactive targets, keyboard
and screen-reader labels, status announcements, high contrast, progressive disclosure
and inexpensive Android/iPhone testing. No graphical theme chosen. Text wireframes
are the Phase 0 design artifact; graphical QA is not yet applicable.

## Shop desktop and Super Admin

Desktop: queue with paid/approval/dispatch/unknown states; server preview, approve/
reject with reason; printer capabilities/routing; cash verification; booking capacity;
private troubleshooting; audited settings; authorized PCs and assurance status.
Unknown completion requires supervised reconciliation and explicit reprint decision.

Super Admin: shops, one subscription plan with monthly/annual billing, entitlement,
approved-device policy, revocation, signing/update health, license inventory and
audited elevated support scope. MFA required. No blanket customer-document browser.
Unlimited printers per subscribed shop; no feature tiers, per-printer fees, per-page
software commission or invented one-PC limit. One distributable installer for all shops.

## Modes, settings and time

Exactly FULL AUTOMATIC and MANUAL APPROVAL. Automatic dispatch requires eligible,
verified-paid, compatible jobs. Cash/unverified payment cannot bypass controls.
Manual mode requires approval/rejection of every submission. Authorized audited mode
changes affect new orders; snapshot policy on acceptance. Paid stranded work can
resolve/refund after entitlement expiry.

Hierarchy: platform safety/licensing maximums -> shop capabilities and policy ->
versioned shop defaults/pricing -> order snapshot -> explicit per-file configuration.
Revalidate capabilities at dispatch without silently changing the paid PrintPlan.

Distinct services: future print dispatch; ready-by/pickup slot; assisted physical
original Xerox appointment; hardware-validated optional timed self-service copier.
Bookings must reserve shop-local capacity, specify timezone, prevent concurrent
overbooking and define late arrivals/cancel/reschedule. Printing API support proves
neither scanning nor safe unattended copier access.

## Financial and privacy research

Platform-to-shop subscription ledger and shop-to-customer receipts/refunds are
separate. Provider fees/settlement are a third flow. Merchant ownership, KYC and
marketplace/linked-account arrangements require provider confirmation before live
integration. A static UPI QR or browser assertion does not provide verified automatic
payment. Verify signed server events and captured status/amount/currency/merchant/
order binding, deduplicate and tolerate event reordering. Razorpay is a research
example, not a selected mandatory dependency:
https://razorpay.com/docs/webhooks/validate-test/

India privacy review must cover fiduciary/processor roles, notices, purpose, consent
or other applicable basis, children, rights requests, breach response, retention,
backups, sub-processors and cross-border rules. Consult actual commencement
notifications and corrigendum; do not claim compliance from a checklist.
Official collection: https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digit

Signing requires a user-mode installer/update signing decision and current vendor
quote. Driver signing requirements are separate; this design installs no custom
kernel driver. Testing may be unsigned; production signing and Windows costs must
be disclosed. No fee estimate has been verified.

20 MB is not a safe complexity bound. Budget upload, original+normalized+preview+
raster+retry copies, peak concurrent RAM and CPU, storage/egress and deletion work.
A4 300 DPI BGRA is approximately 35 MB per side before other buffers; use bounded
page-at-a-time rendering, pixel limits, quotas, upload expiry, timeouts and isolated
no-network conversion. Initial numerical service limits require measured fixtures.
Deletion covers object versions, previews, worker/agent temp, abandoned uploads,
backups policy and spool retention; do not promise immediate erasure from all media.

## Text wireframes (Phase 0 review artifact)

```text
CUSTOMER 1 / UPLOAD + CONFIGURE
[Shop logo + name]                      [English | Tamil | Hindi]
[Upload files: formats, size and privacy limits]
[File card: name / conversion status / reorder / remove]
[Pages: all | range | thumbnails] [Copies - 1 +]
[B&W | grayscale | color] [Paper] [One side | Two sides]
[More applicable settings v] [Apply these values to all files]
[Continue to server preview]

CUSTOMER 2 / PREVIEW + CONFIRM
[Back] [Shop name] [Server preview: page thumbnails]
[Logical selected pages] [Rendered sides] [Physical sheets]
[Price in INR, paise-exact quote / pricing version / quote expiry]
[Print now | future dispatch] [Pickup/ready-by slot]
[Online payment | cash: approval required]
[Mode and approval explanation] [Confirm / pay]

CUSTOMER 3 / TRACK + COLLECT
[Order receipt and opaque shop-bound link]
[Payment verified?] [Approval] [Queued] [Print outcome] [Collection]
[Completion unknown: shop assistance required; no automatic reprint]
[Help] [Eligible cancel/reschedule/refund] [Collection instructions]

SHOP DESKTOP
[Shop / operator / entitlement / connection]
[Needs approval] [Ready] [Printing] [Completion unknown] [Bookings]
[Order: safe server preview / immutable configuration / payment evidence]
[Approve | Reject with reason] [Compatible printer route]
[Supervised reconcile: inspect paper/job evidence; explicit resolution]
[Printers unlimited] [Authorized PCs + assurance] [Audited settings]

SUPER ADMIN (MFA)
[Shops] [One all-inclusive plan: monthly | annual] [Entitlements]
[Authorized-device policy / revoke] [Signed update health]
[Audited elevated support scope request: reason and expiry]
[License/SBOM/release gates] [No general customer-document browser]
```

All interactive targets at least 44px; error/status announcements and persistent
labels are required. Layout is unimplemented; no graphical/mobile accessibility
pass is claimed. Physical Xerox appointments, future print dispatch, pickup slots
and hardware-validated copier access remain separate service choices.

Research checked 2026-10-22: the official MeitY collection includes Rules 2025,
corrigendum and commencement materials; provisions have staged applicability.
Review the actual notification and operative date for launch; no compliance claim.
Official signing guidance separates MSI/EXE publisher signing, MSIX and Store
paths: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options .
Signing alone does not guarantee reputation or physical printer safety. Keep live
provider ownership/settlement confirmation and signing certificate budget BLOCKED.
