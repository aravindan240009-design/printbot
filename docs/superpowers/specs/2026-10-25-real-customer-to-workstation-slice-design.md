# Real Customer-to-Workstation Slice

## Intent

Move Print Bot from browser-only simulation to the first real, durable workflow: one shop can publish a shop-bound customer entry point, a customer can submit a supported document, the server can validate and quote it, a mock payment can be verified, staff can approve the job, and a paired workstation can claim and report the job.

## Scope

This slice supports one shop, manual approval mode, mock payment, supported PDF/image inputs, one workstation, and a virtual printer/agent profile. It establishes the production interfaces needed for real hardware without claiming physical completion. Full automatic mode, live settlement, office conversion breadth, bookings, and multi-printer certification are later slices.

## Non-negotiable behavior

- `shop_id` comes from authenticated staff, paired device credentials, or a signed shop-bound guest session; never from an unchecked customer body/query field.
- Every persisted object and storage key is shop-scoped.
- The server owns page counts, capabilities, prices, payment state, and the immutable `PrintPlan`.
- Payment is verified server-side and idempotently.
- Manual approval is required after verified payment.
- A workstation can only claim jobs belonging to its paired shop.
- Ambiguous print outcomes become `COMPLETION_UNKNOWN`; no automatic reprint.
- Local development uses PostgreSQL/Valkey-compatible services or deterministic adapters and mock payment; no production secrets.

## Architecture

Extend the FastAPI modular monolith with explicit persistence interfaces and PostgreSQL migrations. Use a signed guest session for the customer entry point, private shop-scoped asset paths, durable idempotency, and an outbox/queue boundary for document inspection. Keep the React customer app as a thin client of these APIs. Keep the Rust workstation agent behind a device-authenticated queue API and a durable local journal.

## Delivery order

1. Runtime configuration and database foundation.
2. Authenticated shop/guest/device tenant context.
3. Durable assets, document inspection, PrintPlan quote, and order lifecycle.
4. Mock payment verification and manual approval.
5. Workstation pairing, queue claim, and reconciliation contract.
6. Customer-web integration and browser journey.
7. Local deployment, evidence, and external gates.

## External gates

Real payment settlement, signed installers, TPM assurance, and physical printer paper-delivery certification remain `BLOCKED/UNVERIFIED` until credentials, certificates, hardware, and supervised pilot evidence are supplied.
