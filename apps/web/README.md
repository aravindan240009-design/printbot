# Web Application (`@xerox/web`)

Next.js full-stack web application for **Print Bot**, integrated with workspace contracts, API client, and shared UI design system (`@xerox/ui`).

---

## 🚀 How to Run Locally

Run from the monorepo root:
```powershell
pnpm --filter @xerox/web dev
```

Or navigate directly to this folder:
```powershell
cd "apps/web"
pnpm dev
```

* **Localhost URL:** [http://localhost:3000](http://localhost:3000)
* **Default Port:** `3000`

---

## 🛠️ Build & Lint

```powershell
# Build for production
pnpm --filter @xerox/web build

# Start production server
pnpm --filter @xerox/web start

# Linting
pnpm --filter @xerox/web lint
```

---

## 📦 Dependencies

- `@xerox/contracts`: Shared TypeScript data contracts and types.
- `@xerox/api-client`: Type-safe HTTP and WebSocket client for the Print Bot backend API.
- `@xerox/ui`: Reusable design system, components, and animations.
