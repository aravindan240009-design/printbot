# Dot-source from any working directory. Local proof toolchain only; no machine PATH change.
$taskRepository = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$taskRustBin = Join-Path $taskRepository '.tools/rust/bin'
$taskImportBin = Join-Path $taskRepository '.tools/llvm-mingw-20261020-msvcrt-x86_64/bin'
if (Test-Path -LiteralPath (Join-Path $taskRustBin 'cargo.exe')) {
    $env:PATH = "$taskRustBin;$taskImportBin;" + $env:PATH
    $env:CARGO_HOME = Join-Path $taskRepository '.tools/cargo-home'
    $taskLinker = Join-Path $taskRepository '.tools/rust/lib/rustlib/x86_64-pc-windows-gnu/bin/rust-lld.exe'
    if (-not (Test-Path -LiteralPath $taskLinker)) {
        throw 'Bundled Rust LLD prerequisite missing. Finish bootstrap.py --toolchain.'
    }
    if (-not (Test-Path -LiteralPath (Join-Path $taskImportBin 'dlltool.exe'))) {
        throw 'LLVM import-library generator missing. Finish bootstrap.py --toolchain.'
    }
    # Cargo splits this string; quoted paths support spaces in the checkout path.
    $env:CARGO_ENCODED_RUSTFLAGS = "-C" + [char]31 + "linker-flavor=ld.lld" + [char]31 + "-C" + [char]31 + "link-self-contained=yes" + [char]31 + "-C" + [char]31 + "linker=$taskLinker"
    Remove-Item Env:RUSTFLAGS -ErrorAction SilentlyContinue
}
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    throw 'Rust/Cargo unavailable. See docs/PHASE0_RUNBOOK.md.'
}
