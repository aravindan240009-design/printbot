# Shop-Wise Razorpay TEST Staging Design

**Status:** Approved design; implementation and remote deployment gated on staging preflight.
**Scope:** Isolated staging only. No production changes, live payments, or native printing.
**Target Supabase project:** `smlgvtplfifnryhkqspv`

## Understanding

- Add shop-specific Razorpay configuration to the test-mode workstation and use it for the matching customer's checkout.
- Only Razorpay TEST credentials are accepted. LIVE configuration and payments remain unavailable.
- Deploy the customer site and payment API to the separately identified, public staging Cloudflare Worker.y
- Use only the specified staging Supabase project, and inspect its identity and existing state read-only before changes.
- Preserve private document upload, preview, workstation authentication, and order queue behavior.
- A payment is PAID only after server-side validation; only PAID orders enter the workstation queue.
- Keep printing disabled at UI and Rust/native layers.

## Current repository evidence

- `wrangler.staging.jsonc` currently defines a separate static-assets Worker; it has no API entry point.
- `supabase/config.staging.toml` targets the specified project ref. Existing staging Edge Functions cover quote, shop profile, private upload, payment, webhook, queue, document streaming, and cleanup.
- The existing staging checkout uses project-wide Razorpay secrets, and the staging shop/order migration is present but has not been applied according to the existing staging plan.
- The current staging customer entry point is fixed to one shop slug. Two shop routes and per-shop configuration are needed.
- The test workstation authenticates with Supabase Auth and can view the paid test queue and privately streamed documents. Its native `test-mode` feature excludes the printer module and uses refusing printer commands.
- Staging env examples have no anon key value. The design plan reports that no staging env file, test operator account, or remote schema preflight has been prepared.
- The normal customer checkout's API-not-configured error is separate from the staging checkout: normal mode requires a public HTTPS `VITE_API_BASE_URL`.

## Assumptions and constraints

- The first release is low-volume staging: two shops, few test accounts, one supported file per order up to 2.5 MB, and modest concurrent checkout.
- No paid service, scheduler, or plan upgrade may be introduced without approval.
- Each shop owner supplies genuine Razorpay TEST credentials. No credentials will be fabricated or copied between shops.
- If an actual second Razorpay TEST account, signed webhook delivery, or checkout is unavailable, the relevant acceptance case is PENDING.
- A usable staging backup/snapshot must be verified before any migration or deployment. If unavailable, stop.
- Any unexpected project identity, schema, bucket, data, or production dependency is a hard stop.
- Manual cleanup retains unresolved payments, reconciliation records, and audit evidence; it removes only eligible expired test documents and resolved records after seven days.

## Final implementation plan

### 1. Read-only preflight and safety gate

1. Positively identify the Supabase project ref as `smlgvtplfifnryhkqspv` and the separate staging Cloudflare account/Worker.
2. Read-only inspect existing schemas, tables, functions, RLS, buckets, seed data, deployment bindings, and dependencies in those staging targets only.
3. Verify a usable staging backup/snapshot and its recoverability.
4. Review the migration SQL and staging deployment configuration before applying either.
5. Stop before changes if any identity, backup, schema, bucket, data, or dependency check fails or is ambiguous.

### 2. Staging data model and migration

- Add a unique shop/provider/environment payment configuration, constrained to Razorpay TEST.
- Store Key ID with the shop and independently encrypt Key Secret and webhook secret using AES-256-GCM, distinct cryptographically secure random nonces, authenticated ciphertext, key ID, and format/version metadata.
- Store the encryption key only as a Cloudflare Worker secret. Support explicit key rotation with the active key ID and previously supported key versions; never silently fall back.
- Track API credential verification and webhook verification separately. Online payment is enabled only when both are verified.
- Store only hashes of random webhook routing tokens; support rotation with a short overlap.
- Add a second clearly identified staging shop without copying production data or inventing credentials. Preserve the existing test shop ID, rates, documents, and behavior.
- Add cash-enabled settings, cash order states, minimal credential/cash audit metadata, and payment-event deduplication.
- Keep sensitive tables inaccessible to `anon` and `authenticated` roles. Only the staging Worker backend accesses payment config and event records.
- Implement security-definer RPCs with fixed `search_path`, strict input/state validation, revoked public execution, and narrowly granted execution.
- Migrations are additive and reversible. Rollback must not silently drop populated tables, existing shop data, documents, unresolved payments, or audit evidence.

### 3. Cloudflare Worker payment API

- Extend only the separate staging Worker to serve its staging assets and same-origin payment API routes. Do not edit or deploy production Worker configuration.
- Authenticate owner operations using the staging Supabase Auth token and a server-side membership/role check on every request. Only the authorized shop admin/owner may configure credentials; operators retain queue/preview access only.
- Validate TEST Key IDs and credentials with a supported read-only Razorpay API request; never create a payment order to test credentials.
- Send secrets from the EXE only over HTTPS. Encrypt before persistence and never return secrets or log them.
- Create payment orders from persisted test orders only. Load the shop, amount, currency, expiry, payment configuration, and status server-side; reject client-authoritative shop IDs/amounts.
- Verify checkout HMAC and independently retrieve the Razorpay payment. Only a matching captured, unexpired payment may atomically become PAID.
- Disable the old project-wide-secret payment path as an active/deployed path. The staging Worker is the sole authoritative Razorpay payment API.

