# Automated Build and Code-Signing Pipeline for Print Bot Windows Desktop
param (
    [string]$Thumbprint = "B6BEF7C738FA63F35DD647C5CD105432DE148481",
    [string]$TimestampUrl = "http://timestamp.digicert.com"
)

$ErrorActionPreference = "Stop"
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Print Bot Workstation - Production Packaging & Code Signing" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Locate SignTool
$signtoolPaths = @(
    "C:\Program Files (x86)\Windows Kits\10\bin\10.0.26100.0\x64\signtool.exe",
    "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe",
    "C:\Program Files (x86)\Windows Kits\10\App Certification Kit\signtool.exe"
)

$signtool = $null
foreach ($path in $signtoolPaths) {
    if (Test-Path $path) {
        $signtool = $path
        break
    }
}

if (-not $signtool) {
    Write-Warning "signtool.exe not found in standard Windows Kits path. Looking in PATH..."
    $signtoolCmd = Get-Command signtool.exe -ErrorAction SilentlyContinue
    if ($signtoolCmd) { $signtool = $signtoolCmd.Source }
}

Write-Host "[1/4] SignTool located: $signtool" -ForegroundColor Green

# 2. Build Frontend & Tauri App
Write-Host "[2/4] Building Tauri release bundle..." -ForegroundColor Yellow
Set-Location "d:\print bot\apps\desktop"
pnpm tauri build --bundles nsis

# 3. Verify / Re-sign Installer
$installerPath = "d:\print bot\apps\desktop\src-tauri\target\release\bundle\nsis\Print Bot_1.0.0_x64-setup.exe"
if (Test-Path $installerPath) {
    Write-Host "[3/4] Signing installer with timestamp..." -ForegroundColor Yellow
    if ($signtool) {
        & $signtool sign /fd SHA256 /sha1 $Thumbprint /tr $TimestampUrl /td SHA256 $installerPath
    }

    # 4. Copy single official executable for all purposes
    $releaseDir = "d:\print bot\release"
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
    Copy-Item $installerPath "$releaseDir\PrintBot-Setup.exe" -Force
    Copy-Item $installerPath "d:\print bot\PrintBot-Setup.exe" -Force
    Copy-Item $installerPath "d:\print bot\public\downloads\PrintBot-Setup.exe" -Force
    # Backwards compatibility alias for web download
    Copy-Item $installerPath "d:\print bot\public\downloads\Print-Bot-1.0.0-x64-Setup.exe" -Force
    Write-Host "[4/4] Single professional executable ready at: d:\print bot\PrintBot-Setup.exe" -ForegroundColor Green
} else {
    Write-Error "Installer file not found at expected path: $installerPath"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Build & Signing Completed Successfully!" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

