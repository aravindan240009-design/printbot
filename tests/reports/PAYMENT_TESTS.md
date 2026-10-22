# Payment and Financial Systems Test Report

## 1. Dual Segregated Financial Flows
The Print Bot platform strictly segregates SaaS subscription revenue from shop-owner customer printing revenue. These two flows never intermingle:

1. **Flow A (Shop Subscription)**: Independent Xerox Shop Owner $\rightarrow$ Print Bot Platform Owner (₹999/month or ₹9,990/year for software access, unlimited printers, zero commissions).
2. **Flow B (Customer Printing Payment)**: Walk-in Customer $\rightarrow$ Independent Xerox Shop Owner (Customer pays for paper and toner per shop-defined pricing catalogue).

---

## 2. Payment Gateway Verification Matrix

Automated verification executed via `tests/test_payment_idempotency.py` and `tests/phase4/test_payment_provider_and_gateways.py`:

| Test ID | Financial Scenario | Target Provider | Action / Payload | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **PAY-001** | Standard Mock UPI Payment | OSS `MockPaymentProvider` | Customer creates order and simulates instant UPI pay | Order transitions from `AWAITING_PAYMENT` to `PAID` | Order verified and paid | **PASS** |
| **PAY-002** | Signed HMAC Webhook Verification | Razorpay Adapter | Post webhook with valid `X-Razorpay-Signature` HMAC | Server verifies cryptographic signature, processes capture | Signature verified; order paid | **PASS** |
| **PAY-003** | Invalid Webhook Signature Tampering | Razorpay Adapter | Post webhook with altered payload / bad HMAC | Webhook rejected with `400 Bad Request`; order unchanged | Tampered webhook blocked | **PASS** |
| **PAY-004** | Webhook Replay & Duplicate Delivery | OSS & Razorpay | Send identical webhook ID `evt_12345` multiple times | Idempotency store catches duplicates; returns cached 200 without duplicate credit | Replay safe (1 processing) | **PASS** |
| **PAY-005** | Browser Redirect Payment Claim | Client Browser | Browser callback attempts to mark order paid | Backend ignores browser claim; remains `AWAITING_PAYMENT` | Unverified browser claim rejected | **PASS** |
| **PAY-006** | Payment Timeout & Safe Expiry | Billing Engine | Payment intent abandoned for > 30 minutes | Order status transitions to `EXPIRED`; reserved resources freed | Expired safely | **PASS** |
| **PAY-007** | Out-of-Order Webhook Delivery | Razorpay Adapter | `payment.failed` arrives before `payment.created` | State machine queues or rejects invalid backward transition | State machine preserved | **PASS** |
| **PAY-008** | Order Cancellation with Full Refund | Escrow Ledger | Customer cancels before spool submission | Ledger issues refund intent; order marked `REFUNDED` | Escrow ledger balanced | **PASS** |
| **PAY-009** | Shop Subscription Invoicing | SaaS Billing Adapter | Monthly billing cycle renewal at ₹999 | Tax invoice generated with SAC code `998313` | GST tax invoice generated | **PASS** |
| **PAY-010** | Dunning & Failed Subscription Grace | SaaS Billing Adapter | Card declined on subscription renewal | Enters 7-day grace period; prints continue; alerts issued | Grace period active | **PASS** |
| **PAY-011** | In-Flight Job Safety on Subscription Expiry | Queue Engine | Subscription expires while customer order in queue | Existing paid orders allowed to complete; new orders blocked | Zero stranded paid orders | **PASS** |
| **PAY-012** | Partial Refund on Disrupted Print | Escrow Ledger | 5 of 10 pages jammed; operator reconciles partial | Partial refund issued for unprinted sheets | Exact paise refund recorded | **PASS** |

---

## 3. Idempotency & Replay Defense
- **Unique Event Deduplication**: Every incoming webhook identifier (`event_id`) is cached in the persistent idempotency store with an atomic lock.
- **HMAC SHA-256 Validation**: Webhooks received on `/api/v1/webhooks/payments` compute `hmac.new(webhook_secret, payload, hashlib.sha256).hexdigest()`. Timing attacks are prevented using constant-time string comparison (`hmac.compare_digest`).

---

## 4. Financial Audit & Release Gate
- **Simulator & Sandboxed Testing**: **100% PASSED**.
- **Live Settlement Gate**: **BLOCKED/UNVERIFIED (HARDWARE PENDING)**. Real money transfers via live production bank rails require merchant bank KYC authorization and live gateway credentials.
