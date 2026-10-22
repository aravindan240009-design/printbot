<#
.SYNOPSIS
    Xerox PrintFlow SaaS — Automated Windows Development Environment Setup Script
.DESCRIPTION
    Validates developer toolchains, ensures MCP configurations for Codex and Antigravity,
    synchronizes workspace skills, and executes pre-flight tests.
#>

param (
    [switch]$SkipTests = $false,
    [switch]$SkipSync = $false
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Xerox PrintFlow SaaS - Windows Dev Environment Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Audit Installed Core Toolchains
Write-Host "`n[1/4] Checking Core Toolchains..." -ForegroundColor Yellow

$toolNames = @("Node.js", "pnpm", "Python", "Git")
$toolCmds = @{
    "Node.js" = "node -v"
    "pnpm"    = "pnpm -v"
    "Python"  = "python --version"
    "Git"     = "git --version"
}

foreach ($t in $toolNames) {
    try {
        $cmd = $toolCmds[$t]
        $version = Invoke-Expression $cmd 2>$null
        if ($version) {
            Write-Host "  [OK] ${t}: $version" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] ${t} not found or returned empty." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [FAIL] ${t} is missing!" -ForegroundColor Red
    }
}

# 2. Check Codex & Antigravity MCP Configurations
Write-Host "`n[2/4] Verifying MCP Configurations..." -ForegroundColor Yellow

$codexConfig = "$env:USERPROFILE\.codex\config.toml"
if (Test-Path $codexConfig) {
    $content = Get-Content $codexConfig -Raw
    if ($content -match "mcp_servers\.playwright" -and $content -match "mcp_servers\.context7") {
        Write-Host "  [OK] Codex MCP Config: Playwright and Context7 active in $codexConfig" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Codex MCP entries missing in $codexConfig" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARN] Codex config not found at $codexConfig" -ForegroundColor Yellow
}

$antigravityConfig = "$env:USERPROFILE\.gemini\config\mcp_config.json"
if (Test-Path $antigravityConfig) {
    Write-Host "  [OK] Antigravity MCP Config found at $antigravityConfig" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Antigravity MCP config missing at $antigravityConfig" -ForegroundColor Yellow
}

# 3. Synchronize Skills
Write-Host "`n[3/4] Synchronizing Agent Skills..." -ForegroundColor Yellow
$workspaceSkills = "$PSScriptRoot\..\.agents\skills"
$codexSkills = "$env:USERPROFILE\.codex\skills"

if (-not $SkipSync -and (Test-Path $workspaceSkills)) {
    if (-not (Test-Path $codexSkills)) {
        New-Item -ItemType Directory -Path $codexSkills -Force | Out-Null
    }
    Copy-Item -Path "$workspaceSkills\*" -Destination $codexSkills -Recurse -Force
    $skillCount = (Get-ChildItem -Path $codexSkills).Count
    Write-Host "  [OK] Synchronized $skillCount skills into Codex global store." -ForegroundColor Green
} else {
    Write-Host "  [INFO] Skill sync skipped or workspace skills missing." -ForegroundColor Gray
}

# 4. Pre-Flight Verification Tests
if (-not $SkipTests) {
    Write-Host "`n[4/4] Executing Pre-Flight Test Suite..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\.."
    $testResult = & pytest tests/ -v
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] All backend integration and tenant isolation tests passed!" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Test suite failed! Please review test logs." -ForegroundColor Red
    }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " Setup Complete! Start developing with:" -ForegroundColor Cyan
Write-Host "   pnpm dev:web      # Start Next.js customer portal" -ForegroundColor White
Write-Host "   uvicorn services.api.main:app --reload  # Start FastAPI" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
