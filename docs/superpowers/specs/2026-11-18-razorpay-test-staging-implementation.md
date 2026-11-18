# Razorpay Test Checkout Staging Implementation Plan

**Status:** Approved design; local implementation prepared, awaiting review and deployment approval. No Supabase project or Cloudflare Worker has been modified.
**Date:** 2026-11-18
**Supabase test project:** `smlgvtplfifnryhkqspv`

## Goal and boundaries

Enable the customer flow at a separate staging URL to upload a real test document, pay through Razorpay Test Mode, and have a server-verified order appear in a separately configured Print Bot workstation EXE. The workstation can securely preview the private document but cannot print it.

The existing production Supabase project, current public Cloudflare Worker, current workstation build, and current downloadable release files remain unchanged. No live Razorpay keys, public document URLs, service-role credentials in clients, paid services, or physical printer calls are allowed. Uploaded test documents and associated order records have a seven-day retention deadline; cleanup is manual and uses no paid scheduler.

## Repository inspection and constraints

- The root Cloudflare Worker (`wrangler.jsonc`) serves the root Vite app from `dist`. The checkout used in the screenshot is in `src/customer-web`; its payment order path still requires `VITE_API_BASE_URL`, which is absent from the local environment and from the deployed build.
- The customer currently creates a FastAPI order, launches Razorpay, then directly inserts into `pilot_applications`. It also serializes documents as base64 in `notes`. Test mode must replace this payment/write path with Edge Functions and private Storage.
- `supabase/functions/quote-order` is the only existing Edge Function. It reads an active shop from `pilot_applications` or `shops`; its pricing calculator is reusable. The customer profile loader and desktop queue currently read `pilot_applications` directly.
- The desktop queue parses `fileData` from `notes`; the Tauri app exposes printer discovery, spool, and native print commands. A test EXE therefore needs a separate queue/document path and a native-level print guard, not just hidden buttons.
- Supabase CLI is not installed/available in this checkout, there is no linked test project, and the repository has no `supabase/migrations` directory. The checked-in `infra/migrations` are a separate legacy/API schema set. Their `pilot_applications` changes conflict (one migration grants public writes while another revokes them); they must not be used for staging.
- No remote schema was inspected. Before applying the new migration, perform a read-only schema/bucket inventory against **only** the supplied test project. Stop if unexpected custom objects or data exist. Never link the CLI to, query, or apply migrations to the production project.

## Proposed isolated data model

Create one additive migration under `supabase/migrations/` for the test project only:

1. A minimal active `shops` row/table compatible with the existing quote function (`id`, `slug`, `name`, `city`, `contact_phone`, `status`, `rates`, and `order_mode`). Seed one clearly named test shop; do not copy production shop data.
2. `test_orders` with shop FK, unique request-idempotency hash, hashed customer capability token, server-calculated quote/options, sanitized file metadata and private object path, amount/currency, Razorpay order/payment IDs, payment/order state, creation/expiry/retention timestamps.
3. `test_payment_events` with unique Razorpay event ID (body-hash fallback), order FK, event type, body hash, and receipt time. Do not retain full webhook bodies.
4. `test_workstation_memberships` mapping a test Supabase Auth user to the test shop and a minimal operator/admin role.
5. A private `printbot-test-documents` Storage bucket. RLS denies direct anonymous table/bucket access; only Edge Functions use the service-role key. Public shop metadata may be read, but test orders and document objects are never publicly readable.

Use narrowly scoped database functions/transactions for idempotent order transitions and final payment/queue state changes. The test queue is derived from `test_orders`; do not insert test orders into `pilot_applications`.

## Edge Function and customer flow

Deploy these functions only to `smlgvtplfifnryhkqspv`:

- `test-shop-profile`: returns safe active test-shop metadata for the staging customer app.
- `test-create-order`: validates the shop, request shape, file metadata and idempotency key; recalculates the quote from stored rates; creates an expiring pending order and returns a one-order upload capability.
- `test-confirm-upload`: verifies the uploaded object belongs to that pending order, checks size/type, and records the object path. The browser uploads with a short-lived signed **upload** token to the private bucket; no download URL is returned.
- `test-create-payment-order`: creates a Razorpay order using only server-side Test Mode credentials after upload validation. Persist the Razorpay order mapping before checkout.
- `test-verify-payment`: verifies the Checkout HMAC, fetches the payment from Razorpay, and checks captured status, gateway order, amount, currency, expiry, and stored order mapping. Only a valid captured payment may transition to the test queue.
- `test-razorpay-webhook`: disables JWT gateway verification only for this webhook endpoint; verifies the raw-body HMAC with the webhook secret, checks order/amount/currency/expiry, deduplicates event IDs, and makes repeated deliveries idempotent.
- `test-workstation-orders`: requires a Supabase Auth user with active membership and returns only that shop’s verified test orders.
- `test-workstation-document`: requires the same authorization, fetches the matching object server-side, and streams bytes to the authenticated EXE with `Cache-Control: no-store`; never returns a Storage URL.
- `test-cleanup`: authorized manual cleanup of records and objects past the seven-day retention deadline.

Use `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` only in the test project’s Edge Function secret store. Do not commit or print values. Missing credentials, mismatched signatures/amounts, failed payments, expired orders, duplicate events, and ambiguous gateway responses fail closed and never enqueue. A captured payment discovered after local expiry is recorded for reconciliation and is not queued.

