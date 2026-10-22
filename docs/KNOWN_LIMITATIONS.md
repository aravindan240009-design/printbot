# Print Bot Known Limitations & Operational Boundaries

## 1. Document Purpose
This document provides an honest, transparent catalog of technical boundaries, physical driver constraints, and operational limitations of the **Print Bot** commercial release candidate. In accordance with the engineering contract (`AGENTS.md`), we do not claim universal hardware compatibility or zero-margin borderless printing on standard office copiers.

---

## 2. Print Rendering & Physical Output Boundaries

### 1. Driver-Dependent Non-Printable Margins
- **Limitation**: Standard office laser printers (such as HP LaserJet Pro M404dn or Canon imageRUNNER 2525) cannot print edge-to-edge. They enforce physical mechanical clip margins of approximately **3.5 mm to 5.0 mm** on all edges.
- **Handling**: The customer preview canvas displays a subtle dashed "Safe Printable Area" guideline. Uploaded documents with content in the bleed zone are flagged with a margin warning during preflight.

### 2. RGB Screen to CMYK Print Color Variation
- **Limitation**: Customer phone screens emit RGB light; printers deposit CMYK toners/inks. Vivid RGB neon tones (especially electric blues and bright greens) cannot physically reproduce in CMYK gamut.
- **Handling**: Mobile UI includes an explicit customer disclaimer: "Colors on screen may slightly vary from printed output due to printer toner gamut."

### 3. Font Substitution in Office Documents
- **Limitation**: Uploaded `.docx`, `.xlsx`, or `.pptx` documents utilizing proprietary or non-standard system fonts (e.g. specialized regional scripts or paid fonts not installed on the conversion worker) fallback to open-source metrics-compatible alternatives (e.g. Liberation Sans / Noto Sans).
- **Handling**: Customers are advised in the upload UI to "Upload PDF for 100% exact typographic reproduction."

### 4. Sprawling Spreadsheets / Complex Excel Workbooks
- **Limitation**: Large worksheets spanning dozens of columns without pre-configured print areas can render with tiny, illegible font sizes if scaled to fit 1 page wide.
- **Handling**: Conversion engine defaults to landscape orientation and preserves user-defined print areas when present in the `.xlsx` XML markup.

---

## 3. Hardware Spooler & Device Boundaries

### 1. Spooler Disappearance != Physical Paper Delivered
- **Limitation**: The Windows Print Spooler (`spoolsv.exe`) deletes a job from its queue the moment all raw bytes are transferred to the printer's onboard RAM buffer. If the printer subsequently jams, runs out of paper, or loses power, the spooler cannot detect it.
- **Handling**: The system flags ambiguous outcomes as `COMPLETION_UNKNOWN`. Automatic re-spooling is strictly blocked; shop operator inspection is required.

### 2. Physical Scanner / Copier Relay Hardware Gating
- **Limitation**: Physical TWAIN scanner ingestion and self-service coin-op copier timers require specialized local hardware (USB scanners and GPIO/relay boards).
- **Handling**: Software bridges and simulators are operational; hardware-dependent features remain flagged as `PILOT_PENDING` until validated against on-site pilot hardware.

---

## 4. Software Distribution & Operating System Boundaries

### 1. Microsoft SmartScreen Warning on First Install
- **Limitation**: Distributed binaries built without an Extended Validation (EV) Code Signing Certificate trigger a Windows Defender SmartScreen banner ("Windows protected your PC") upon initial execution.
- **Handling**: Shop owners must click "More info -> Run anyway" during pilot onboarding until an EV certificate is acquired.

### 2. Operating System Support
- **Windows**: Windows 10 (Build 19041+) and Windows 11 (64-bit x86_64). Windows 7 and 32-bit (x86) architectures are unsupported.
- **Mobile Browsers**: Apple iOS Safari 15+, Google Android Chrome 100+.
