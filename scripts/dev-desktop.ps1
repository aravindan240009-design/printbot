# Launch Desktop UI in Dev Mode (sets local Rust and Node environment automatically)
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

. "$repoRoot/scripts/phase0/env.ps1"
pnpm --filter @xerox/desktop dev
