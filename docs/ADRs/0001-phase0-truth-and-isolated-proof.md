# ADR 0001 — authority, evidence and isolated printer proof

Status: PROPOSED pending design approval. Date: 2026-10-22.

Latest shared contract overrides legacy README/architecture: INR paise, guest flow,
one all-inclusive subscription, unlimited printers, server-derived shop identity,
Valkey/FOSS-first storage and ambiguous physical completion policy. The source DOCX
and Claude PDF were not found; do not invent their contents.

Recommend a separate Rust proof using PDFium raster -> GDI driver DC, explicit
simulator and immutable plan fixtures. No general raw PDF passthrough, no commercial
SDK or bundled GPL/AGPL executable. Exact binary license and hardware certification
are independent gates. Existing apps remain unchanged during design, so their
known unsafe scaffolding must not be used for production.

Consequences: cloud product implementation and Next-to-Vite migration deferred;
existing tests are baseline only. Windows printer status cannot prove physical
delivery; no auto-reprint after possible submission. This supersedes contrary
legacy documentation as a design requirement, not a claim that code is corrected.
