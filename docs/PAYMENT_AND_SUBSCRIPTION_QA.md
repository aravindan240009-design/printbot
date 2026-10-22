# Payment & Subscription QA Verification Report

## 1. Dual Financial System Separation
A foundational requirement of the Print Bot platform is the strict separation between the **Platform Subscription Billing Engine** and the **Customer Printing Payment Escrow**.

```mermaid
graph TD
    subgraph System A: SaaS Subscription Billing
        ShopOwner["Xerox Shop Owner"] -->|₹999/mo or ₹9,990/yr| PlatformPayment["Print Bot Platform Billing"]
        PlatformPayment --> PlatformLedger["Platform SaaS Subscription Ledger"]
        PlatformPayment --> GSTInvoice["18% GST Tax Invoice (SAC 998313)"]
    end

    subgraph System B: Customer Printing Payments
        WalkinCustomer["Shop Customer (Guest)"] -->|Print Order Payment (UPI / Cash)| MerchantEscrow["Independent Shop Merchant Account"]
        MerchantEscrow --> ShopEscrowLedger["Shop Printing Escrow Ledger"]
        MerchantEscrow --> ShopReceipt["Customer HMAC Signed Receipt"]
    end
```

**Financial Isolation Guarantees**:
- The platform owner never takes a per-page commission from customer print fees.
- Customer printing payments never flow into the SaaS subscription account.
- Each shop owner independently connects their own merchant credentials (Razorpay Key ID/Secret or local cash register).
- A shop's customer payment failures never impact another shop's accounts.

---

## 2. Platform SaaS Subscription Model & Verification

| Business Rule | Architectural Implementation | Verification Evidence | Status |
| :--- | :--- | :--- | :--- |
| **Exactly ONE Plan** | Single plan `ALL_INCLUSIVE` (₹999/mo or ₹9,990/yr). No Starter/Pro/Business tiers. | `services/api/services/subscription_service.py` | `VERIFIED` |
| **Unlimited Printers** | Zero printer count caps. Every active subscription supports infinite devices. | `crates/print_agent/src/printer_adapter.rs` | `VERIFIED` |
| **Zero Feature Gates** | Booklet, poster tiling, timed Xerox, all studio features included in one plan. | `services/api/routers/studio.py` | `VERIFIED` |
| **GST Tax Invoicing** | 18% GST calculated based on shop state (Intra-state: CGST 9% + SGST 9%; Inter-state: IGST 18%). SAC code 998313. | `services/api/services/superadmin_service.py` | `VERIFIED` |
| **Dunning & Grace** | Automated retry on renewal failure, 7-day grace period, followed by safe suspension. | `services/api/services/dunning.py` | `VERIFIED` |
| **In-Flight Order Safety** | If a subscription expires or suspends, pre-existing paid orders can still be printed or refunded. | `test_scenario_i_subscription_expiry_and_in_flight_order_safety` | `VERIFIED` |

---

## 3. Customer Printing Payment Safety & Webhook Verification

### 1. Zero Trust on Browser Callbacks
**STRICT SECURITY INVARIANT**:
When a customer pays via UPI or card, the browser redirect callback (`/api/v1/orders/{id}/callback`) **never marks the order paid**.
The callback returns `server_authoritative: True` and inspects the true backend status. An order is ONLY marked paid when a cryptographically signed server-to-server webhook is verified.

### 2. Webhook Signature & Anti-Replay Verification
Webhooks are verified using HMAC-SHA256:
- Secret: Shop's configured merchant webhook secret.
- Timestamp Window: `X-Timestamp` must be within 300 seconds of server time.
- Idempotency Key: `event_id` is recorded in `idempotency_store`. Duplicate webhook deliveries return the cached response with zero duplicate ledger entries or duplicate print dispatches.

### 3. Dual Shop Operating Modes
- **Mode A (`FULL_AUTOMATIC`)**: When a signed payment webhook is verified, the order immediately dispatches to `QUEUED` if an authorized workstation is online.
- **Mode B (`MANUAL_APPROVAL`)**: When a signed payment webhook is verified, the order holds in `AWAITING_APPROVAL`. Printing never starts until staff explicitly clicks `Approve`.

---

## 4. Test Evidence Summary

```text
tests/phase4/test_payment_provider_and_gateways.py .....                 [PASSED]
tests/phase4/test_shop_modes_and_automatic_dispatch.py ......            [PASSED]
tests/phase4/test_state_machine_and_cancellation_safety.py ....          [PASSED]
tests/phase8/test_enterprise_integration_and_hardening.py::test_scenario_a_normal_automatic_print_journey [PASSED]
tests/phase8/test_enterprise_integration_and_hardening.py::test_scenario_b_manual_approval_workflow [PASSED]
tests/test_payment_idempotency.py .                                      [PASSED]
```

## 5. Deployment Pre-Requisites for Live Payments
- **Mock Provider**: Fully operational for local development, staging, and automated CI tests.
- **Production Razorpay**: Adapter implemented. Commercial launch requires registering a real Razorpay merchant account, generating API Keys & Webhook Secret, and configuring them in the shop admin dashboard.
