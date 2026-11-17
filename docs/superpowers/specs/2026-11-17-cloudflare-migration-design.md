# Cloudflare Migration Design

**Status:** Superseded: Cloudflare hosts the website; Supabase remains the database and file storage
**Date:** 2026-11-17

> **Current scope:** Cloudflare hosts the website; Supabase remains the database and file provider, and R2 was declined. The user now wants orders, uploaded files, shop data, licenses, and applications persisted in Supabase. The approved design uses Supabase Edge Functions for protected data access while retaining the existing Vite apps and shop-license login; no D1, R2, or new Supabase Auth accounts. See [the data-persistence design](./2026-11-17-supabase-data-persistence-design.md). Inspect the live schema and verify a backup before any SQL changes. Keep Vercel and Supabase active until flows are validated. Sections below document the earlier full-backend proposal and are deferred.

## Understanding summary

- Move Print Bot's online applications and services from Vercel and Supabase to Cloudflare.
- The user clarified that there is no real production data and approved starting with an empty Cloudflare database.
- Keep the Windows workstation installed locally; update it to use the new cloud API.
- Preserve current product behavior, tenant isolation, private document handling, and payment verification.
- Allow a short outage for the final switch if needed.
- Use the existing Cloudflare Workers URL; do not buy a custom domain or change nameservers.

## Assumptions and open questions

- "Everything" means cloud-hosted application services, not the locally installed Windows workstation.
- Razorpay and any external email provider remain separate integrations.
- Start with a small launch and scale as needed; actual request volumes and data sizes are not yet known.
- A paid Cloudflare plan is acceptable if required by measured capacity or traffic.
- The provided pasted-text attachment could not be accessed. This design reflects the requirements confirmed in chat.
- The migration inventory must determine all active data sources, Supabase tables/functions/files, and whether Supabase Auth is in use. No Supabase Auth calls were found in the inspected client files.
- The current API keeps some order and asset state in process memory, while client apps use Supabase tables, RPCs, and Realtime. The Cloudflare implementation must define D1 as the durable source of truth and replace those direct client paths with server-authorized API operations.
- The target public URL is `https://printbotak.callofduty12mobile18.workers.dev`, shown in the user's Cloudflare dashboard.
- The dashboard screenshot reports that the latest build failed. Inspect its build log and confirm how the Worker is connected to this repository before using it.
- Verify Supabase contains no real records or stored files before disconnecting it, and keep a protected snapshot until the new system is confirmed.
- The current Supabase/object-storage contents and Cloudflare budget still need to be checked; "no real data" does not mean the old project is safe to delete without inspection.

## Proposed architecture

- **Public URL:** Use the existing `workers.dev` address as the public entry point. No custom domain or nameserver change is required. Test how both Vite sites and the API can be routed through this Worker.
- **Websites:** Deploy the root marketing site and standalone customer site on Cloudflare, using the existing Worker URL as the main entry point if routing allows. Keep the desktop UI build local to the installed workstation.
- **Initial root-site deployment:** The root Vite build outputs to `dist/`. An assets-only Wrangler configuration targets that output and enables SPA routing, avoiding automatic app detection at the pnpm workspace root. This does not migrate the API or replace Supabase.
- **API:** First test the existing FastAPI service on Cloudflare Python Workers. Cloudflare documents FastAPI support, but its current Python Worker setup requires Python 3.13 or newer and supports pure Python/PyEmscripten packages. The repository currently targets Python 3.11 and uses FastAPI, Pydantic, Pillow, and pypdf. Validate the actual dependency set and runtime behavior before selecting this architecture for production.
- **Relational data:** Use Cloudflare D1 only if an inventory and load test confirm it fits. D1 uses SQLite rather than PostgreSQL; PostgreSQL schemas, migrations, queries, and Supabase SQL functions must be converted. The Worker/API must enforce tenant authorization for every data operation.
- **Client integrations:** Replace direct Supabase table operations, license RPC calls, and Realtime subscriptions in both customer-web entry points and the desktop client. The API must derive tenant identity from a validated session or authenticated membership, not a client-supplied shop identifier or URL slug.
- **Files:** Store private customer documents and installer downloads in Cloudflare R2. Keep customer documents private and grant access only through authenticated API operations or short-lived authorized links.
- **Background jobs:** Replace local-path/in-memory document processing with Cloudflare Queues or Workflows. Jobs should identify R2 objects, be tenant-bound and idempotent, and handle retries without duplicating orders or processing.
- **External integrations:** Keep Razorpay and any existing email provider; store their credentials as server-side Cloudflare secrets.

If Python Workers cannot reliably support a required package or workflow, stop before production migration and revisit the backend choice. The TypeScript Worker rewrite is the agreed fallback, not an automatic scope expansion.

