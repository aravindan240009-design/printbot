# Print Bot Live Shop Ordering Design

**Status:** Approved design baseline; local webhook/order guardrails tested; live-order implementation blocked on open gates
**Date:** 2026-11-17

This is the current approved design for the live shop-ordering workflow. It
supersedes earlier proposals for this scope that assumed Supabase Edge
Functions, Cloudflare Containers, or a full TypeScript backend rewrite. Those
documents remain historical; do not implement conflicting decisions from
them.

## Current implementation status

Local-only changes now fail closed when a shop has no Razorpay credentials or a
webhook has no known gateway-order mapping. Merchant and order identity come
from that mapping, not webhook notes or a default shop; captured amount and
currency must match. Webhook deduplication uses the signed body digest. Payment
events older than five minutes enter `PAYMENT_VERIFYING` instead of releasing
the job; no durable reconciliation worker exists yet. Payments arriving for
closed orders are held for owner review. Only orders in `AWAITING_APPROVAL` can
be approved for printing.

These are not live-payment guarantees: job state, gateway mappings, credentials,
idempotency, ledger, audit, and outbox are still process-local. Delayed-payment
reconciliation and real refund execution are not durable or complete.

A read-only production catalog check found the existing application tables and
RLS enabled on most public tables, but only three public RLS policies (two for
`print_jobs`, one for `shops`). `migration_audit_log` has RLS disabled and
explicit privileges limited to `service_role`. The Realtime publication lists
`pilot_applications`. The read-only role could not enumerate Storage bucket
rows, and Auth configuration was not inspected; this is not a complete
security inventory. No production schema or data was changed. Production work
is paused until a full backup and restore are verified.

## Understanding summary

- A customer scans a shop QR code, uploads a document, receives a
  server-calculated quote, and pays through that shop's Razorpay account.
- Only a verified Razorpay webhook can mark an order paid. The shop EXE receives
  the order within five seconds; the owner previews and approves it before
  printing.
- Launch is multi-tenant in the long term (target: up to 100 shops and 20
  active orders per shop), but the first real-payment pilot is one shop.
- Cloudflare hosts the static site and the public API; Supabase remains the
  Postgres database and private file store. Keep the existing Python business
  logic; do not rewrite the backend in TypeScript.
- The API currently runs only on the developer's computer. It remains a
  development server only; the public pilot API must be deployed and tested as
  a Cloudflare Python Worker on the Free plan.
- First-release files are PDF, DOCX, JPG/JPEG, and PNG, up to 50 MB. DOCX and
  images are converted locally on the shop PC using LibreOffice and the app's
  image-to-PDF path.
- The shop owner uses a password plus an email one-time code. The EXE has a
  separate, revocable station identity and never receives the owner's session.

## Assumptions and constraints

- Online orders pause when the API, database, or payment verification is
  unavailable. No offline orders are accepted.
- A shop has one owner account for the pilot; separate staff accounts are not
  in scope.
- Each shop owns its Razorpay account. Its API and webhook secrets are stored
  encrypted server-side and never sent to the browser or EXE.
- Each shop PC has updated LibreOffice and Microsoft Defender enabled. The EXE
  checks for the scanner and blocks conversion/printing if scanning is
  unavailable.
- A failed or ambiguous print is never automatically retried. The owner must
  inspect the printer and explicitly authorize another attempt.
- No paid service or plan is introduced without the user's approval.
- Supabase Free and Cloudflare Workers Free are for development and a measured
  one-shop pilot only. Capacity for 100 shops is not promised until load,
  reliability, and recovery tests pass.
- The initial EXE may be unsigned for the controlled one-shop pilot only. The
  owner verifies its SHA-256 through a trusted channel. Wider distribution is
  blocked until signing is approved.

