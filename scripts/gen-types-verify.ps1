# gen-types-verify.ps1 - Type Generation + Compilation Verification
# Generates Supabase types and immediately verifies TypeScript compilation.

$ErrorActionPreference = "Stop"
$startTime = Get-Date

Write-Host "`n Syncing Supabase Types..." -ForegroundColor Cyan

# 1. Generate Types
Write-Host " Step 1/3: Generating TypeScript types..." -ForegroundColor Yellow
& "$PSScriptRoot/gen_types.ps1"

# 2. Verify Typecheck in Parallel jobs
Write-Host " Step 2/3: Verifying compilation..." -ForegroundColor Yellow
$root = Resolve-Path "$PSScriptRoot/.."
$jobs = @()

$jobs += Start-Job -Name "admin-typecheck" -ScriptBlock {
    param($rootPath)
    Set-Location "$rootPath/admin-panel"
    npx tsc --noEmit 2>&1
} -ArgumentList $root

$jobs | Wait-Job | Out-Null

$failCount = 0
if ($jobs[0].ChildJobs[0].ExitCode -ne 0) {
    Write-Host "`n ERROR: TypeScript compilation failed after type generation!" -ForegroundColor Red
    $failCount++
}

$endTime = Get-Date
$duration = $endTime - $startTime

Remove-Job $jobs

if ($failCount -eq 0) {
    Write-Host "`n Success! Types are synced and verified (Duration: $($duration.TotalSeconds.ToString("F1"))s)." -ForegroundColor Green
    exit 0
} else {
    exit 1
}
