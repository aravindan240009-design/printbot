# Dependency preflight — 2026-10-22

Before adding proof dependencies, crates.io exact version metadata was checked:
serde 1.0.228, serde_json 1.0.145, sha2 0.10.9 and windows-sys 0.61.2 each declare
MIT OR Apache-2.0. Preserve copyright/licenses and applicable notices; resolved
transitives must also be inventoried before release. Exact checksums are recorded
in Cargo.lock and generated SPDX, not inferred from package name.

Local Rust toolchain candidate: official stable channel manifest dated 2026-10-15,
Rust 1.99.1 (58cf8f9c3 2026-10-13), Windows GNU distribution:
https://static.rust-lang.org/dist/2026-10-15/rust-1.99.1-x86_64-pc-windows-gnu.tar.xz
SHA256 0210624b2eb2bdf4ec32c2a6caf5c3bd2ab84e5df66c7530023e37f02add1084.
Rust is MIT/Apache-2.0; bundled LLVM/MinGW/runtime tools have additional notices
and potential copyleft toolchain components. These are development-only, not
installer payload. Do not ship toolchain files as application redistributables.
Archive license files must be retained locally and inspected before distribution.

PDFium binary candidate: PyPI pypdfium2 5.14.0 Windows AMD64 wheel. Declared
BSD-3-Clause, Apache-2.0 and dependency licenses. This is NOT approved by metadata
alone; extract and inspect actual PDFium license bundle/version/build flags before
use. DLL and extracted tools remain ignored under .tools; no binary in git.
Wheel SHA256 149fd5c6397b8df8bf7911a93506eff0be874f877afe7ac936cf5d37d21a6a06.

Existing Python jsonschema 4.26.0 is available; reference adapter uses it for schema
validation with existing transitive inventory. Node 24 native type stripping avoids
adding a TypeScript build runtime dependency for standalone fixture verification.