## Decision log

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Keep Cloudflare for the static site and test the existing Python/FastAPI business logic on a Cloudflare Free Python Worker. | Paid Cloudflare Containers; TypeScript rewrite; keep the API on a developer PC. | Preserves Python and avoids an unapproved paid plan. A local API cannot receive reliable public webhooks or serve multiple shops. |
| Keep Supabase Postgres and private Storage as the durable source of truth. | Process memory, local SQLite, D1/R2, or a different provider. | Existing Supabase choice; order, payment, file, and audit state must survive restarts and be shared across shops. |
| Use direct, short-lived, shop-bound uploads to private Supabase Storage. | Proxy large file bodies through the Worker or publish public URLs. | Avoids free Worker CPU/body handling and keeps documents private. |
| Convert DOCX and images on the paired shop PC. | Paid cloud conversion; unverified browser conversion. | User requires these formats and declined paid conversion. The owner must see the exact final PDF before approval. |
| Give each EXE its own restricted station identity, authorized by the owner through one-time pairing. | Store/reuse the owner's Supabase Auth session in the EXE. | Separates owner and workstation credentials and permits station-specific revocation and RLS. |
| Use authenticated Worker polling for the station queue every 3–5 seconds, checking station authorization on every read. | Direct Supabase Realtime queue access. | Realtime caches channel authorization until token expiry/refresh, which cannot satisfy the pilot's immediate revocation requirement. |
| Require verified Razorpay webhooks and persistent idempotency before marking an order paid. | Trust browser redirects or accept client payment status. | Prevents forged or duplicate payment events from releasing print jobs. |
| Manually confirm refunds and ambiguous print retries. | Automatic refund/reprint. | Avoids incorrect refunds and duplicate physical output. |
| Delete completed files after 24 hours; delete unresolved paid files after 30 days; delete unpaid abandoned files after 24 hours. | Indefinite storage. | Reduces exposure of customer documents while preserving a bounded resolution window. |
| Run a one-shop pilot first, with daily encrypted backups and a weekly restore test. | Launch to 100 shops immediately or rely on Supabase Free as the only backup. | Free tiers have storage, CPU, request, availability, and backup limitations. |

## Architecture

### Public API and persistence

- Continue serving static website assets through the existing Cloudflare
  deployment. Deploy the API as a separate Cloudflare Python Worker on the Free
  plan; keep local FastAPI for development only.
- Add a Worker-compatible entry/adapter while retaining Python business rules.
  Cloudflare's package instructions and official FastAPI sample differ on the
  minimum host Python version; the local Pywrangler probe selected Pyodide
  3.14.2. Test FastAPI, Pydantic, `httpx`, `python-multipart`, Pillow, pypdf,
  and all imports. Free Workers have a 10 ms CPU limit per request; the
  repository currently targets Python 3.11. Any Worker-specific runtime or
  dependency changes must be isolated and validated without weakening existing
  licensing or payment checks.
- Replace process-local order, payment, asset, credential, session, and
  idempotency stores. Supabase is authoritative. Normal user and station data
  access is subject to RLS. Privileged webhook operations use narrow,
  parameterized database functions with explicit shop/order checks; never
  expose a service-role key to a client.
- Customer guest sessions are scoped to one order and its permitted upload,
  quote, checkout, and status actions. They cannot list a shop's orders or
  access another customer's order, even within the same shop.
- Use Postgres transactions for payment-event deduplication, payment/ledger
  state, order transition, audit record, and outbox event. Unique constraints
  protect provider event IDs, idempotency keys, payment references, and print
  intents.
- The station polls an authenticated Worker queue endpoint every 3–5 seconds.
  Each request rechecks the station's active status and shop binding, and RLS
  limits returned rows to that station's shop. Do not send sensitive queue
  contents over Realtime. The target is order visibility within five seconds.

### Authentication and authorization

- Persist OTP completion keyed to the owner ID and the exact Supabase JWT
  `session_id`; privileged RLS policies must require that verified session
  record, not a user-wide flag or client-supplied claim.
- Recheck station authorization on every API/data request. Direct Supabase
  Realtime access is not used for the pilot queue because its channel
  authorization is cached until the JWT expires or is refreshed.
- An admin-issued license is a one-time activation code. Preserve current
  license validation and cryptographic protections; store only a hash and
  invalidate the code after successful activation.
- The owner signs in with password plus email OTP. Supabase's native MFA does
  not use email as a second factor, so implement a custom second-step challenge:
  store only a keyed hash, expire it after five minutes, limit attempts and
  resends, and bind successful verification to that exact owner auth session.
  RLS must deny a password-only session. Send mail through the user's existing
  SMTP provider using Cloudflare outbound sockets; verify SMTP connectivity
  before enabling owner activation. Never fall back to password-only access.
- The owner pairs a station through the authenticated website using a
  one-time code displayed by the EXE. Create a separate station account with
  immutable shop/station/role metadata and narrowly scoped permissions.
- Store station credentials in Windows Credential Manager/DPAPI. Support
  revocation and rotation. RLS must deny cross-shop reads/writes and prevent a
  station from changing pricing, shop settings, payment credentials, or
  refunds. The station may read its queue, approve permitted jobs, and report
  print status.

### Documents and workstation printing

- Upload directly to a private, shop-isolated Supabase Storage path using
  short-lived signed permissions. Enforce a 50 MB cap for the Supabase Free
  plan. Validate file signatures, hashes, sizes, and content structure; do not
  trust extension or browser MIME type. Reject unsupported and macro-enabled
  formats.
- After payment verification, the station downloads an authorized file using
  a short-lived URL. Before opening/converting, check that Microsoft Defender
  is available and scan the file. If scanning or conversion fails, hold the
  paid order and do not show an approval/print action.
