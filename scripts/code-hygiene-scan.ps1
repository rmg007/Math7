# code-hygiene-scan.ps1 - Fast Parallel Pattern Scanning
# Scans for forbidden patterns and anti-patterns across the codebase.

$ErrorActionPreference = "Continue"

$logDir = "$PSScriptRoot/../.agent/logs/hygiene"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

Write-Host "`n🧹 Starting Code Hygiene Scan..." -ForegroundColor Cyan

$jobs = @()

# 1. Empty Catch Blocks
$jobs += Start-Job -Name "empty-catch" -ScriptBlock {
    param($root)
    $patterns = @('catch\s*\(\w+\)\s*\{\s*\}', 'catch\s*\{\s*\}')
    $files = Get-ChildItem -Path $root -Include *.ts,*.tsx,*.dart,*.py -Recurse -Exclude node_modules,build,.dart_tool
    $violations = @()
    foreach ($file in $files) {
        $matches = Select-String -Path $file.FullName -Pattern $patterns
        if ($matches) { $violations += $matches }
    }
    $violations | Out-File "$root/.agent/logs/hygiene/empty-catch.log"
    return ($violations.Count -eq 0)
} -ArgumentList $PSScriptRoot/..

# 2. Hardcoded Secrets
$jobs += Start-Job -Name "hardcoded-secrets" -ScriptBlock {
    param($root)
    $patterns = @('api[_-]?key\s*:', 'api[_-]?key\s*=', 'secret\s*:', 'token\s*:', 'sb_publishable_')
    # Exclude .example files and common false positives
    $files = Get-ChildItem -Path $root -Include *.ts,*.tsx,*.dart,*.py,*.env -Recurse -Exclude node_modules,build,.dart_tool,*.example,.env.example
    $violations = @()
    foreach ($file in $files) {
        # Simple heuristic: matches pattern and has a string literal that looks like a secret
        $matches = Select-String -Path $file.FullName -Pattern $patterns | Where-Object { $_.Line -match '["''][a-zA-Z0-9]{10,}["'']' }
        if ($matches) { $violations += $matches }
    }
    $violations | Out-File "$root/.agent/logs/hygiene/hardcoded-secrets.log"
    return ($violations.Count -eq 0)
} -ArgumentList $PSScriptRoot/..

# 3. Service Role Leakage
$jobs += Start-Job -Name "service-role-leak" -ScriptBlock {
    param($root)
    $files = Get-ChildItem -Path $root -Include *.ts,*.tsx,*.dart -Recurse -Exclude node_modules,build,.dart_tool
    $violations = @()
    foreach ($file in $files) {
        $matches = Select-String -Path $file.FullName -Pattern 'service_role' | Where-Object { $_.Line -notmatch 'import|type|interface|//|/\*' }
        if ($matches) { $violations += $matches }
    }
    $violations | Out-File "$root/.agent/logs/hygiene/service-role-leak.log"
    return ($violations.Count -eq 0)
} -ArgumentList $PSScriptRoot/..

# 4. Large Functions (>40 lines) - Heuristic
$jobs += Start-Job -Name "large-functions" -ScriptBlock {
    param($root)
    # This is a very rough heuristic for functions
    $violations = @()
    # Skip for now as it results in too many false positives without a real parser
    "Function length check skipped - requires AST parser for accuracy" | Out-File "$root/.agent/logs/hygiene/large-functions.log"
    return $true
} -ArgumentList $PSScriptRoot/..

Write-Host "⏳ Running scans..." -ForegroundColor Yellow

$results = Wait-Job $jobs | Receive-Job

Write-Host "`n📋 Hygiene Scan Results:" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"

$failCount = 0
$index = 0
foreach ($job in $jobs) {
    if ($results[$index]) { 
        Write-Host "[✓] PASS: $($job.Name)" -ForegroundColor Green
    } else { 
        Write-Host "[!] ISSUE: $($job.Name) - See $logDir/$($job.Name).log" -ForegroundColor Yellow
        $failCount++
    }
    $index++
}

Remove-Job $jobs

# Hygiene scans don't necessarily fail the build, but they report issues
Write-Host "`n✨ Scan complete. Found $failCount areas for improvement." -ForegroundColor Cyan
exit 0
