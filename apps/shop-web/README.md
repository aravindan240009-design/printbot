# Shop Web Portal (`@xerox/shop-web`)

Web management portal for Xerox and print-shop owners, managers, and counter operators. Staff use this interface to monitor incoming customer print jobs, approve orders, manage queue status, and configure shop pricing.

---

## 🚀 How to Run Locally

Run from the monorepo root:
```powershell
pnpm --filter @xerox/shop-web dev
```

Or navigate directly to this folder:
```powershell
cd "apps/shop-web"
pnpm dev
```

* **Localhost URL:** [http://localhost:3001](http://localhost:3001)
* **Default Port:** `3001`

---

## 🛠️ Build & Typecheck

```powershell
# Build for production
pnpm --filter @xerox/shop-web build

# Run TypeScript typecheck
pnpm --filter @xerox/shop-web type-check
```

---

## ✨ Features

- **Live Print Queue**: Real-time list of pending, printing, and completed print orders submitted by walk-in customers.
- **Job Approval Workflow**:
  - `MANUAL_APPROVAL`: Operator inspects, accepts, or rejects customer print submissions.
  - `FULL_AUTOMATIC`: Eligible paid jobs pass through directly to printing queues without counter intervention.
- **Cash Reconciliation**: Confirm receipt of counter cash payments before releasing print jobs to the spooler.
- **Live Rate Configuration**: Adjust per-page rates for Black & White and Color printing, plus duplex discounts and finishing charges.
- **Multi-Tenant Shop Scoping**: All orders, queues, settings, and logs belong strictly to the authenticated `shop_id`.