- Convert DOCX with updated LibreOffice, and JPG/JPEG/PNG with the local
  image-to-PDF path. Render a preview of the final normalized PDF. Record its
  SHA-256 and submit those exact bytes to the Windows spooler after owner
  approval.
- Create a persistent print-intent record before spooler submission. Record
  the spooler job ID and outcome. Any uncertain result becomes
  `COMPLETION_UNKNOWN`; require owner inspection before authorizing a new
  attempt.
- Protect local temporary files with per-job encryption using Windows DPAPI,
  restrict the temporary directory, delete the key and file after the job,
  and record cleanup. Do not claim physical SSD overwrite is guaranteed.

### Payments, refunds, and lifecycle

Before contacting Razorpay, persist a payment attempt with a unique internal
receipt/idempotency key and explicit states such as `CREATE_PENDING`,
`CREATED`, `CREATE_UNKNOWN`, and `FAILED_CONFIRMED`. If the provider call
times out or the API crashes before saving the gateway order ID, mark the
attempt `CREATE_UNKNOWN`. Reconcile that attempt by its receipt/provider
records; never create another payable gateway order until the prior outcome is
known. If the provider cannot establish the outcome automatically, hold it for
owner/operator resolution.

1. The server derives the shop from a validated QR and order-scoped guest
   session, calculates the price, validates upload metadata, creates a durable
   pending order, and creates the Razorpay order using that shop's credentials.
2. The browser may display checkout success, but only the Razorpay webhook
   advances payment state. Use the event's candidate gateway order ID only to
   look up the durable payment-attempt/merchant mapping needed to select a
   candidate webhook secret. Verify the raw-body HMAC first, then validate the
   mapped shop, job, exact amount, and currency. Never choose a merchant from
   unverified notes/body fields or fall back to a default shop.
3. Process each webhook idempotently and transactionally. Persist provider
   event IDs, but do not rely on the event-ID header alone; unique payment
   references and state-transition constraints must make a signed-body replay
   harmless even if its unsigned event-ID header changes. Do not discard a
   correctly signed event solely because it is delayed or out of order.
   Correlate and reconcile late or state-conflicting events against Razorpay;
   hold ambiguous/canceled-order payments for review and never queue a job
   until payment is confirmed. A duplicate, invalid, or mismatched event
   cannot create a second payment or queue a job.
4. On verified payment, publish a durable outbox event. The station's next
   authenticated poll receives the order within five seconds; it downloads,
   scans, converts, previews, and waits for owner approval before printing.
5. On rejection after payment, require owner confirmation before calling the
   shop's Razorpay refund API. Record the gateway's actual refund status; do
   not report a refund as complete until verified.

## Retention and audit

- Keep originals private and shop-isolated. Record download, scan, conversion,
  approval, print-intent/result, refund, and deletion events without logging
  document contents, secrets, or unnecessary personal data.
- Delete unpaid/abandoned uploads 24 hours after upload.
- Delete completed-order originals 24 hours after completion, or earlier on an
  authorized customer request.
- Keep paid unresolved files until resolved, with an absolute 30-day maximum.
  At expiry, revoke access first, record the deletion request, retry failed
  Storage deletes idempotently, and alert the owner.
- A scheduled cleanup task processes bounded batches and reports failures;
  deletion must not be a silent success-shaped fallback.

## Free-tier limits and rollout

Current documented limits used for planning:

- Cloudflare Workers Free: 100,000 requests/day and 10 ms CPU/request.
- Supabase Free: 500 MB database, 1 GB file storage, 5 GB egress, 50 MB maximum
  upload, 200 concurrent Realtime connections, 2 million Realtime messages per
  month, and project pause after a week of inactivity.
- Supabase Free does not include automatic database backups or point-in-time
  recovery. The pilot owner/admin runs a daily encrypted database backup and
  verifies a restore weekly.

Rollout gates:

1. Inventory the actual Supabase schema, RLS/grants, Auth configuration,
   Storage buckets, Realtime publication, existing data, and current license
   validation. Do not apply repository migrations blindly; preserve license
   security and existing customer/shop data.
2. Create and restore a backup before schema writes. Add reviewed, additive
   migrations for durable orders, payments, webhook events, idempotency,
   assets, station identities, print intents, audit/outbox, and cleanup.
3. Build a local test adapter and prove the Python Worker runtime supports the
   required imports, SMTP transport, Supabase access, FastAPI routes, and CPU
   limits. If any hard requirement fails on Free, stop; do not silently switch
   to a paid service.
4. Implement RLS, owner email challenge, station pairing, signed private
   uploads, and database transactions. Test negative cross-shop and
   password-only access before connecting live customer flows.
