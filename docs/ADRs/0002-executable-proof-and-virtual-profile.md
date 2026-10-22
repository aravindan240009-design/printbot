# ADR 0002 — isolated executable proof and virtual output profile

Date 2026-10-22. Status: implemented for Phase 0 experiment; production clearance
and hardware certification remain blocked. Renewed user implementation request
authorized proceeding from the earlier design. No Phase 1 work started.

Add a separate Cargo workspace CLI and shared schema/adapters rather than changing
the unsafe legacy app. Trusted synthetic samples only; explicit simulator, no default
physical printer. `--shop-id` exercises isolation validation, not production login.

PDFium156.0.8076.0 from hash-pinned pypdfium2 wheel5.14.0 rendered into BGRA then GDI
driver DC. Native source is preserved in memory across hash/parse/render, DLL held
against modification while loaded. Exact artifact notices are captured; upstream
source commit/build transitive versions remain unresolved for release.

Windows driver capability/private DEVMODE is checked before StartDoc. Physical
drivers reject coercion. Microsoft Print To PDF returns fixed color/collation/n-up
metadata and omits unsupported hardware flags; a separate exact-driver profile,
requiring explicit output and simplex, verifies effective paper/orientation/copies/DC
dimensions while raster/software owns color conversion and copy order. This is
virtual compatibility evidence and does not certify physical drivers.

All deterministic selected-page bounds/geometry checks precede StartDoc. Every actual
job ID is separate from unknown physical output. Per-job create-new flushed intent
prevents automatic repeat submission; uncertainty is conservative, even preflight
errors after intent. Production Windows ACL/directory power-loss durability/service
identity needs further work, no exactly-once physical delivery guarantee.

Build uses pinned Rust GNU1.99.1 bundled LLD/runtime and LLVM-MinGW20261020 LLVM
dlltool-only dependency subset. No MSVC/commercial PDF SDK or GPL print executable
introduced. Runtime exception/source/notice obligations remain a release gate;
development build success is not legal distribution approval.
