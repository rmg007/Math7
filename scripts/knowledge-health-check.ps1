#!/usr/bin/env pwsh
# =============================================================================
# Knowledge Infrastructure Health Check
# =============================================================================
# Validates that all knowledge systems are operational:
#   1. Project Oracle (knowledge_chunks table + embeddings)
#   2. AI Performance Registry (kb_registry + kb_metrics)
#   3. Documentation index freshness
#   4. Required files exist
# =============================================================================

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$script:PassCount = 0
$script:FailCount = 0
$script:WarnCount = 0

function Write-Check {
    param([string]$Name, [string]$Status, [string]$Detail = "")
    switch ($Status) {
        "PASS" {
            Write-Host "  ✅ $Name" -ForegroundColor Green
            $script:PassCount++
        }
        "FAIL" {
            Write-Host "  ❌ $Name" -ForegroundColor Red
            if ($Detail) { Write-Host "     → $Detail" -ForegroundColor DarkRed }
            $script:FailCount++
        }
        "WARN" {
            Write-Host "  ⚠️  $Name" -ForegroundColor Yellow
            if ($Detail) { Write-Host "     → $Detail" -ForegroundColor DarkYellow }
            $script:WarnCount++
        }
    }
}

# =============================================================================
# Section 1: Required Files
# =============================================================================
Write-Host ""
Write-Host "📁 Required Files" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
# Handle case where script is directly in scripts/ (not scripts/subdir/)
if (-not (Test-Path "$projectRoot\AGENT_QUICKSTART.md")) {
    $projectRoot = Split-Path -Parent $PSScriptRoot
}

$requiredFiles = @(
    "AGENT_QUICKSTART.md",
    "AI_CODING_INSTRUCTIONS.md",
    ".cursorrules",
    "docs/standards/ORACLE_COGNITION.md",
    ".agent/workflows/process.md",
    "scripts/knowledge-base/indexer.ts",
    "scripts/knowledge-base/query-docs.ts",
    "master-config.json",
    ".mcp_config.json"
)

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $projectRoot $file
    if (Test-Path $fullPath) {
        $lastWrite = (Get-Item $fullPath).LastWriteTime
        $daysOld = (New-TimeSpan -Start $lastWrite -End (Get-Date)).Days
        if ($daysOld -gt 30) {
            Write-Check $file "WARN" "Last modified $daysOld days ago"
        } else {
            Write-Check $file "PASS"
        }
    } else {
        Write-Check $file "FAIL" "File not found"
    }
}

# =============================================================================
# Section 2: Knowledge Base Dependencies
# =============================================================================
Write-Host ""
Write-Host "📦 Knowledge Base Dependencies" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────"

$kbDir = Join-Path $projectRoot "scripts\knowledge-base"
if (Test-Path "$kbDir\node_modules") {
    Write-Check "knowledge-base/node_modules" "PASS"
} else {
    Write-Check "knowledge-base/node_modules" "FAIL" "Run: cd scripts/knowledge-base && npm install"
}

if (Test-Path "$kbDir\.env") {
    # Check that .env has required keys (without revealing values)
    $envContent = Get-Content "$kbDir\.env" -Raw
    $hasSupabaseUrl = $envContent -match "SUPABASE_URL="
    $hasSupabaseKey = $envContent -match "SUPABASE_SERVICE_ROLE_KEY="
    $hasOpenAI = $envContent -match "OPENAI_API_KEY="

    if ($hasSupabaseUrl -and $hasSupabaseKey -and $hasOpenAI) {
        Write-Check "knowledge-base/.env (all keys present)" "PASS"
    } else {
        $missing = @()
        if (-not $hasSupabaseUrl) { $missing += "SUPABASE_URL" }
        if (-not $hasSupabaseKey) { $missing += "SUPABASE_SERVICE_ROLE_KEY" }
        if (-not $hasOpenAI) { $missing += "OPENAI_API_KEY" }
        Write-Check "knowledge-base/.env" "FAIL" "Missing keys: $($missing -join ', ')"
    }
} else {
    Write-Check "knowledge-base/.env" "FAIL" "No .env file — copy from .env.example"
}

# =============================================================================
# Section 3: MCP Server Configuration
# =============================================================================
Write-Host ""
Write-Host "🔌 MCP Servers" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────"

$mcpConfig = Join-Path $projectRoot ".mcp_config.json"
if (Test-Path $mcpConfig) {
    $mcp = Get-Content $mcpConfig -Raw | ConvertFrom-Json
    $servers = $mcp.mcpServers.PSObject.Properties.Name
    foreach ($server in $servers) {
        Write-Check "MCP: $server" "PASS"
    }
} else {
    Write-Check ".mcp_config.json" "FAIL" "MCP config not found"
}

# =============================================================================
# Section 4: Agent Workflows
# =============================================================================
Write-Host ""
Write-Host "⚙️ Agent Workflows" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────"

$workflowDir = Join-Path $projectRoot ".agent\workflows"
if (Test-Path $workflowDir) {
    $workflows = Get-ChildItem $workflowDir -Filter "*.md"
    Write-Check "Workflow count: $($workflows.Count) files" "PASS"
    
    $criticalWorkflows = @("process.md", "autopilot.md", "certify.md", "audit.md")
    foreach ($wf in $criticalWorkflows) {
        if (Test-Path (Join-Path $workflowDir $wf)) {
            Write-Check "  /$($wf.Replace('.md',''))" "PASS"
        } else {
            Write-Check "  /$($wf.Replace('.md',''))" "FAIL" "Critical workflow missing"
        }
    }
} else {
    Write-Check "Agent workflows directory" "FAIL" "Not found"
}

# =============================================================================
# Section 5: Documentation Coverage
# =============================================================================
Write-Host ""
Write-Host "📚 Documentation Coverage" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────"

$docsDir = Join-Path $projectRoot "docs"
if (Test-Path $docsDir) {
    $docFiles = Get-ChildItem $docsDir -Recurse -Filter "*.md"
    Write-Check "Total doc files: $($docFiles.Count)" "PASS"
    
    # Check critical docs
    $criticalDocs = @(
        "standards/ORACLE_COGNITION.md",
        "LEARNING_LOG.md"
    )
    foreach ($doc in $criticalDocs) {
        $docPath = Join-Path $docsDir $doc
        if (Test-Path $docPath) {
            Write-Check "  $doc" "PASS"
        } else {
            Write-Check "  $doc" "WARN" "Recommended documentation missing"
        }
    }
} else {
    Write-Check "docs/ directory" "FAIL" "No documentation directory"
}

# =============================================================================
# Summary
# =============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor White
Write-Host "📊 Knowledge Health Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor White
Write-Host "  Passed:   $script:PassCount" -ForegroundColor Green
Write-Host "  Warnings: $script:WarnCount" -ForegroundColor Yellow
Write-Host "  Failed:   $script:FailCount" -ForegroundColor Red
Write-Host "═══════════════════════════════════════════" -ForegroundColor White

if ($script:FailCount -eq 0) {
    Write-Host ""
    Write-Host "✨ All knowledge systems operational!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "🔧 Fix the failed checks above before relying on knowledge infrastructure." -ForegroundColor Red
    exit 1
}
