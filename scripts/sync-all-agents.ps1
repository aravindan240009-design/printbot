<#
.SYNOPSIS
    Global AI Agent Synchronization Script for Windows
.DESCRIPTION
    Synchronizes skills, MCP servers, and environment configurations across:
    - Google Antigravity (~/.gemini/config)
    - OpenAI Codex (~/.codex)
    - Claude CLI / Desktop (~/.claude, AppData)
    - Cursor AI (~/.cursor, AppData)
    - Universal Agent Store (~/.agents)
#>

param (
    [string]$SourceDirectory = "$PSScriptRoot\..\.agents\skills"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Global AI Agent Synchronization (Skills, MCPs, Connectors)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Target Skill Stores
$targetStores = @(
    "$env:USERPROFILE\.gemini\config\skills",
    "$env:USERPROFILE\.codex\skills",
    "$env:USERPROFILE\.agents\skills",
    "$env:USERPROFILE\.claude\skills",
    "$env:USERPROFILE\.cursor\skills",
    "$env:USERPROFILE\.cursor\skills-cursor"
)

if (-not (Test-Path $SourceDirectory)) {
    # Fallback to Codex global store if running outside the xerox project
    $SourceDirectory = "$env:USERPROFILE\.codex\skills"
}

Write-Host "`n[1/2] Synchronizing Skills from: $SourceDirectory" -ForegroundColor Yellow

foreach ($target in $targetStores) {
    if ($target -ne $SourceDirectory) {
        if (-not (Test-Path $target)) {
            New-Item -ItemType Directory -Path $target -Force | Out-Null
        }
        Copy-Item -Path "$SourceDirectory\*" -Destination $target -Recurse -Force
    }
    $count = (Get-ChildItem -Path $target).Count
    Write-Host "  [OK] $target -> $count skills active" -ForegroundColor Green
}

# 2. Global MCP Config Synchronization
Write-Host "`n[2/2] Updating Global MCP Server Configurations..." -ForegroundColor Yellow

$mcpJson = @'
{
  "mcpServers": {
    "playwright": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@playwright/mcp@latest"]
    },
    "context7": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@upstash/context7-mcp@latest"]
    }
  }
}
'@

$mcpLocations = @(
    "$env:USERPROFILE\.gemini\config\mcp_config.json",
    "$env:USERPROFILE\.claude.json",
    "$env:USERPROFILE\.claude\mcp.json",
    "$env:APPDATA\Claude\claude_desktop_config.json",
    "$env:USERPROFILE\.cursor\mcp.json"
)

foreach ($loc in $mcpLocations) {
    $parent = Split-Path -Path $loc -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Set-Content -Path $loc -Value $mcpJson -Force -Encoding UTF8
    Write-Host "  [OK] MCP config active at: $loc" -ForegroundColor Green
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " All Coding Agents (Antigravity, Codex, Cursor, Claude) Synced!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
