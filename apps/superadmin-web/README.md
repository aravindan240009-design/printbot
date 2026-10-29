# SuperAdmin Web Portal (`@xerox/superadmin-web`)

Platform owner and super-administrator management portal for **Print Bot**. Used to manage tenant shops, review and approve pilot applications, issue authentic license keys, handle subscriptions, and broadcast platform-wide announcements.

---

## 🚀 How to Run Locally

Run from the monorepo root:
```powershell
pnpm --filter @xerox/superadmin-web dev
```

Or navigate directly to this folder:
```powershell
cd "apps/superadmin-web"
pnpm dev
```

* **Localhost URL:** [http://localhost:3002](http://localhost:3002)
* **Default Port:** `3002`

---

## 🛠️ Build & Typecheck

```powershell
# Build for production
pnpm --filter @xerox/superadmin-web build

# Run TypeScript typecheck
pnpm --filter @xerox/superadmin-web type-check
```

---

## ✨ Features

- **Shop Application Approvals**: Review pilot and commercial subscription applications submitted by independent print shops.
- **License Key Management**: Generate, activate, extend, or revoke cryptographically authentic license keys.
- **Single All-Inclusive Plan**: Manages all-inclusive subscriptions without feature gating or artificial printer limits.
- **Global Broadcasts**: Publish system-wide notices and maintenance bulletins to all connected shop workstation counters.
- **Audit Logging**: Comprehensive, immutable activity logging tracking key issuance, revocations, and system actions.
