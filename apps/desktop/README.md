# Desktop Workstation (`@xerox/desktop`)

Desktop printing operating system and workstation application for Windows counters, built with **Tauri 2 + Rust + React + TypeScript**.

It runs on the shop PC to discover connected Windows printers, generate counter stand QR codes, receive customer print orders in real time, and manage local printing operations.

---

## 🚀 How to Run Locally

### 1. Browser Development Mode (UI Only)
Run from the monorepo root:
```powershell
pnpm --filter @xerox/desktop dev
```
* **Localhost URL:** [http://localhost:5173](http://localhost:5173) (or next available port)

### 2. Full Native Windows App (Tauri 2 + Rust Spooler)
Ensure the Rust toolchain is installed (`rustc`, `cargo`), then run:
```powershell
pnpm --filter @xerox/desktop tauri dev
```

---

## 🛠️ Build

```powershell
# Build web assets for the desktop app
pnpm --filter @xerox/desktop build

# Compile Windows .exe / .msi installer via Tauri
pnpm --filter @xerox/desktop tauri build
```

---

## ✨ Features

- **Unified Lock Screen**:
  - Secure authentication for Super Admin (`admin`) and subscribed Shop Owners.
  - License key formatting (`PB-KEY-` auto-capitalization and dash insertion).
  - Show / Hide password visibility toggle (`Eye` / `EyeOff`).
  - Brute-force rate limiting with automatic 60-second lockout after 5 consecutive failed attempts.
- **Printer Discovery**: Automatic enumeration of local USB and network printers using Windows print spooler drivers.
- **Counter Stand QR & URL**:
  - Automatically generates the shop's customer access URL (`https://printbotak.vercel.app/?shop={shopSlug}`).
  - Generates downloadable and printable Counter Stand tent cards.
- **Order Management & Audio Alerts**: Live visual and sound notifications for incoming walk-in customer print jobs.
- **Shop Configuration**:
  - Custom rates for Black & White (₹/side) and Color (₹/side).
  - Mode toggle: `MANUAL_APPROVAL` vs. `FULL_AUTOMATIC`.
  - Offline local persistence in browser cache with automatic cloud database sync.
