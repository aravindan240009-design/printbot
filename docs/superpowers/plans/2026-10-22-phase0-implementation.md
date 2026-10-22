# Phase 0 executable foundation implementation plan

> For agentic workers: use subagent-driven-development for independent contract,
> native adapter and evidence work; integrate and review in this session.

Goal: implement the isolated trusted-PDF Windows proof, versioned contract/parity
fixtures, explicit simulator, reproducible bench tooling and audited dependency record.
Architecture: additive Cargo CLI and printplan package; legacy app excluded.
Spec: ../specs/2026-10-22-phase0-design.md and latest shared contract/Phase 0 request.

## Global constraints and rulings

- Phase 0 only; work in this repository and preserve existing edits.
- Ruling: renewed explicit implementation request authorizes execution of the existing
  design. Do not repeat the design-approval loop. Record any technical deviations.
- No physical printer, payment, signing or missing-source result may be invented.
- Install only audited permissive prerequisites/dependencies locally; no deployment,
  global agent sync or commercial SDK. Pin dependencies and lock actual resolution.
- Native proof may support a constrained compatible subset; validate and reject
  unsupported operations explicitly while retaining the full product contract.
- Uncertain submitted outcome is COMPLETION_UNKNOWN and must never auto-reprint.

## Review focus

Tenant spoofing; malformed/empty/huge ranges; physical copy boundaries and duplex
padding; hash/capability coercion; durable submission crash windows and concurrent
attempts; simulator mislabeled as real; actual binary provenance versus project license.

## Tasks

- [ ] Contract: add packages/printplan schema v1, Python/TS/Rust semantics and common
  positive/negative fixtures. Verify selection/accounting, strict fields, tenant context,
  dimensions, copies and capabilities with shared cases in all languages.
- [ ] Native adapter: add tools/printer-proof Windows enumeration/driver capability
  query, validated DEVMODE, bounded PDFium raster->GDI path and real job observation.
  Add RAII cleanup, absolute DLL path/digest and explicit unsupported-option rejection.
- [ ] CLI/journal: add root Cargo workspace, strict CLI validation, bounded trusted
  PDF/digest checks, explicit simulator fault scenarios and create-new durable journal.
  Verify concurrent/repeated calls and crash ambiguity never cause automatic reprint.
- [ ] Evidence: add synthetic printable corpus, read-only inventory and supervised
  bench harness with per-case unverified defaults. Keep two-real-model gate blocked.
- [ ] Licensing/research: source-pin declared and resolved dependencies, actual
  redistributable provenance, SPDX inventory, notices and official-source decisions.
  Mark unresolved legacy/future converters unapproved; no blanket legal clearance.
- [ ] Integrate: run cargo fmt/test/clippy, Python tests/schema fixtures, Node/TS parity,
  actual Windows inventory and virtual PDF demo where executable prerequisites permit.
  Review source independently, fix material findings and record commands/results.
- [ ] Handoff: update required Phase 0 docs/ADRs, exact changed files, implemented/
  tested/blocked states, runnable commands and next-phase prohibition until gates met.

No commits, release publication or Phase 1 feature work is required by this plan.
