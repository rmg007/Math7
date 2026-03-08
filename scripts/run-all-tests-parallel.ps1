<#
.SYNOPSIS
    High-Performance Parallel Testing Gate for Questerix.
.DESCRIPTION
    Runs Unit Tests, Linting, and Typechecking in parallel using PowerShell background jobs.
    Optimizes for CI/CD speed.
#>

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$AdminDir = Join-Path $ProjectRoot "admin-panel"

Write-Host "🚀 Starting Parallel Test Gate..." -ForegroundColor Cyan

# Define Jobs
$Jobs = @(
    @{ Name = "Linting";    Cmd = "npm run lint" },
    @{ Name = "Typecheck";  Cmd = "npm run typecheck" },
    @{ Name = "Unit Tests"; Cmd = "npm run test:unit -- --run" }
)

$StartedJobs = @()

Push-Location $AdminDir
try {
    foreach ($j in $Jobs) {
        Write-Host "⚡ Spawning job: $($j.Name)..." -ForegroundColor Gray
        $Job = Start-Job -ScriptBlock {
            param($dir, $cmd)
            Set-Location $dir
            # We use Invoke-Expression to run the string command
            Invoke-Expression $cmd
        } -ArgumentList $AdminDir, $j.Cmd -Name $j.Name
        $StartedJobs += $Job
    }

    Write-Host "⏳ Waiting for jobs to complete..." -ForegroundColor Yellow
    Wait-Job -Job $StartedJobs | Out-Null

    $AllSuccess = $true
    foreach ($j in $StartedJobs) {
        $Results = Receive-Job -Job $j
        if ($j.State -ne 'Completed' -or $j.ChildJobs[0].ExitCode -ne 0) {
            Write-Host "❌ Job Failed: $($j.Name)" -ForegroundColor Red
            Write-Host $Results -ForegroundColor Gray
            $AllSuccess = $false
        } else {
            Write-Host "✅ Job Passed: $($j.Name)" -ForegroundColor Green
        }
    }

    if (-not $AllSuccess) {
        Write-Host "🛑 PRE-DEPLOY TESTING FAILED! Pipeline halted." -ForegroundColor Red
        exit 1
    }

    Write-Host "✨ All parallel tests passed!" -ForegroundColor Green
} finally {
    Remove-Job -Job $StartedJobs
    Pop-Location
}
