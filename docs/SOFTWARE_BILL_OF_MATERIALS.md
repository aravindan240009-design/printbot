# Print Bot Software Bill of Materials (SBOM)

## 1. Document Overview
- **System**: Print Bot Commercial SaaS & Desktop Platform
- **Format**: Human-readable SBOM companion to `docs/SBOM.spdx.json` (SPDX 2.3 JSON specification)
- **Compliance**: Open-Source-First Development Policy (`AGENTS.md`)
- **Distribution Model**: Closed-source proprietary SaaS with distributed Windows desktop agent (.exe/.msi)

---

## 2. Python Backend & Conversion Stack (`services/api/`)

| Package / Dependency | Version | License | Commercial Redistribution Notes |
| :--- | :--- | :--- | :--- |
| **FastAPI** | 0.115.0+ | MIT | Permissive; include copyright notice in documentation. |
| **Starlette** | 0.38.0+ | BSD-3-Clause | Permissive; include copyright notice. |
| **Pydantic / Pydantic-Core** | 2.12.0+ | MIT | Permissive; include copyright notice. |
| **Uvicorn** | 0.31.0+ | BSD-3-Clause | Permissive; ASGI server. |
| **SQLAlchemy** | 2.0.35+ | MIT | Permissive ORM. |
| **asyncpg** | 0.29.0+ | Apache-2.0 | Permissive async PostgreSQL driver. |
| **Pillow (PIL)** | 10.4.0+ | HPND / MIT-like | Permissive image manipulation library. |
| **pypdf** | 5.0.0+ | BSD-3-Clause | Permissive pure-Python PDF manipulation. Safe for closed-source SaaS. |
| **pypdfium2 / PDFium** | 4.30.0+ | Apache-2.0 / BSD-3-Clause | Permissive Google PDFium rendering engine. Zero GPL contaminations. |
| **python-multipart** | 0.0.12+ | Apache-2.0 | Form & file upload parser. |
| **httpx** | 0.27.2+ | BSD-3-Clause | HTTP client for payment gateway communication. |
| **cryptography** | 43.0.1+ | Apache-2.0 / BSD | Low-level cryptographic primitives. |

---

## 3. Rust Native Windows Print Agent (`crates/print_agent/`)

| Crate / Dependency | Version | License | Commercial Redistribution Notes |
| :--- | :--- | :--- | :--- |
| **windows-sys** | 0.52.0+ | MIT / Apache-2.0 | Official Microsoft Win32 API bindings (`winspool.drv`, named pipes). |
| **tokio** | 1.40.0+ | MIT | Asynchronous runtime. |
| **rusqlite** | 0.32.1 (Cargo.lock) | MIT; bundled SQLite is public-domain software | Embedded SQLite client for the local spool journal; retain upstream notices in redistribution materials. |
| **tempfile** | 3.27.0 (dev-only) | MIT / Apache-2.0 | Isolated temporary directories for Rust tests; not shipped in the installer. |
| **ed25519-dalek** | 2.1.1+ | BSD-3-Clause | High-speed asymmetric digital signature keypair generation. |
| **serde / serde_json** | 1.0.200+ | MIT / Apache-2.0 | Serialization primitives. |
| **sha2** | 0.10.8+ | MIT / Apache-2.0 | SHA-256 cryptographic hashing. |
| **tracing / tracing-subscriber** | 0.3.18+ | MIT | Structured diagnostic telemetry. |

---

## 4. Frontend & Desktop Webview Stack (`apps/`)

| Package / Dependency | Version | License | Commercial Redistribution Notes |
| :--- | :--- | :--- | :--- |
| **React / React-DOM** | 19.0.0+ | MIT | Permissive UI library. |
| **Vite** | 5.4.0+ | MIT | Frontend build tooling. |
| **TypeScript** | 5.5.0+ | Apache-2.0 | Type checking and compilation. |
| **@tauri-apps/api** | 2.12.4 | MIT / Apache-2.0 | Typed frontend IPC bridge; privileged operations remain in Rust commands. |
| **Tauri 2 Core** | 2.0.0+ | MIT / Apache-2.0 | Native desktop application framework (WebView2 on Windows). |
| **TailwindCSS** | 3.4.0+ | MIT | Utility-first CSS framework. |
| **Lucide-React** | 0.440.0+ | ISC | Permissive icon toolkit. |
| **pdfjs-dist** | 4.6.0+ | Apache-2.0 | Mozilla PDF.js client-side rendering for mobile browser previews. |

---

## 5. Reciprocal & Copyleft License Review (GPL / AGPL Audit)

- **Zero AGPL / GPL Contaminations**: All backend, agent, and frontend dependencies are vetted MIT, BSD, Apache-2.0, or HPND.
- **PyMuPDF Exclusion**: PyMuPDF (AGPL-3.0) is strictly **excluded** from this repository. Pure `pypdf` and Apache-2.0 licensed `PDFium` are used exclusively, protecting commercial distribution rights.
- **Ghostscript / LibreOffice Isolation**: If external document converters (e.g. LibreOffice CLI) are invoked in production containers, they execute strictly as isolated out-of-process CLI workers without linking proprietary code into GPL address spaces.

---

## 6. Machine-Readable SPDX Reference
The authoritative, machine-parseable SPDX 2.3 inventory with exact package checksums is maintained at [docs/SBOM.spdx.json](file:///c:/Users/ashok/OneDrive/Desktop/xerox/docs/SBOM.spdx.json).
