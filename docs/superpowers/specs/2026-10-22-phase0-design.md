# Print Bot Phase 0 design — awaiting approval

Implementation authorized by renewed explicit user request; see ADR0002 and PHASE0_IMPLEMENTATION_RESULTS for current status. Historical inspection statements below describe the pre-implementation baseline.

Date: 2026-10-22 (Asia/Kolkata). Scope: Phase 0 only. This is a reviewable
design, not an implementation or release certification. No Phase 1 work is authorized.

## Intent and evidence

Establish whether a trusted PDF can be rendered and submitted with faithful print
settings through Windows drivers, while fixing the product contract and identifying
security, licensing and operating constraints before implementing the SaaS.

The existing repository is a pnpm workspace with Next.js web, React/Tauri desktop,
FastAPI skeleton, SQL migration, Python worker and seven backend tests. It has no
root Cargo workspace, resolved dependency locks, PrintPlan schema, genuine Rust
enumeration/submission implementation or verified converter pipeline. Existing
desktop printer names and spool ID are fabricated; worker inspection is simulated.
The tests pass but do not prove authenticated isolation, PostgreSQL RLS, rendering
or hardware printing. Keep existing components and isolate the new proof.

Windows 11 Home 10.0.26200 x64 has only OneNote and Microsoft Print to PDF queues.
No physical USB/network printer is configured or present in the printer/imaging
PnP inventory. This cannot establish whether an unconfigured LAN device exists;
no network scan was performed. Hardware certification is BLOCKED.
Python 3.11.9, Node 24.15.0 and pnpm 11.9.0 are available. Rust/Cargo and uv were
not found on PATH; Cargo/Rust were also absent at the conventional user location.
Rust build tools and an audited PDFium artifact remain prerequisites.

The named master DOCX and Claude PDF were not found recursively in this checkout.
Reconciliation with their contents is BLOCKED until supplied. The shared contract
and Phase 0 prompt govern this design; external competitor research is excluded.

## Approaches and proposed choice

1. **PDFium raster to GDI (recommended):** inspect exact driver capabilities,
   validate a job-specific DEVMODE, render each imposed side and send pixels through
   a printer DC. Broad driver compatibility is the hypothesis to test. Costs include
   raster memory, driver differences and PDFium binary provenance obligations.
2. **Direct PDF/PCL/PostScript passthrough:** smaller spool data for individually
   certified language-capable devices, but unsafe as the general path. Defer as an
   opt-in adapter after model/driver/language certification.
3. **External PDF printing executable:** additional distribution/security surface;
   several common tools bring GPL/AGPL or commercial licensing. Do not introduce
   one without a separate pinned binary audit and authorization where required.

The recommendation implements the user's requested render-to-driver direction.
It has not yet been approved as a written design. Text wireframes satisfy Phase 0;
no Figma document or polished UI is required. Cloud Environment runtime guidance
was read; this execution host is local Windows and no managed runtime tool is exposed.

## Implementation boundary and proposed structure

Add an isolated `tools/printer-proof` Rust CLI in a root Cargo workspace that
initially includes only the proof crate; do not absorb or upgrade the legacy
Tauri crate. Add `packages/printplan` for versioned schema and Rust/Python/TS
fixtures, `fixtures/printable` for generated synthetic PDFs, and `scripts/phase0`
for inventory and supervised bench commands. Preserve existing application APIs.
Existing unsafe prototype behavior must be prominently documented and excluded
from the proof. Do not expose this CLI to uploaded/untrusted customer files.

Proposed CLI interfaces (not yet implemented):

```
printer-proof list --backend windows
printer-proof capabilities --printer <exact-name>
printer-proof validate --plan <plan.json> --pdf <trusted.pdf>
printer-proof simulate --plan <plan.json> --scenario offline
printer-proof print --printer <exact-name> --plan <plan.json> --pdf <trusted.pdf> --journal <private-directory>
printer-proof observe --printer <exact-name> --job-id <id>
```

Simulation requires explicit selection, produces `backend: simulator`, and never
reports hardware submission or physical completion. No implicit fallback on API
errors or unsupported hosts. Do not automatically choose the default printer.

## Windows path and failure semantics

Use EnumPrintersW for local/connected queues, GetPrinterW/GetPrinterDriverW for
metadata and DeviceCapabilitiesW for sizes, dimensions, bins, duplex, color and
copy limits. Metadata does not imply a feature combination is supported. Preserve
driver-private DEVMODE bytes: DocumentPropertiesW determines buffer size, obtains
defaults, and validates requested settings. Compare returned values and fail on
coercion. Unknown capability is not support. Driver defaults never silently replace
selected media, duplex or color. Use job-specific settings, not persistent defaults.

