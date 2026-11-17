# Supabase Razorpay Checkout Design

**Status:** Approved for implementation planning; implementation not started
**Date:** 2026-11-17

## Understanding summary

- Enable secure Razorpay checkout for customer orders on the existing Cloudflare-hosted customer site.
- Supabase Edge Functions are the server-side boundary; do not deploy the current mock/in-memory FastAPI payment path as production checkout.
- Customers continue using the existing guest checkout and order-tracking experience; do not add customer accounts.
- The server recalculates the total from the active shop's stored rates and verifies payment before an order can enter the existing print/dispatch flow.
- Supabase stores the authoritative order and payment state. The workstation continues showing the same shop queue, but accesses it through authenticated functions rather than public writes.
- Begin with Razorpay Test Mode. Do not enable live charges until end-to-end verification and explicit approval.
- Preserve existing shop/application records and do not apply draft migrations blindly.

## Assumptions

- The pilot remains approximately 10 shops and 100 orders per day.
- Razorpay Test Mode credentials will be entered by the user in Supabase server-side secrets; no secrets are shared in chat or added to Vite variables.
- Existing device credentials can authenticate workstation queue requests; the implementation must verify the exact current token-validation path.
- Customer tracking can use an unguessable capability token without requiring Supabase Auth.
- A failed database, Razorpay, or verification request must leave the order unpaid and unqueued.
- Customer documents remain private and are made available only to the authorized shop workstation.

## Decision log

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Use Supabase Edge Functions for payment and protected order operations. | Host the Python API separately; call Razorpay from the browser. | Supabase is already the chosen backend; the existing Python payment provider defaults to mock mode and stores order state in process memory. Browser-side Razorpay secrets are never acceptable. |
| Use dedicated order and payment records. | Treat `pilot_applications` as the payment ledger. | That relation also holds shop/application data and currently has broad client writes in repository migration drafts. Payment state must not be forgeable by the browser. |
| Verify payment on the server and process webhooks idempotently before dispatch. | Trust the browser's checkout success callback. | Browser callbacks can be forged or replayed; verified amount and order identity must match. |
| Preserve the current customer and workstation screens while changing their data access to functions. | Keep direct public writes to queue/payment status. | Existing `ORDER_QUEUED` updates can affect printing and must be authorized. |
| Test with Razorpay Test Mode before Live Mode. | Start with live credentials. | Prevent accidental customer charges during integration work. |
| Inventory and back up the live database before schema writes. | Apply repository migrations without inspection. | The production schema and policies have not been verified, and repository migrations conflict. |

## Architecture

1. **Order creation:** A Supabase Edge Function validates the active shop and supported options, recalculates the amount using server-owned shop rates, creates a durable `AWAITING_PAYMENT` order, and requests a Razorpay order using server-side Test Mode credentials. It returns only the public key ID, Razorpay order ID, amount/currency, and customer-safe order capability.
2. **Payment verification:** The customer completes Razorpay Checkout. A verification function checks the Razorpay signature and confirms the order ID, amount, and currency. A webhook handler verifies Razorpay's webhook signature, deduplicates event IDs, and reconciles delayed or repeated notifications. Only a verified payment can advance the order.
3. **Dispatch:** Verified payments transition according to the existing shop dispatch mode. The workstation retrieves and updates only its shop's queue through Edge Functions that validate its existing device credential. The visible queue and printing behavior remain unchanged.
4. **Tracking:** The customer uses a random capability token to retrieve only that order's status. Do not expose other orders, shop credentials, or permanent public document URLs.
5. **Storage:** Order/payment state is stored in dedicated private tables. Document bytes use private Supabase Storage; the order stores a reference and metadata, not public file contents.

Function names and exact request/response shapes are implementation details to finalize after reviewing the live schema and existing client contracts. The already deployed `quote-order` remains the quote endpoint; order creation must independently recalculate the price rather than trusting a browser-supplied total or quote hash.

## Failure handling and idempotency

- Create-order requests require an idempotency key so retries do not create duplicate orders or Razorpay orders.
- Duplicate payment callbacks and webhooks must not create duplicate payment records or dispatch twice.
- Invalid signatures, mismatched amounts/currency, canceled payments, inactive shops, and database failures leave the order unpaid and unqueued.
- The UI displays an explicit failure and provides a safe retry path; never report payment success before server verification.
- If Razorpay is unavailable after an order is stored, retain its pending state and allow safe reconciliation or retry.

## Rollout and testing

1. Run a read-only inventory of production tables/views, constraints, RLS/grants, functions, realtime publication, and Storage buckets. Do not read customer document contents.
2. Confirm a restorable backup. Reconcile the inventory with the draft migrations and existing `pilot_applications` data. Prepare only reviewed, additive migrations; do not run `*_down.sql` or competing initial schemas.
3. Implement and test the new schema/functions locally or against isolated test data. Confirm device-token validation and private document handoff before changing the workstation client.
4. Add Razorpay Test Mode secrets in Supabase. Deploy the functions and compatible clients; do not deploy Live Mode keys.
5. Test successful payment, cancellation, invalid signature, wrong amount, duplicate callback/webhook, gateway timeout, inactive shop, customer isolation, cross-shop isolation, and workstation queue handoff.
6. Only after these pass, obtain explicit approval before configuring Live Mode keys and accepting real payments.

The customer site may currently have been built with the placeholder `VITE_API_BASE_URL`. Remove that placeholder when switching the customer flow to Supabase functions; do not publish a fake API hostname.

## Security and privacy

- Keep Razorpay key secrets, webhook secrets, and the Supabase service-role key exclusively in server-side Supabase secrets.
- Do not allow the anonymous browser role to set payment status, verified amount, or queued status.
- Validate the shop and device identity server-side; never trust a client-supplied shop ID or status.
- Store only required payment references and status; never store card data.
- Restrict customer tracking to an unguessable order capability and restrict workstation access to its licensed shop.
- Keep uploaded documents private and avoid placing document bytes or unnecessary personal data in public-readable application notes.
- Add rate limits and request-size limits appropriate for the small pilot.

## Non-goals

- No new customer accounts or Supabase Auth migration.
- No change to dispatch-mode semantics or the workstation queue UI.
- No changes to desktop subscriptions or administrator billing.
- No production Live Mode payment until the user explicitly approves after Test Mode acceptance.

## Unresolved preconditions

- Actual live tables, RLS policies, grants, triggers, and Storage setup have not been inspected.
- The current `pilot_applications` data and production backup/restore status have not been confirmed.
- The existing device-token validation path and exact workstation file handoff must be traced before client changes.
- Confirm which Razorpay Test Mode account/key set the user will configure in Supabase; the secret itself must remain private.
