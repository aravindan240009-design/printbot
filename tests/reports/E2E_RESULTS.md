# End-to-End (E2E) Customer Journey & Mobile Web Results

## 1. Journey Scope & Architecture
The customer experience is built as a lightweight, zero-install, mobile-first Progressive Web App (`apps/customer-web`). Walk-in customers scan a shop-specific QR code, which instantly initializes a scoped guest session without mandatory registration, phone OTP, or native app downloads.

---

## 2. 36-Point Verification Matrix

| # | Test Scenario | Viewport / Environment | Input / Action | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| 1 | **QR Shop Resolution** | Mobile (375x667) | Scan `/api/v1/qr/resolve/qr-anna-nagar` | Resolves `shop_id`, logo, services, active hours | Correct shop metadata returned | **PASS** |
| 2 | **Shop Branding & Language** | Mobile (390x844) | Load shop profile in English and Tamil | UI renders localized strings (English / தமிழ்) | Accurate translations rendered | **PASS** |
| 3 | **Guest Session Init** | Mobile (412x915) | Initial load without login token | Server issues scoped `X-Guest-Session` token | Scoped guest session initialized | **PASS** |
| 4 | **Single PDF Upload** | All Viewports | Upload standard 10-page PDF | File scanned, MIME validated, page count = 10 | 10 logical pages detected | **PASS** |
| 5 | **Word (.docx) Upload** | Desktop (1280x800) | Upload 4-page Office doc | Safe conversion pipeline invoked; no macro execution | Cleanly converted to canonical pages | **PASS** |
| 6 | **Excel (.xlsx) Upload** | Desktop (1920x1080) | Upload spreadsheet with print area | Print area respected, scaled to fit A4 | Converted without macro execution | **PASS** |
| 7 | **PowerPoint (.pptx) Upload** | Tablet (768x1024) | Upload presentation slides | Slide geometries normalized to landscape A4 | 1 slide per page rendered | **PASS** |
| 8 | **Standard Image (JPG/PNG/WebP)** | Mobile (390x844) | Upload photo | Image dimensions & DPI scanned; orientation auto-detected | Image preflight passed | **PASS** |
| 9 | **HEIC / TIFF Conversion** | Mobile (375x667) | Upload iPhone HEIC photo | Converted through isolated PIL/Pillow pipeline | Normalized to high-res JPEG | **PASS** |
| 10 | **Multi-File Upload** | Mobile (412x915) | Upload 3 distinct files simultaneously | All 3 files tracked in guest state | Multi-file queue populated | **PASS** |
| 11 | **File Reorder & Removal** | Mobile (390x844) | Drag reorder and delete File #2 | File #2 removed; remaining files reindexed | Reindexed with updated quotes | **PASS** |
| 12 | **Per-File Settings** | Mobile (375x667) | Set File 1 to B&W, File 2 to Color | Settings segregated per file in `PrintPlan` | Independent per-file options preserved | **PASS** |
| 13 | **All Pages Range** | Mobile (390x844) | Select 'All' | Pages 1 to N included | All pages rendered | **PASS** |
| 14 | **Noncontiguous Ranges** | Mobile (390x844) | Enter `1-3,5,8-` on a 10-page document | Resolves strictly to pages `[1, 2, 3, 5, 8, 9, 10]` | Correct 7 pages resolved | **PASS** |
| 15 | **Invalid Page Range** | Mobile (375x667) | Enter `15-20` on a 10-page document | Client/server validation blocks submission | ValidationError: page out of bounds | **PASS** |
| 16 | **Odd / Even Pages** | Tablet (768x1024) | Select 'Odd pages only' | Even pages omitted from rendering | Odd pages resolved | **PASS** |
| 17 | **Copy Multipliers** | Mobile (390x844) | Set copies = 3 | Physical sheets multiplied by 3; price scaled | Exact sheet & price scaling | **PASS** |
| 18 | **Color vs B&W** | Mobile (390x844) | Toggle Color Mode | Price switches between B&W (₹1.50) and Color (₹10.00) | Live pricing recalculates | **PASS** |
| 19 | **1-Sided (Simplex)** | Mobile (375x667) | Select Simplex | 10 pages -> 10 physical sheets | 10 physical sheets billed | **PASS** |
| 20 | **2-Sided (Duplex Long-Edge)** | Mobile (375x667) | Select Duplex Long | 10 pages -> 5 physical sheets | 5 physical sheets billed | **PASS** |
| 21 | **Duplex Short-Edge (Flip)** | Mobile (390x844) | Select Duplex Short | Binding edge set to top | Short edge imposition applied | **PASS** |
| 22 | **Paper Sizes (A4, A3, Legal)** | Tablet (768x1024) | Switch from A4 to A3 | Paper upgrade surcharge applied | Correct paper surcharge applied | **PASS** |
| 23 | **Orientation & Fit Scaling** | Mobile (390x844) | Set Landscape, Fit-to-Page | Geometry bounds recalculated without clipping | Transformed layout preview | **PASS** |
| 24 | **Pages Per Sheet (N-Up: 1, 2, 4)** | Mobile (412x915) | Select 4-up (4 pages/sheet) | 8 pages duplex -> 1 physical sheet | 1 sheet billed and rendered | **PASS** |
| 25 | **Photo Grids & Cropping** | Mobile (390x844) | Select 2x2 photo grid with drag-crop | Aspect ratio maintained; grid lines added | Exact 4-photo layout generated | **PASS** |
| 26 | **ID Card Front/Back** | Mobile (390x844) | Upload front and back of Aadhaar/DL | Placed on same side of single A4 sheet | Composite ID layout generated | **PASS** |
| 27 | **Passport 8-Up Preset** | Mobile (375x667) | Select 8 passport photos on 1 sheet | 35x45mm dimensions enforced with cut lines | Golden passport geometry verified | **PASS** |
| 28 | **Live Preview Pipeline** | Mobile (390x844) | Adjust options in real-time | Server renders high-fidelity PNG thumbnails | Sub-500ms preview response | **PASS** |
| 29 | **Accurate Sheet Accounting** | Desktop (1280x800) | 11 pages duplex 2-up | Logical pages (11) != Rendered sides (6) != Sheets (3) | Three distinct accounting layers verified | **PASS** |
| 30 | **Instant Locked Price Calculation** | All Viewports | Request quote on `/api/v1/orders/quote` | Authoritative quote returned in Indian paise | Locked quote generated | **PASS** |
| 31 | **Payment Simulation (UPI / Cash)** | Mobile (390x844) | Select UPI simulation checkout | Simulated UPI QR code rendered | Order created in `AWAITING_PAYMENT` | **PASS** |
| 32 | **Real-Time Order Tracking** | Mobile (390x844) | Poll `/api/v1/orders/{id}` | Status updates as job progresses through states | Accurate live state rendered | **PASS** |
| 33 | **Printing Status Progression** | Mobile (390x844) | Observe job transitions | Transitions: PAID -> QUEUED -> PRINTING -> COMPLETED | Real-time transitions observed | **PASS** |
| 34 | **Error & Malformed File Handling** | All Viewports | Upload 0-byte or corrupted file | Safe RFC 7807 problem details error returned | Clean user-facing error message | **PASS** |
| 35 | **Scheduled Print / Pickup Booking** | Mobile (390x844) | Select future pickup slot + 4-digit PIN | Slot reserved; 4-digit counter check-in PIN issued | Pickup code verified at counter | **PASS** |
| 36 | **Customer Document Erasure** | Mobile (390x844) | Click 'Delete My Documents' | Filenames scrubbed; files removed from disk | Right-to-erasure verified | **PASS** |

---

## 3. Responsive Layout & Viewport Verification
All primary user journeys were validated across standard mobile, tablet, and desktop viewports:
- **Small Android (360x640)**: Zero horizontal overflow; sticky checkout footer remains docked above bottom navigation; touch targets meet minimum 44x44px.
- **Standard Android (412x915)**: High-density cards render smoothly; 2-column preset options display clearly.
- **iPhone SE (375x667)**: Safe-area inset paddings respected; file upload input does not trigger unprompted layout zoom.
- **iPhone 14/15 Pro (390x844)**: Dynamic Island area unblocked; bottom action bar ergonomically positioned for one-handed operation.
- **Tablet / iPad (768x1024)**: 2-column split view (left: document preview; right: configuration controls).
- **Desktop (1920x1080)**: Full-width layout with real-time PDF page carousel.