5. Test Razorpay Test Mode and all file/print flows with a physical test
   printer. Only after sandbox acceptance may the user configure live
   credentials and start the controlled one-shop real-payment pilot.
6. Measure 5-second queue visibility, usage, backup/restore, error recovery,
   and one-shop operations. Do not promise 100-shop capacity until load and
   failure tests at 100 shops/2,000 active orders pass and any required paid
   plan is explicitly approved.
7. During the one-shop pilot, distribute only the hash-verified unsigned EXE.
   Do not publish it broadly as a trusted installer until code signing is
   approved and completed.

## Acceptance tests

- Repeated order requests, duplicate webhooks, repeated cash/payment actions,
  and concurrent webhook delivery cannot create duplicate orders/payments.
- A customer guest session cannot list orders or access another order's files
  or status, including another order in the same shop.
- Wrong signature, amount, currency, shop, gateway order, expired activation
  code, and password-only owner sessions are rejected.
- Webhook merchant-secret selection comes only from the durable gateway-order
  mapping. Crashes/timeouts during Razorpay order creation never create a
  second payable provider order without reconciliation.
- Valid delayed/out-of-order webhook events are reconciled safely; they cannot
  silently strand a successful payment or release an unverified job.
- Replaying a signed webhook body with a different event-ID header cannot
  create a second payment, audit transition, or queue event.
- Password-only owner sessions fail RLS checks even when they belong to the
  correct owner; OTP proof is tied to that exact auth session.
- Shop A's owner and station cannot read or alter Shop B's jobs, files, audit
  events, or queue responses. Revoking a station immediately blocks future
  queue reads.
- The EXE never stores or transmits an owner session or Razorpay secret.
- An order appears on the authorized station within five seconds after verified
  payment under the one-shop pilot load.
- PDF, DOCX, JPG, and PNG signature/size checks reject malformed or oversized
  files. Defender is invoked before conversion; missing scan capability blocks
  the job.
- The owner previews the exact PDF whose recorded hash matches the bytes sent
  to the spooler. No job prints before owner approval.
- Simulated disconnects before, during, and after spooler submission never
  cause automatic reprints. Ambiguous results require owner review.
- Refund requires owner confirmation and the UI reflects the verified Razorpay
  refund status.
- File access and cleanup events are audited; 24-hour and 30-day expiration,
  retry behavior, and early deletion are tested.
- Worker restart, station restart, network loss/reconnect, SMTP failure,
  Supabase outage, and backup restoration produce explicit safe states.
- No live rollout proceeds if the Free Worker CPU/request limits, Supabase
  quota, SMTP, RLS, backup, or print-safety gates fail.

## Open technical gates

- The existing API targets Python 3.11. The local Worker probe ran under
  Pyodide 3.14.2 using candidate FastAPI 0.136.1, Pydantic 2.12.5, Pillow
  12.2.0, HTTPX 0.28.1, python-multipart 0.0.12, and pypdf 6.19.0. The
  existing pinned FastAPI/Pydantic/Pillow versions did not resolve for that
  Worker runtime.
  Complete dependency/license review and API behavior tests before adopting any
  candidate versions or moving business logic.
- On this Windows checkout at `D:\print bot`, pywrangler fails during
  Pyodide interpreter setup because its project/cache/runtime cross drives and
  the workspace path contains a space. The same probe succeeds from a
  no-space C: temporary path. Use a supported CI/Linux or C: workflow for
  repeatable Worker validation; do not treat the Windows local run as a
  deployment test.
- Authenticated Worker polling is selected for the one-shop pilot, with a
  3–5 second interval and fresh station authorization on every read. One
  station polling 24/7 uses approximately 17,280–28,800 Worker requests/day;
  measure combined usage and do not claim 100-shop capacity on the Free plan.
- The compatibility probe's 10 ms CPU cap has not been measured on a deployed
  Free Worker. Verify real request CPU, bundle size, and daily request use in a
  non-production account before making any live-order claim.
- Confirm SMTP TLS/authentication works from the Cloudflare Worker runtime and
  is not blocked by the provider. The SMTP password remains a server-side
  secret.
- Confirm all Supabase Storage signed-upload, RLS, Realtime, and transactional
  RPC behavior against an isolated project before touching production data.
- Confirm Microsoft Defender availability and LibreOffice installation/update
  instructions for the pilot shop.
- Measure whether the five-second target and required API routes stay within
  Cloudflare Free quotas. Free-tier use is not an uptime SLA.

## References

- [Cloudflare Python Workers](https://developers.cloudflare.com/workers/languages/python/)
- [Cloudflare Python package support](https://developers.cloudflare.com/workers/languages/python/packages/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare outbound TCP sockets](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/)
- [Supabase pricing and quotas](https://supabase.com/pricing)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)
