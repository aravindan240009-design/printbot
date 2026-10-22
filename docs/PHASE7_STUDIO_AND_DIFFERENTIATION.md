# Phase 7: Advanced Print Studio, Hardware Adapters & Commercial Differentiation

**Version:** 1.0.0-phase7  
**Status:** IMPLEMENTED & TESTED (All 249 Unit & Integration Tests Passing)  
**Real-Hardware Disclosures:** Physical scanner bridge and self-service copier automation are marked `BLOCKED/UNVERIFIED (HARDWARE PENDING)`.

---

## 1. Advanced Print Studio Engine

### 1.1 Saddle-Stitch Booklet Imposition (4-up Saddle-Stitch)
The studio implements an exact mathematical imposition model for saddle-stitch brochures and booklets:
- **Input Page Rounding:** Total logical pages $N$ are padded with blank slots up to the nearest multiple of 4:
  $$S = \lceil N / 4 \rceil \times 4$$
- **Physical Sheet Count:** $T = S / 4$ physical double-sided sheets.
- **Signature Ordering Algorithm:** For sheet index $i \in \{0, \dots, T-1\}$:
  - **Front Side (Outer):**
    - $\text{Left} = S - 2i$
    - $\text{Right} = 2i + 1$
  - **Back Side (Inner):**
    - $\text{Left} = 2i + 2$
    - $\text{Right} = S - 2i - 1$
- **Golden Verification Test:**
  - 4-page booklet: Sheet 1 Front = `[4, 1]`, Back = `[2, 3]`.
  - 8-page booklet: Sheet 1 Front = `[8, 1]`, Back = `[2, 7]`; Sheet 2 Front = `[6, 3]`, Back = `[4, 5]`.
  - 5-page booklet: Rounds to 8 pages with blanks on slots 6, 7, 8.

### 1.2 Accurate Mixed-Color Per-Page Pricing
Unlike legacy software that bills an entire document at the color rate if a single color accent is detected, Print Bot analyzes each page individually:
$$\text{Total Quote (paise)} = \left( N_{\text{bw}} \times \text{Rate}_{\text{bw}} + N_{\text{color}} \times \text{Rate}_{\text{color}} \right) \times \text{Copies}$$
- *Example:* A 10-page document with 2 color pages (e.g. cover and chart) and 8 B&W pages at ₹2/B&W and ₹10/Color:
  $$\text{Quote} = (8 \times 200) + (2 \times 1000) = 1600 + 2000 = 3600 \text{ paise (₹36.00)}$$
  (Saves customer ₹64.00 compared to a blanket 10 × ₹10 = ₹100.00 color bill).

### 1.3 Poster Tiled Multi-Sheet Layout
Splits large oversized artwork across $C \times R$ standard A4/A3 sheets:
- Configurable overlap bleed (default 10.0 mm).
- Generates precise tile coordinates `[x1, y1, x2, y2]` in millimeters with cutting guides.

### 1.4 ID Card 2-in-1 Same-Sheet Placement
Places front and back of Indian Voter IDs, Driver's Licenses, and Aadhaar cards on a single A4 sheet:
- Standard card dimensions: $85.60 \times 53.98\text{ mm}$.
- Top-center placement for front card; aligned bottom-center placement for back card with 15mm separation.

---

## 2. High-Value Business Differentiation Features

### 2.1 Tenant-Scoped College & Corporate Prepaid Accounts
- Enables colleges, universities, engineering departments, and local law firms to maintain dedicated prepaid printing balances.
- **Strict Invariant:** Wallets are scoped strictly to `shop_id`. A department at Shop A cannot be accessed, queried, or debited by Shop B.
- Atomic balance verification prevents overdraws.

### 2.2 Resumable Multi-Chunk Large Upload Sessions
- Handles multi-hundred-megabyte engineering drawings, thesis documents, and photo albums over unstable 4G mobile networks.
- Protocol:
  1. `POST /api/v1/differentiation/uploads/resumable/init` (total size, total chunks, SHA-256).
  2. `POST /api/v1/differentiation/uploads/resumable/chunk` (chunk index, base64 payload).
  3. Automatic assembly and asset registration upon receiving the final chunk.

### 2.3 Dynamic Queue Wait-Time Estimation
Calculates realistic customer collection estimates with explicit uncertainty labeling:
- Idle Queue: `0–2 minutes (Immediate dispatch)`.
- Busy Queue: $\text{Min} = 2 \times \text{Jobs}$, $\text{Max} = 4 \times \text{Jobs} + 3$ minutes.
- Emits explicit label: `ESTIMATE_WITH_TOLERANCE_PM_3M`.

### 2.4 Cryptographically Signed Print Receipts
- Prevents disputes and fraudulent claims of paper miscounts.
- Generates an HMAC-SHA256 signature over:
  $$\text{Payload} = \text{ReceiptNumber} \mid \text{ShopID} \mid \text{OrderID} \mid \text{TotalPaise} \mid \text{SheetsPrinted} \mid \text{Timestamp}$$
- Verified instantly via `POST /api/v1/differentiation/receipts/verify`. Any alteration of sheet count or price fails validation.

### 2.5 Printer Consumable & Maintenance Telemetry
- Monitors black, cyan, magenta, and yellow toner levels, drum life, and maintenance box percentage.
- Automatically flags `LOW_BLACK_TONER` alert when toner drops below 15%.

---

## 3. Intelligent Multi-Printer Routing & Simulator Bridges

### 3.1 Capability-Driven Load Balancer
Dynamically dispatches incoming print jobs across unlimited shop printers:
1. **Capability Filter:** Matches requested paper size (A3, A4, Legal), color requirement, and duplex capability.
2. **Health Filter:** Selects only active, online printers.
3. **Queue Balancing:** Selects printer with lowest current queue depth; tie-breaks on highest pages-per-minute (PPM).
4. **Pre-Spool Failover:** Failover occurs strictly **BEFORE** spool submission. Never reroutes or reprints once physical spooling has begun.

### 3.2 Hardware Simulators & Real-World Disclosures
- **Scanner Bridge Simulator:** Simulates flatbed and ADF duplex scanning via simulated TWAIN/WIA protocols.
- **Timed Copier Rental Simulator:** Simulates physical self-service kiosk lock/unlock with copy quotas and staff emergency override.
- **Non-Negotiable Hardware Gate:** Both physical scanner automation and unattended copier automation are labeled **`BLOCKED/UNVERIFIED (HARDWARE PENDING)`** until certified on physical hardware.
