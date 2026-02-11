# code-hygiene-scan.ps1 - Fast Parallel Pattern Scanning
# Scans for forbidden patterns and anti-patterns.

$ErrorActionPreference = "Continue"

$logDir = "$PSScriptRoot/../.agent/logs/hygiene"
if (!(Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

Write-Host "🧹 Starting Code Hygiene Scan..." -ForegroundColor Cyan

$rootPath = Resolve-Path "$PSScriptRoot/.."
$jobs = @()

# 1. Empty Catch Blocks
$jobs += Start-Job -Name "empty-catch" -ScriptBlock {
    param($root)
    $patterns = @('catch\s*\(\w+\)\s*\{\s*\}', 'catch\s*\{\s*\}')
    $foundFiles = Get-ChildItem -Path $root -Include *.ts,*.tsx,*.dart,*.py -Recurse -Exclude node_modules,build,.dart_tool
    $foundMatches = @()
    foreach ($file in $foundFiles) {
        $m = Select-String -Path $file.FullName -Pattern $patterns
        if ($m) { $foundMatches += $m }
    }
    $foundMatches | Out-File "$root/.agent/logs/hygiene/empty-catch.log"
    exit $foundMatches.Count
} -ArgumentList $rootPath

# 2. Hardcoded Secrets
$jobs += Start-Job -Name "hardcoded-secrets" -ScriptBlock {
    param($root)
    $patterns = @('api[_-]?key\s*:', 'api[_-]?key\s*=', 'secret\s*:', 'token\s*:', 'sb_publishable_')
    $foundFiles = Get-ChildItem -Path $root -Include *.ts,*.tsx,*.dart,*.py,*.env -Recurse -Exclude node_modules,build,.dart_tool,*.example,.env.example
    $foundMatches = @()
    foreach ($file in $foundFiles) {
        $m = Select-String -Path $file.FullName -Pattern $patterns | Where-Object { $_.Line -match '["''][a-zA-Z0-9]{10,}["'']' }
        if ($m) { $foundMatches += $m }
    }
    $foundMatches | Out-File "$root/.agent/logs/hygiene/hardcoded-secrets.log"
    exit $foundMatches.Count
} -ArgumentList $rootPath

# 3. Service Role Leakage
$jobs += Start-Job -Name "service-role-leak" -ScriptBlock {
    param($root)
    $foundFiles = Get-ChildItem -Path $root -Include *.ts,*.tsx,*.dart -Recurse -Exclude node_modules,build,.dart_tool
    $foundMatches = @()
    foreach ($file in $foundFiles) {
        $m = Select-String -Path $file.FullName -Pattern 'service_role' | Where-Object { $_.Line -notmatch 'import|type|interface|//|/\*' }
        if ($m) { $foundMatches += $m }
    }
    $foundMatches | Out-File "$root/.agent/logs/hygiene/service-role-leak.log"
    exit $foundMatches.Count
} -ArgumentList $rootPath

Write-Host "⏳ Running scans..." -ForegroundColor Yellow
$jobs | Wait-Job | Out-Null

Write-Host "`n📋 Hygiene Scan Results:" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"

$issueCount = 0
foreach ($job in $jobs) {
    if ($job.ChildJobs[0].ExitCode -eq 0) { 
        Write-Host "[✓] PASS: $($job.Name)" -ForegroundColor Green
    } else { 
        Write-Host "[!] ISSUE: $($job.Name) - See $logDir/$($job.Name).log" -ForegroundColor Yellow
        $issueCount++
    }
}

Remove-Job $jobs
Write-Host "`n✨ Scan complete." -ForegroundColor Cyan
exit 0
