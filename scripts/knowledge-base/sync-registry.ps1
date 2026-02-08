<#
.SYNOPSIS
    Syncs Questerix codebase metadata to the Supabase AI Performance Registry.
.DESCRIPTION
    Iterates through the project structure, extracts configuration from master-config.json,
    calculates code metrics, and upserts everything to Supabase.
#>

param(
    [string]$ConfigFile = "master-config.json",
    [switch]$Reset
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
Set-Location $RootDir

# 1. Load Configuration
if (-not (Test-Path $ConfigFile)) {
    Write-Error "Config file not found: $ConfigFile"
}
$config = Get-Content $ConfigFile -Raw | ConvertFrom-Json

# 2. Define Registry Items
$registryItems = @(
    # Apps from Cloudflare Config
    @{ name = $config.cloudflare.admin_project; type = "app"; platform = "cloudflare-pages"; path = "admin-panel"; stack = @{ framework = "react"; build = "vite" } }
    @{ name = $config.cloudflare.student_project; type = "app"; platform = "cloudflare-pages"; path = "student-app"; stack = @{ framework = "flutter"; target = "web" } }
    @{ name = $config.cloudflare.landing_project; type = "app"; platform = "cloudflare-pages"; path = "landing-pages"; stack = @{ framework = "react"; build = "vite" } }
    
    # Core Infrastructure
    @{ name = "questerix-backend"; type = "service"; platform = "supabase"; path = "supabase"; stack = @{ database = "postgresql"; rls = "enabled" } }
    @{ name = "project-oracle"; type = "service"; platform = "local-psh"; path = "scripts/knowledge-base"; stack = @{ engine = "pgvector"; model = "text-embedding-3-small" } }
    @{ name = "questerix-domain"; type = "library"; platform = "dart-package"; path = "questerix_domain"; stack = @{ framework = "dart"; codegen = "freezed" } }
)

Write-Host "🧠 Syncing Knowledge Registry to Supabase..." -ForegroundColor Cyan

# 3. Generate SQL for Upsert
$sql = "BEGIN;`n"

foreach ($item in $registryItems) {
    $name = $item.name
    $type = $item.type
    $platform = $item.platform
    $stackJson = $item.stack | ConvertTo-Json -Compress
    
    $sql += "INSERT INTO kb_registry (name, type, platform, tech_stack) 
             VALUES ('$name', '$type', '$platform', '$stackJson') 
             ON CONFLICT (name) DO UPDATE SET 
                type = EXCLUDED.type, 
                platform = EXCLUDED.platform, 
                tech_stack = EXCLUDED.tech_stack,
                updated_at = NOW();`n"
}

# 4. Process Metrics (LOC)
Write-Host "📊 Calculating Code Metrics..." -ForegroundColor Cyan
$extensions = @{
    'dart' = '*.dart'
    'typescript' = '*.ts','*.tsx'
    'sql' = '*.sql'
    'powershell' = '*.ps1'
}

foreach ($item in $registryItems) {
    $projectName = $item.name
    $projectPath = Join-Path $RootDir $item.path
    
    if (-not (Test-Path $projectPath)) { continue }
    
    foreach ($lang in $extensions.Keys) {
        $patterns = $extensions[$lang]
        $loc = 0
        $fileCount = 0
        
        foreach ($pattern in $patterns) {
            $files = Get-ChildItem -Path $projectPath -Filter $pattern -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch 'node_modules|\.dart_tool|build|dist' }
            foreach ($file in $files) {
                $loc += (Get-Content $file.FullName | Measure-Object -Line).Lines
                $fileCount++
            }
        }
        
        if ($fileCount -gt 0) {
            $sql += "INSERT INTO kb_metrics (project_name, language, lines_of_code, file_count)
                     VALUES ('$projectName', '$lang', $loc, $fileCount)
                     ON CONFLICT (project_name, language) DO UPDATE SET
                        lines_of_code = EXCLUDED.lines_of_code,
                        file_count = EXCLUDED.file_count,
                        last_analyzed_at = NOW();`n"
        }
    }
}

$sql += "COMMIT;"

# Save SQL to temporary file for inspection
$sqlFile = Join-Path $RootDir "registry-sync.sql"
$sql | Out-File $sqlFile -Encoding utf8

Write-Host "✅ SQL Batch generated: $sqlFile" -ForegroundColor Green
Write-Host "🚀 Run with: supabase db execute --file $sqlFile (or use agent tool)" -ForegroundColor Yellow
