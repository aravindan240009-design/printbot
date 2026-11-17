# Supabase Data Persistence Design

**Status:** Approved design; implementation not started
**Date:** 2026-11-17

This design refines the Cloudflare migration scope: Cloudflare hosts the Vite website, while Supabase remains the database and customer-file provider.

## Understanding summary

- Persist and retrieve orders, uploaded documents, shop profiles/rates/services, licenses/devices, and applications through Supabase.
- Keep the existing Vite applications and the current shop-license login. Do not add Supabase Auth accounts.
- Use a small-pilot target of up to 10 shops and about 100 orders per day.
- Customers can access only their own orders/files; each shop can access only its own records; the Super Admin can access all shops.
- Keep uploaded files until a shop owner or Super Admin explicitly deletes them.
- If Supabase is unavailable, stop new writes and show a failure; do not claim success or queue orders offline.
- Manage database changes through reviewed, ordered, versioned migrations.

## Assumptions

- Customer document bytes are stored in a private Supabase Storage bucket; Postgres stores file metadata and ownership.
- Payment records contain transaction status and references only, not payment-provider secrets or card details.
- Existing production records and files must be preserved.
- The previous choice to keep Supabase data/files does not authorize running the existing SQL files as one batch.
- The earlier answer “both” was clarified as data persistence, not adding user sign-in accounts.

## Decision log

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Keep Supabase Postgres and Storage as the source of truth. | Move data and files to Cloudflare D1/R2. | The user chose to keep Supabase and declined R2 billing. |
| Use Supabase Edge Functions for protected database and Storage operations. | Direct browser writes using the public anon key; a Cloudflare Worker API. | The current custom login is not Supabase Auth, so direct client requests cannot reliably prove shop/admin identity. The user selected Edge Functions. |
| Keep the current shop-license login; do not add Supabase Auth accounts. | Add Supabase Auth for staff and customers. | The user clarified the goal is saving and retrieving data, not account login. |
| Keep customer orders, shop records, licenses/devices, and applications separated by shop. | Allow broad public or cross-shop reads. | The user's requested tenant access rule. |
| Keep uploaded documents until an authorized shop owner or Super Admin deletes them. | Automatic expiry after a fixed period. | The user chose manual deletion. |
| Fail new writes visibly when Supabase is unavailable. | Queue writes locally for later synchronization. | Prevents false success and uncertain duplicate/order state. |
| Inspect the existing database and back it up before schema changes. | Run every SQL file immediately in the production editor. | The current schema is unknown, the project reports existing database usage, and the repository contains conflicting/destructive scripts. |

## Architecture

The Vite clients retain only the public Supabase client for safe public reads. Privileged and tenant-bound operations go through Supabase Edge Functions. Functions validate the existing station license, administrator credentials, or customer order capability token before accessing Postgres or Storage. The Supabase service-role key remains server-side and must never be embedded in Vite environment variables or desktop assets.

Postgres stores order, shop, license/device, application, and file-metadata records. Customer documents are stored as private objects in Supabase Storage. Functions return only the data the caller is allowed to see. Short-lived signed URLs or equivalent function-mediated access are used for file transfers. Row-Level Security remains enabled as defense in depth; the public anon role receives no broad access to private records.

The existing Vite applications remain on Cloudflare. No Next.js server helpers, `next/headers`, or Next.js middleware are introduced.

## Data flow and failure behavior

1. A customer submits an order to an Edge Function. The function validates the shop/request, stores the order, and reports success only after the database confirms it.
2. Requests carry an idempotency key so a retry cannot create a duplicate order.
3. The customer uploads the document through a short-lived authorized path to private Storage. The database records the object path, shop/order relationship, and metadata.
4. The licensed shop workstation reads or updates only its shop's records through functions. Administrative actions are authorized server-side.
5. A customer can retrieve only their own order and files using the order capability token. A shop owner can access only that shop's records. Super Admin operations are separately authorized.
6. If Supabase is unavailable, the client displays that the operation failed and does not report a saved order. No offline order queue is introduced.
7. An authorized shop owner or Super Admin explicitly deletes uploaded files. Automatic deletion is not enabled under this design.

## Schema and rollout plan

1. Run a read-only inventory of the live schema, policies, functions, Storage buckets, and aggregate row counts. Do not read or export customer document contents for this inventory.
2. Create and verify a restorable backup before any write.
3. Reconcile existing application queries with the live schema. Prepare small, ordered, additive migrations that preserve existing records.
4. Deploy Edge Functions and test them against non-production data before switching clients.
5. Switch one data flow at a time; retain the current deployment and rollback path until order, shop, license, and file checks pass.
6. Remove direct client access only after the corresponding function is deployed and validated.

Do not run rollback files (`*_down.sql`) as setup. Do not run both `001_initial_schema.sql` and `001_phase1_schema.sql` as competing initial schemas. The phase-1 script renames `pilot_applications` and replaces it with a view, while existing clients still write to that relation. The station-license migration sets every license's device limit to one. These effects must not be applied without schema/data reconciliation and explicit review.

## Security and privacy

- Never put a Supabase service-role key or other privileged secret in a `VITE_*` variable, source file, or desktop bundle.
- Validate the caller and shop ownership in every function; do not trust a client-supplied shop ID or slug alone.
- Keep customer documents private; do not return permanent public URLs.
- Do not log license keys, customer file contents, or unnecessary personal data.
- Do not expose secrets in error messages; report database failures clearly without success-shaped fallbacks.
- Manual file retention means documents can remain indefinitely unless deleted. The shop owner/Super Admin deletion flow must be tested and documented.

## Acceptance checks

- Orders, status changes, shop records, licenses/devices, and applications survive page reloads, app restarts, and service restarts.
- A retry of an order request does not create duplicates.
- A customer cannot read another customer's order/file.
- A shop cannot read or modify another shop's records.
- Unauthorized callers cannot perform Super Admin or license operations.
- Authorized deletion removes the private Storage object and its metadata safely.
- Supabase outages do not produce a false saved state.
- The service-role key is absent from built Vite and desktop assets.
- Existing production data remains intact after migration and rollback checks.

## Preconditions and unresolved facts

- The Supabase dashboard showed an active service-issue notice during the initial attempt to inspect the project. Its Table Editor did not show tables, while the project overview reported 33 MB of database usage. The actual live schema, row counts, Storage buckets, and policies remain unverified.
- Confirm backup and restore capability before the first schema write.
- Confirm the license-pepper secret required by the existing license functions is configured; never place it in client settings or SQL literals.
- No migration or function deployment has been run under this design.
