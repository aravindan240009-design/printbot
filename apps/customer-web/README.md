# Customer Web Portal (`@xerox/customer-web`)

Mobile-first customer web portal for **Print Bot**. Walk-in customers scan a counter QR code or open a shop URL on their mobile phone, upload files, configure print settings, see accurate pricing, and pay or track their order—without downloading an app or creating an account.

---

## 🚀 How to Run Locally

Run from the monorepo root:
```powershell
pnpm --filter @xerox/customer-web dev
```

Or navigate directly to this folder:
```powershell
cd "apps/customer-web"
pnpm dev
```

* **Localhost URL:** [http://localhost:3000](http://localhost:3000)
* **Default Port:** `3000`

---

## 🛠️ Build & Typecheck

```powershell
# Build for production
pnpm --filter @xerox/customer-web build

# Run TypeScript typecheck
pnpm --filter @xerox/customer-web type-check
```

For production API forwarding, set `VITE_API_BASE_URL` to the public API URL
including `/api/v1` in the deployment environment. Without it, production builds
do not send requests to a visitor's `localhost`; the Supabase order flow remains
available. Configured production URLs must use HTTPS and cannot target loopback
addresses.

Customer price quotes are calculated by the Supabase `quote-order` Edge Function,
not by the browser or the optional Print Bot API. Deploy it to the configured
Supabase project with:

```powershell
supabase functions deploy quote-order --project-ref kiseniigikzncpzczurp
```

The function reads active shop rates from `pilot_applications.notes` (or the
`shops` table when available). Keep the Supabase service-role key server-side;
never add it to a `VITE_` variable or the customer bundle. The separate order
creation and payment-intent flow still requires a reachable Print Bot API.

---

## ✨ Features

- **Zero-Friction Access**: No mobile app download, no account creation, and no mandatory login required.
- **Shop Association**: Binds automatically to the scanned counter's `shop_id` via QR parameter or URL.
- **Multi-File Uploads**: Supports PDF, PNG, JPG/JPEG, DOCX, XLSX, and PPTX up to 100 MB per file.
- **Client-Side Page Count Inspection**: Automatically detects exact page counts for PDFs and images before quotation.
- **Complete Print Customization**:
  - Color modes: Black & White, Color, Grayscale
  - Copies and collation
  - Duplex modes: Simplex (single-sided), Duplex Long-Edge, Duplex Short-Edge
  - Paper sizes: A4, A3, Legal, Letter
  - Non-contiguous page ranges: `1-3, 5, 8-`
  - Finishing: Stapling, Spiral Binding, Hard Binding
- **Multi-Lingual Support**: English, Tamil (தமிழ்), and Hindi (हिन्दी) translations.
- **Accurate Instant Quote**: Calculates logical pages, rendered sides, and physical sheets according to the shop's live rates.
- **Flexible Payments**: Instant UPI payment intent / QR code and Cash at counter.
- **Order Tracking & Pickup PIN**: Displays the four-digit collection PIN and live status updates from the workstation queue, print submission, and ready-for-pickup action.