### Cloudflare capacity gates

Cloudflare currently documents D1 limits of 500 MB per database on the Free plan and 10 GB per database on the Paid plan. D1 also has a 2 MB maximum row size. Large documents belong in R2, not D1. Measure the source database and test expected query/write load before provisioning or importing production data. If one D1 database cannot safely meet the measured need, pause and revise the database design.

## Data migration and cutover

1. Inventory all production data sources, Supabase tables and SQL functions, stored files, and application records. Confirm there is no real production data and create a protected source snapshot before any disconnection.
2. Convert the schema and license operations for D1/API, then provision a fresh database and storage bucket. Do not copy records or files unless the inventory finds data the user has not approved discarding.
3. Verify the fresh target schema, license/device operations, tenant boundaries, and representative document access. If real records or files are found, stop and ask whether to preserve them before proceeding.
4. Test customer ordering, shop operations, payment webhooks, workstation licensing, and document uploads in a non-production Cloudflare environment.
5. During the agreed short outage, stop writes, deploy to the existing `workers.dev` URL, and run production smoke checks before sending users to it. No DNS or nameserver change is needed.
6. Keep Vercel and Supabase available and read-only through validation. Do not delete either service before explicit verification. A rollback before new Cloudflare writes can switch traffic back; after accepting writes, rollback requires reconciling those new records and files.
7. After Cloudflare is confirmed stable, remove the Vercel deployment integration, Supabase client calls/configuration, and obsolete credentials, then retire the old projects.

## Security, reliability, and acceptance checks

- No browser or desktop client receives privileged database, storage, payment, or signing secrets.
- Every customer/shop/device operation is authorized against server-derived tenant identity. Customer files remain private and tenant/owner scoped.
- Preserve signed payment-webhook verification, idempotency, audit behavior, and print safety. The workstation continues to reject cross-shop operations and never automatically reprints ambiguous jobs.
- Back up source data before migration and verify that backups can be restored. Keep migration output and reconciliation totals for audit.
- Confirm all required Python packages work on Cloudflare Python Workers, including the actual document scan/preview path.
- Confirm order, asset, license, and shop state persists in D1 across Worker restarts; confirm Supabase Realtime behavior has an authorized Cloudflare-compatible replacement.
- Confirm no unapproved production rows or files will be discarded; test cross-tenant access denial and all critical user flows using test data.
- Confirm D1 storage/query capacity and Cloudflare request/upload limits against measured production data and expected usage.
- Do not send users to the new URL until the compatibility, security, migration, and end-to-end gates pass.
- Do not shut down Vercel or Supabase until the Cloudflare deployment is confirmed stable.

## Decision log

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Move cloud-hosted web, API, database, file, and job services to Cloudflare; keep the workstation local. | Move only the websites; move the desktop application into cloud hosting. | The user confirmed all online services should move; the workstation must remain installed at each print shop. |
| Test Python Workers and retain most FastAPI logic first. | Rewrite the API in TypeScript immediately. | Reuses existing Python business logic; Cloudflare documents FastAPI support. Runtime/package compatibility remains a hard gate. |
| Use D1, R2, and Queues/Workflows as the Cloudflare-native data, file, and job services, subject to capacity and compatibility checks. | Keep Supabase or external storage/queue/database. | Meets the all-Cloudflare requirement; D1's SQLite semantics and size limits require a verified migration. |
| Use the existing `workers.dev` URL without buying a domain or changing nameservers. | Buy a custom domain before launch. | The user chose the URL already shown in their Cloudflare account. |
| Start with an empty Cloudflare database and allow a short maintenance outage; verify and snapshot Supabase before disconnecting. | Copy all existing records; require zero downtime. | The user clarified that no real production data exists and approved a fresh start; the source still must be checked before retirement. |
| Keep Vercel/Supabase available until validation, then retire them. | Delete the old services before cutover or immediately at cutover. | Preserves a safer rollback path and avoids premature loss of source data. |
| Keep Razorpay and any external email service. | Replace unrelated payment/email providers as part of this migration. | The request targets Vercel and Supabase; replacing other providers would expand scope. |
| Use a paid Cloudflare plan if measured capacity or traffic requires it. | Restrict migration to free-tier limits. | The user approved a paid plan if needed; actual capacity is not yet measured. |
| Keep Supabase as the app database and customer-file storage; do not enable R2 or migrate the backend now. | Move database and files to D1/R2. | The user declined R2 subscription and explicitly chose to keep Supabase data and files. |

## References

- [Cloudflare Python Workers](https://developers.cloudflare.com/workers/languages/python/)
- [Cloudflare Python package support](https://developers.cloudflare.com/workers/languages/python/packages/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/)
- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- [Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/)
