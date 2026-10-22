# Explicit virtual output only. Physical devices use the supervised bench harness.
param([int]$Copies=1,[ValidateSet('bw','grayscale','color')][string]$Color='bw')
$ErrorActionPreference='Stop'
Push-Location (Join-Path $PSScriptRoot '../..')
try {
    . ./scripts/phase0/env.ps1
    cargo build --locked -p printer-proof
    if ($LASTEXITCODE -ne 0) { throw 'Proof build failed' }
    $taskRun = [Guid]::NewGuid().ToString()
    $taskFolder=Join-Path (Get-Location) ".phase0-local/demo-$taskRun"
    New-Item -ItemType Directory -Path $taskFolder | Out-Null
    $taskPlan=Join-Path $taskFolder 'plan.json'
    $taskOutput=Join-Path $taskFolder 'virtual-output.pdf'
    python scripts/phase0/make_demo_plan.py --output $taskPlan --copies $Copies --color $Color
    if ($LASTEXITCODE -ne 0) { throw 'Demo plan generation failed' }
    & './target/debug/printer-proof.exe' print --plan $taskPlan --pdf fixtures/printable/portrait-3.pdf --shop-id 11111111-1111-4111-8111-111111111111 --printer 'Microsoft Print to PDF' --pdfium (Resolve-Path '.tools/pdfium/pypdfium2_raw/pdfium.dll').Path --pdfium-sha256 69f1e860f6742fbaafcc4db80e785eec9a4ee0da36ea6d1dc0867ea0f18baea6 --journal .phase0-local/journal --output $taskOutput --trusted-local
    if ($LASTEXITCODE -ne 0) { throw 'Demo failed. Keep journal; reconcile unknown outcomes before any new experiment.' }
    Write-Output "Virtual output: $taskOutput. Physical completion remains unknown."
} finally { Pop-Location }