In the staging customer flow, upload the document before requesting the gateway order. Pass the Razorpay payment ID, order ID, and signature to `test-verify-payment`; the UI must not claim success or create an order based solely on the browser callback. Preserve the existing first-pass limit of one PDF/JPG/JPEG/PNG file up to 2.5 MB.

## Staging workstation and document safety

- Add a separate test build configuration targeting the test Supabase URL and public anon key. It uses Supabase Auth credentials for a test operator and the membership table above; it must not fall back to the production URL/key or query `pilot_applications`.
- The EXE fetches queue data through `test-workstation-orders` and previews a selected document through the authenticated streaming function. Preview bytes stay in memory and are discarded when the preview closes.
- Show an unmistakable `TEST MODE — PRINTING DISABLED` banner. Hide/disable approve-and-print, direct print, print-again, automatic-print, printer discovery, and all other native printer operations.
- Add a Cargo `test-mode` build feature that excludes physical printer implementations/commands (or replaces them with hard failure stubs) in the test binary. Frontend guards alone are insufficient. Add Rust tests proving native print commands cannot reach printer code in that feature.
- Build the staging customer app to a separate output directory and use a separate `wrangler.staging.jsonc` Worker name. Do not change `wrangler.jsonc`, overwrite `dist`, deploy to the existing public hostname, or copy the test EXE into production downloads.

## Local implementation prepared

- `supabase/config.staging.toml` targets only `smlgvtplfifnryhkqspv`; only the Razorpay webhook disables JWT verification.
- Test Edge Functions implement the order, signed private upload, upload validation, Razorpay order, browser HMAC/payment lookup, webhook, authenticated workstation queue/document stream, and manual cleanup flows.
- The customer app uses `vite.staging.config.ts` and `dist-staging/`; its build requires a JWT anon key whose `ref` and the Supabase URL both identify the test project. The staging root opens the fixed `test-print-shop` customer route.
- The desktop test app uses a separate Vite/Tauri config and `dist-test/`. The `test-mode` Rust feature does not compile the printer module and registers only hard-failing printer discovery/print stubs.
- Both environment example files contain no key values. No local staging env file, Supabase secret, Auth account, or remote schema preflight has been created.
- Focused local validation passed: 7 Node tests, root customer type-check, Edge Function TypeScript check, both Vite staging builds, 15 normal Rust tests, and 6 print-disabled Rust tests. Staging builds used a nonfunctional placeholder JWT and were removed after artifact scans confirmed no production Supabase target or printer command strings.
- The desktop workspace TypeScript check still reports existing errors in its production/admin code. No Supabase CLI, Deno runtime, or remote project preflight was available; the migration and Edge Functions have not been applied or exercised remotely.
- No staging installer/EXE was produced: the actual test-project anon key and workstation Auth account are not configured, and the remote review/deployment gate remains closed.

## Staging configuration and secrets

Use ignored local environment files for staging builds, never overwrite `.env`:

- Customer build: copy `.env.staging.example` to ignored `.env.staging.local`; set `VITE_PRINTBOT_TEST_MODE=true`, the test project URL, its public anon key, and fixed test-shop slug.
- Workstation build: copy `apps/desktop/.env.staging.example` to ignored `apps/desktop/.env.staging.local`; set the same test project URL/anon key and test-mode flag; no service-role or Razorpay secret.
- Keep Razorpay credentials exclusively in Supabase Edge Function secrets. Configure the Razorpay Test Mode webhook to the test project’s webhook function URL and subscribe only to the required payment events.
- Create a test Auth operator in the test project and add its user ID to the test-shop membership table. Do not reuse production workstation credentials.

Local staging outputs are separate: `pnpm build:staging` writes `dist-staging/`; the desktop staging Tauri build writes a distinctly identified test installer and EXE. `wrangler.staging.jsonc` targets a separate workers.dev Worker. None of these staging builds deploys or overwrites production.

No Supabase/Cloudflare plan upgrades, paid scheduler, or new paid service are included. If a feature requires a paid upgrade, stop and ask for approval.

## Validation and release gate

Local tests must cover quote amount, idempotency, upload token scoping, private bucket access, checkout HMAC, webhook HMAC, duplicate webhook, wrong order/amount/currency, expiry, failed/canceled payment, unauthorized/cross-shop workstation access, document preview authorization, seven-day cleanup, and test-mode native print refusal.

End-to-end acceptance in the isolated environment:

1. Staging customer uploads a synthetic supported document and starts a Razorpay Test Mode checkout.
2. The backend verifies captured payment and only then makes the order visible to the authorized test workstation.
3. The workstation previews the document through the authenticated stream.
4. Cancelled, failed, forged, duplicate, expired, or mismatched payments never enter the queue.
5. The test EXE cannot discover or call native printers, including automatic-print paths.

**Deployment is not authorized by this plan.** After review and explicit approval, configure secrets privately, run the read-only test-project schema preflight, apply the additive migration to the exact test project ref, deploy only the listed functions to that ref, and deploy the separate staging Worker. Build/share the test EXE only after the test project’s public anon key and operator account are configured. Do not run any of these commands before approval.
