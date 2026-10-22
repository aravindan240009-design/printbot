# Phase 0 acceptance status — NOT COMPLETE

As of 2026-10-22. Local software proof and virtual output are implemented; physical hardware, missing references and release licensing still block the full exit gate. See PHASE0_IMPLEMENTATION_RESULTS.md and PHASE0_RUNBOOK.md. Phase 1 must not begin.

| Requirement | Evidence / exit criterion | Current status |
| --- | --- | --- |
| Shared contract and references | Shared contract read; named DOCX/PDF contents reconciled | PARTIAL; references absent |
| Environment and printer inventory | Reproducible read-only commands and observed results in HARDWARE_MATRIX | INSPECTED; no physical device found |
| Five-model bench | Each case per model/driver, at least two real models when available | BLOCKED; zero models tested |
| Rust proof | Actual enumeration/capabilities, trusted PDF+plan validation, raster/GDI submission | IMPLEMENTED; see PHASE0_IMPLEMENTATION_RESULTS |
| CI simulator and fixtures | Explicit simulator, adversarial failure/concurrency tests, printable corpus | IMPLEMENTED; see PHASE0_IMPLEMENTATION_RESULTS |
| Versioned schema and parity | JSON Schema and Rust/Python/TS fixtures agree, provenance enforced | IMPLEMENTED reference contract; production authorization absent |
| Product UX and policy | Three screens, desktop/admin, two modes, single plan, time/settings hierarchy | DRAFT in PRD_DECISIONS |
| Dependency/license gate | Exact artifact inventory, validated SPDX, notices and approved decisions | SPDX41 packages/notices verified; release clearance BLOCKED |
| Design/schema/license review | Reviewed written design and final implementation evidence | Independent review findings addressed; release/schema legal signoff remains UNVERIFIED |
| Reproducible printing demo | New checkout commands produce verified virtual output and actual observed submission | IMPLEMENTED; see PHASE0_IMPLEMENTATION_RESULTS |

## Security/privacy review checklist

The historical checklist below covers future production controls; for completed
proof-specific controls see PHASE0_IMPLEMENTATION_RESULTS. Final independent
review was interrupted; identified code findings were corrected and verified, but
no final whole-change reviewer approval is claimed. Source-document reconciliation,
physical certification and release legal review still prevent Phase0 completion.

- [ ] Authenticated shop/device context; body/header tenant spoof rejected.
- [ ] RLS with least-privilege role, read/write composite-tenant FK and worker negative tests.
- [ ] No raw PDF sent to unsupported driver; DEVMODE coercion detected.
- [ ] Trusted-file proof isolated; untrusted conversion never declared safe from simulation.
- [ ] Journal crash windows and concurrent/duplicate attempts cannot auto-resubmit.
- [ ] Rendering/input resource bounds, private temp storage and cleanup verified.
- [ ] Verified payment binding/idempotency and subscription-expiry resolution designed.
- [ ] Signed release/update, exact licenses/notices/SBOM and privacy review completed.

None of these unchecked items is implied by the seven existing backend tests.
No new graphical UI was built; screenshot/mobile/browser QA is not applicable yet.

## Handoff

Continue Phase 0 only. Read the dated design and inspection record. Obtain written
design approval required by the invoked brainstorming workflow, then create the
implementation plan. Preserve user's existing AGENTS.md edit. Resolve Rust toolchain
and PDFium provenance, implement isolated proof/schema/fixtures/simulator and run
recorded checks. Obtain missing master DOCX/Claude PDF and physical printers; keep
hardware gate BLOCKED until actual results exist. Do not deploy current scaffold.
