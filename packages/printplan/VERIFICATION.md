# Contract verification — 2026-10-22

Scope: isolated Phase 0 schema/reference adapters; no hardware, payments or tenant
authentication claim. Used local api-contract-testing, test-driven-development
and verification-before-completion instructions.

Commands executed from repository root:

| Command | Observed result |
| --- | --- |
| `python -m pytest tests/phase0/test_printplan.py -q` before implementation | Exit 1: missing adapter during collection (red test baseline). |
| `python -m pytest tests/phase0/test_printplan.py -q` after implementation | Exit 0: 99 passed, including 85 shared cases and range/Unicode/builder checks. |
| `node packages/printplan/typescript/printplan.ts` | Exit 0: PASS 85 shared PrintPlan fixtures. Node 24.15.0 strips TypeScript types. |
| `cargo fmt -p printplan` with `.tools/rust/bin` prepended to PATH | Exit 0, own crate formatted. |
| `cargo fmt -p printplan -- --check` with same PATH | Exit 0. |
| `cargo test -p printplan` initial/default linker | Nonzero: MinGW `crt2.o` unavailable. |
| `cargo test -p printplan` with `linker-flavor=gnu-lld` | Nonzero: unstable linker flavor rejected. |
| `cargo test -p printplan` with `linker-flavor=ld.lld` and self-contained linking, initial attempt | Nonzero: bundled linker runs, `crt2.o` unavailable until CRT extraction. |
| `cargo test -p printplan` after bundled CRT extraction, same environment | Exit 0: 3 Rust tests passed, including all 85 common fixtures. Doc-tests 0. |
| `cargo clippy -p printplan --all-targets -- -D warnings` same environment | Exit 0, no warnings. |
| `cargo fmt -p printplan -- --check` final check | Exit 0. |

Local Rust command environment used for the passing checks:

```powershell
$env:PATH = (Join-Path (Get-Location) '.tools/rust/bin') + ';' + $env:PATH
$env:CARGO_HOME = Join-Path (Get-Location) '.tools/cargo-home'
$env:RUSTFLAGS = '-C linker-flavor=ld.lld -C link-self-contained=yes -C linker=' + (Join-Path (Get-Location) '.tools/rust/lib/rustlib/x86_64-pc-windows-gnu/bin/rust-lld.exe')
cargo test -p printplan
```

Contract decisions and exact operational limits are in README.md. Dependency
licensing is audited by the integrating parent task; no license was assigned to
the user's newly authored source. No commits were made.