### 4. Webhook and order processing

- Use a generated per-shop webhook URL. Its cryptographically random routing token selects a candidate shop but does not authenticate the request; only a valid HMAC over the exact raw body does. Rotate tokens with a short, controlled overlap.
- Webhooks do not require Supabase user authentication. Verify with the selected shop's webhook secret before trusting payload fields.
- Require a newly received, valid signed Razorpay TEST webhook before marking webhook configuration verified and enabling online payments.
- Validate order/payment mapping, shop, amount, currency, payment state, and expiry. Deduplicate by provider event ID with a body-hash fallback. Store minimal metadata only, never raw request bodies.
- Use atomic, idempotent database transitions for payment-order claims and callback/webhook races. Failed, forged, duplicate, mismatched, expired, and late payments never enter the paid queue. Late captures go to reconciliation.
- Keep cash separate from Razorpay. Cash orders remain `AWAITING_CASH` until an authenticated shop admin/owner confirms receipt through the workstation; record actor/shop/order/time, prevent duplicate confirmation, then transition atomically to PAID.
- Workstation queue returns only PAID rows. Existing private document streaming and preview remain unchanged. No native print route is enabled.

### 5. Customer and workstation experience

- Support both seeded shop slugs in the staging customer site; each customer order resolves its shop server-side.
- Preserve existing quote, private signed upload, upload confirmation, private document storage, and tracking behavior.
- Add Payment Settings to the test workstation: independent cash/online controls, TEST-only Razorpay settings, masked Key ID, blank replacement-secret inputs, separate API/webhook statuses, generated webhook URL, and setup instructions.
- Do not let operators read, replace, or decrypt credentials. Preserve their existing queue and preview access.
- Keep the unmistakable `TEST MODE — PRINTING DISABLED` state and test-mode native hard-failure commands.

### 6. Public staging acceptance and deployment

- Run unit/type/build/native checks as supporting checks, but do not treat them as substitutes for deployed acceptance.
- Deploy only to the verified staging Supabase project and separate public staging Cloudflare Worker.
- Build and distribute a separately configured test-mode EXE; never overwrite production downloads.
- Test the real public staging website and EXE for two-shop isolation, invalid credentials, secret redaction, API/webhook verification gates, signed TEST checkout/webhook, duplicate and raced events, wrong-shop/order/amount/currency, failure/expiry/late capture, cash confirmation/audit, private upload/preview, queue authorization, and direct native print invocation refusal.
- Report each acceptance case as PASSED, FAILED, or PENDING with evidence. No simulated success may be reported as a successful Razorpay test.
- Document manual cleanup: delete only objects and records past seven-day retention when payment is resolved; preserve unresolved/reconciliation rows and audit evidence. No paid scheduler is added.

## Decision log

| Decision | Alternatives considered | Rationale |
|---|---|---|
| One staging Cloudflare Worker serves static assets and payment API routes. | Keep payment wholly in Supabase Functions; use separate site and API Workers. | Matches the Cloudflare-secret encryption requirement while avoiding an extra Worker/CORS surface; Supabase Functions continue to own existing upload, quote, queue, and document workflows. |
| Razorpay TEST configuration is per shop; LIVE is unavailable. | Shared project-wide credentials or early LIVE support. | Prevents cross-shop credential mixing and satisfies the explicit staging-only constraint. |
| Encrypt secrets with AES-256-GCM in the Worker and store only ciphertext in Supabase. | Plaintext/database-only protection or client-side encryption. | Secrets remain unavailable to the EXE/browser and database clients; Worker is the trusted decryption boundary. |
| Both API validation and a genuine signed TEST webhook are required before enabling online payment. | Enable after Key ID/secret validation alone. | Confirms both credential paths independently and avoids accepting checkout with an unverified webhook setup. |
| Webhook route token selects a shop; raw-body HMAC authenticates the event. | Supabase user auth on webhook; trust a shop ID in event body. | Provider cannot use user auth; signed body and stored order mapping are the authority. |
| Cash uses a separate pending state and explicit authenticated confirmation. | Treat customer cash selection as paid or disable cash when online is off. | Prevents false paid state while keeping cash independent of Razorpay. |
| Only atomically verified PAID orders reach the queue; late captures require reconciliation. | Trust browser callback or retry automatically. | Prevents false payment confirmation and accidental dispatch. |
| Preflight, backup verification, and reversible additive migration precede deployment. | Deploy first and inspect afterward. | Preserves staging data and ensures no production or unknown target is modified. |
| Deployed acceptance is required; unavailable account/webhook tests remain pending. | Local mocks or fabricated credentials. | Matches the user's actual-staging-test requirement and keeps results honest. |

## Approval and implementation handoff

All five design sections and the staging-only architecture have been explicitly approved by the user. Implementation remains blocked until the read-only staging identity/schema/backup/deployment preflight succeeds. Any failure or ambiguity is a stop condition.