Load only an explicitly configured absolute PDFium DLL with recorded digest and
notices, using a constrained DLL search. Verify PDF signature, page count, document
hash and bounded dimensions before submission. Disable JS/XFA in the audited build.
Render white-backed BGRA at bounded DPI, apply grayscale/B&W explicitly, and respect
physical printable offsets, orientation, scaling and margins. CreateDCW and
StartDocW/StartPage/StretchDIBits/EndPage/EndDoc drive the printer. Check every
return value and clean up page, document, bitmap, DC and printer handles on failure.
Use a supervised child process with timeout for blocking driver calls.

Verified API references (2026-10-22):
https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-devicecapabilitiesw
https://learn.microsoft.com/en-us/windows/win32/printdocs/documentproperties
https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-startdocw
https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-stretchdibits

Choose one copy owner. Initially render/copy in software, set driver copies=1,
and verify exact collated/uncollated order. Never multiply copies in both places.
Printer capability and effective DEVMODE must agree before beginning a job.
Incompatible advanced operations are rejected, not silently dropped; their product
requirements remain in the contract for later renderer implementation.

Create an exclusive per-job durable journal and flush a pre-submission intent before
StartDoc. Record actual spooler job ID and submission milestones. A crash between
intent and durable acknowledgement is ambiguous even without a recorded spool ID.
Job key includes shop, plan hash and job identity; concurrent/repeated invocation
cannot automatically submit again. Record `submitted_to_spooler` separately from
`physical_complete`, which remains unknown absent supervised evidence. GetJobW
and queue disappearance are observations only. Abort/cancel is best effort and
may leave printed sheets. Use COMPLETION_UNKNOWN on ambiguous failures; no auto-reprint.

## Contract and fixtures

See proposed semantics in `docs/PRINTPLAN_V1.md`. JSON Schema validates structural
constraints; language adapters enforce range resolution, hashes, authorization and
capability combinations. All adapters consume identical positive/negative fixtures
and produce identical normalized selection, side sequence and accounting totals.
The local proof receives an explicit trusted shop context separate from plan JSON;
this is a test seam, not production tenant authentication. Production identity is
resolved by the server and an authenticated paired agent, never request fields.

Fixture corpus: page numbers, registration arrows, RGB patches, grayscale ramp,
portrait/landscape, mixed sizes, blank pages and odd-page duplex/copy boundaries.
Include invalid/encrypted/truncated PDFs, huge declared dimensions, invalid page
ranges, tenant mismatch, capability mismatch and tampered render hashes. Record
fixture provenance/hash. Generate synthetic documents only; no customer files.

## Product and security boundaries

See `docs/PRD_DECISIONS.md` for three screens, desktop/admin, exactly two modes and
single-plan subscription. No live payments, subscriptions, cloud tenancy migration,
device provisioning, scanner control, installer or production UI in Phase 0.
Document those future controls without claiming they exist. Existing test-only
tenant header routing and in-memory stores are not production trust boundaries.

## License and operational gates

No dependency is accepted based only on its project name. Before installation,
resolve an exact version, fetch its source license and transitive metadata, record
notices and an SPDX inventory. PDFium source permission does not certify a third-party
DLL. Audit the precise build, fonts/codecs, source commit, build flags, ABI and hash.
Do not silently ship GPL/AGPL helpers from converter container images. See
`docs/OSS_LICENSE_AUDIT.md` for the preliminary evidence and remaining work.

No live settlement/provider account or paid signing service is needed for the proof.
Do not install proprietary tools or require Docker Desktop. Rust/MSVC Windows SDK
tooling prerequisite licensing must be recorded before setup. Operator costs and
external signing/provider fees remain separate from OSS software licensing.

## Verification and exit

Use unit/property boundary tests for ranges/imposition and malformed contracts;
integration tests for actual Windows enumeration and virtual output; Rust/Python/TS
fixture parity; simulator faults for paper-out, offline, cancellation, timeout,
restart, crash windows, duplicate and concurrent submissions. Assert no automatic
retry after possible submission. Run cargo fmt/check/test/clippy, Python and TS
checks with captured exit codes. Unavailable tools are blocked, never passed.

Run the full supervised matrix on five distinct target models, plus driver variants.
At least two actual models need recorded physical results when available. Virtual
queues do not count. Complete license/schema review, hash the actual binary, capture
commands/results, and preserve privacy-safe evidence. Phase 0 is not complete while
the local proof, license gate, source-document reconciliation or required physical
bench results remain blocked. Do not start Phase 1.

Builder may choose exact permissive package versions, initial operational limits,
fixture generation tools and internal CLI parsing after audit, without changing
these requirements. Missing hardware/documents are blockers to report, not choices
to fabricate. Written design approval is the next workflow gate.
