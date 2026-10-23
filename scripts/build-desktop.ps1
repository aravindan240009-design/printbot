# Build Standalone Desktop App / Installers (NSIS / MSI)
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

. "$repoRoot/scripts/phase0/env.ps1"
pnpm --filter @xerox/desktop tauri:build
