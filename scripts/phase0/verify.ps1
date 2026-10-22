param([switch]$Renderer)
$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '../..')
try {
    . ./scripts/phase0/env.ps1
    cargo fmt --all -- --check
    if ($LASTEXITCODE -ne 0) { throw 'Rust formatting failed' }
    cargo test --workspace --locked
    if ($LASTEXITCODE -ne 0) { throw 'Rust tests failed' }
    cargo build --locked -p printer-proof
    if ($LASTEXITCODE -ne 0) { throw 'CLI build failed' }
    cargo clippy --workspace --all-targets --locked -- -D warnings
    if ($LASTEXITCODE -ne 0) { throw 'Rust clippy failed' }
    python -m pytest tests/phase0 -q -p no:cacheprovider
    if ($LASTEXITCODE -ne 0) { throw 'Python Phase 0 tests failed' }
    node packages/printplan/typescript/printplan.ts
    if ($LASTEXITCODE -ne 0) { throw 'TypeScript fixture checks failed' }
    python scripts/phase0/verify_evidence.py
    if ($LASTEXITCODE -ne 0) { throw 'Corpus/SPDX evidence checks failed' }
    if ($Renderer) {
        $env:PRINTBOT_PDFIUM_DLL = (Resolve-Path '.tools/pdfium/pypdfium2_raw/pdfium.dll').Path
        $env:PRINTBOT_PDFIUM_SHA256 = '69f1e860f6742fbaafcc4db80e785eec9a4ee0da36ea6d1dc0867ea0f18baea6'
        cargo test --locked -p printer-proof audited_pdfium_renders -- --ignored
        if ($LASTEXITCODE -ne 0) { throw 'Explicit PDFium renderer check failed' }
    }
} finally { Pop-Location }
