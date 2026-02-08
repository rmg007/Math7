# Universal Knowledge Integration for Windows PowerShell
# Sets up universal knowledge sharing for all IDEs

Write-Host "🔗 Setting up Universal Knowledge Sharing Integration..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Get the root directory of the Questerix project
$QuesterixRoot = Split-Path -Parent $PSScriptRoot
$UniversalDir = Join-Path $QuesterixRoot "scripts\universal-knowledge"

Write-Host "📁 Questerix Root: $QuesterixRoot" -ForegroundColor Green
Write-Host "📁 Universal Knowledge Dir: $UniversalDir" -ForegroundColor Green

# Check if universal knowledge system is built
if (-not (Test-Path "$UniversalDir\dist")) {
    Write-Host "🔨 Building Universal Knowledge System..." -ForegroundColor Yellow
    Set-Location $UniversalDir
    npm run build
    Set-Location $QuesterixRoot
}

# Create directories if they don't exist
$CursorDir = Join-Path $QuesterixRoot ".cursor"
$QodoDir = Join-Path $QuesterixRoot ".qodo"
$DevcontainerDir = Join-Path $QuesterixRoot ".devcontainer"
$AgentWorkflowsDir = Join-Path $QuesterixRoot ".agent\workflows"

foreach ($dir in @($CursorDir, $QodoDir, $DevcontainerDir, $AgentWorkflowsDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Write-Host "📝 Creating IDE integration scripts..." -ForegroundColor Yellow

# Cursor integration
$CursorIntegration = @"
// Cursor Knowledge Integration
const { UniversalKnowledgeSystem } = require('../../scripts/universal-knowledge/dist/index.js');

async function searchKnowledge(query) {
    const system = new UniversalKnowledgeSystem();
    await system.initialize();
    return await system.search(query);
}

// Export for Cursor usage
global.searchUniversalKnowledge = searchKnowledge;

console.log('✅ Cursor Knowledge Integration loaded');
"@

Set-Content -Path (Join-Path $CursorDir "knowledge-integration.js") -Value $CursorIntegration

# Qodo integration
$QodoIntegration = @"
// Qodo Knowledge Integration
const { UniversalKnowledgeSystem } = require('../../scripts/universal-knowledge/dist/index.js');

async function searchKnowledge(query) {
    const system = new UniversalKnowledgeSystem();
    await system.initialize();
    return await system.search(query);
}

// Export for Qodo usage
global.searchUniversalKnowledge = searchKnowledge;

console.log('✅ Qodo Knowledge Integration loaded');
"@

Set-Content -Path (Join-Path $QodoDir "knowledge-integration.js") -Value $QodoIntegration

# Codespaces integration
$CodespacesIntegration = @"
#!/bin/bash
# Codespaces Knowledge Integration

echo "🔧 Setting up Universal Knowledge for Codespaces..."

# Set environment variables
export UNIVERSAL_KNOWLEDGE_ENABLED=true
export UNIVERSAL_KNOWLEDGE_PATH="/workspace/scripts/universal-knowledge"

# Add to PATH
export PATH="`$PATH:`$UNIVERSAL_KNOWLEDGE_PATH/dist"

# Create alias for easy access
alias uk-search="node `$UNIVERSAL_KNOWLEDGE_PATH/dist/index.js"

echo "✅ Codespaces Knowledge Integration complete"
echo "💡 Use 'uk-search \"your query\"' to search knowledge base"
"@

Set-Content -Path (Join-Path $DevcontainerDir "knowledge-integration.sh") -Value $CodespacesIntegration

# Antigravity integration
$AntigravityIntegration = @"
---
description: Universal Knowledge Search
---

# 🔍 Universal Knowledge Search

Search the universal knowledge base for any topic.

## Usage
\`\`\`bash
/knowledge-search "your search query"
\`\`\`

## Examples
- `/knowledge-search "How does offline sync work?"`
- `/knowledge-search "Flutter testing patterns"`
- `/knowledge-search "Supabase RLS policies"`

## Integration
This workflow integrates with the Universal Knowledge Sharing System to provide consistent search results across all IDEs.

---

// turbo
npm run --prefix scripts/universal-knowledge start "QUERY"
"@

Set-Content -Path (Join-Path $AgentWorkflowsDir "knowledge-search.md") -Value $AntigravityIntegration

# Create global configuration
$GlobalConfig = @{
    version = "1.0.0"
    enabled = $true
    default_threshold = 0.5
    default_count = 5
    cache_enabled = $true
    fallback_enabled = $true
    ide_specific = @{
        cursor = @{
            enabled = $true
            config_files = @(".cursorrules", "AI_CODING_INSTRUCTIONS.md")
        }
        qodo = @{
            enabled = $true
            config_files = @("QODO_GUIDE.md")
        }
        codespaces = @{
            enabled = $true
            config_files = @(".devcontainer/devcontainer.json")
        }
        antigravity = @{
            enabled = $true
            config_files = @(".agent/workflows/", ".cursorrules")
        }
    }
}

$GlobalConfigJson = $GlobalConfig | ConvertTo-Json -Depth 3
Set-Content -Path (Join-Path $QuesterixRoot ".universal-knowledge-config.json") -Value $GlobalConfigJson

Write-Host ""
Write-Host "✅ Universal Knowledge Integration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Integration Summary:" -ForegroundColor Cyan
Write-Host "  🟢 Cursor: .cursor\knowledge-integration.js" -ForegroundColor White
Write-Host "  🟢 Qodo: .qodo\knowledge-integration.js" -ForegroundColor White
Write-Host "  🟢 Codespaces: .devcontainer\knowledge-integration.sh" -ForegroundColor White
Write-Host "  🟢 Antigravity: .agent\workflows\knowledge-search.md" -ForegroundColor White
Write-Host "  🟢 Global Config: .universal-knowledge-config.json" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Configure your .env file in scripts\universal-knowledge\" -ForegroundColor White
Write-Host "  2. Test with: npm run --prefix scripts\universal-knowledge start 'test query'" -ForegroundColor White
Write-Host "  3. Check IDE-specific integration files for usage instructions" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed documentation, see: scripts\universal-knowledge\README.md" -ForegroundColor Cyan
