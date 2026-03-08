<#
.SYNOPSIS
    Parallel Preflight Validation for Questerix.
.DESCRIPTION
    Runs type checks, linting, and dependency validation in parallel.
    Uses temporary script files for maximum reliability.
#>

$ErrorActionPreference = "Continue"
$StartTime = Get-Date

# 1. Setup Logging & Temp Workdir
$ProjectRoot = Resolve-Path "$PSScriptRoot/.."
$LogDir = "$ProjectRoot/questerix-cortex/outputs/logs/preflight"
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
$TempScripts = "$LogDir/tmp_scripts"
if (!(Test-Path $TempScripts)) { New-Item -ItemType Directory -Path $TempScripts -Force | Out-Null }

Write-Host "Starting Preflight Validation Suite..." -ForegroundColor Cyan

$Jobs = @()

# Function to start a preflight job safely
function Start-PreflightJob {
    param([string]$Name, [string]$DirPath, [string]$CommandText)
    
    if (Test-Path $DirPath) {
        Write-Host "  [+] Queueing $Name..." -ForegroundColor Gray
        $exitFile = "$LogDir/$Name.exit"
        $logFile = "$LogDir/$Name.log"
        $scriptPath = "$TempScripts/$Name.ps1"
        
        if (Test-Path $exitFile) { Remove-Item $exitFile -Force -ErrorAction SilentlyContinue }
        if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }
        
        # Use npx -y to skip prompts and use explicit output redirection
        $scriptContent = @"
try {
    Set-Location "$DirPath"
    & { $CommandText } *>> "$logFile"
    `$LASTEXITCODE | Out-File "$exitFile"
} catch {
    `$_.Exception.Message | Out-File "$logFile" -Append
    1 | Out-File "$exitFile"
}
"@
        $scriptContent | Out-File $scriptPath -Encoding UTF8
        return Start-Job -Name $Name -ScriptBlock { param($s) & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $s } -ArgumentList $scriptPath
    } else {
        return $null
    }
}

# --- JOB DEFINITIONS ---

# 1. Admin Panel Typecheck
$Jobs += Start-PreflightJob "admin-typecheck" "$ProjectRoot/admin-panel" "npx -y tsc --noEmit"

# 2. Admin Panel Linting
$Jobs += Start-PreflightJob "admin-lint" "$ProjectRoot/admin-panel" "npm run lint"

# 3. Student App Static Analysis
$Jobs += Start-PreflightJob "student-analyze" "$ProjectRoot/questerix-student-app" "flutter analyze"

# 4. Dependency Validation
$Jobs += Start-PreflightJob "deps-validate" "$ProjectRoot" "npm run deps:validate"

$Jobs = $Jobs | Where-Object { $null -ne $_ }
if ($Jobs.Count -eq 0) {
    Write-Host "⚠️ No preflight jobs to run." -ForegroundColor Yellow
    exit 0
}

Write-Host "Waiting for jobs..." -ForegroundColor Yellow
$Jobs | Wait-Job | Out-Null

$EndTime = Get-Date
$Duration = $EndTime - $StartTime

Write-Host "Preflight Results (Duration: $($Duration.TotalSeconds.ToString("F1"))s):" -ForegroundColor Cyan
Write-Host "---------------------------------------------------"

$FailCount = 0
foreach ($j in $Jobs) {
    $exitFile = "$LogDir/$($j.Name).exit"
    $exitContent = if (Test-Path $exitFile) { Get-Content $exitFile -ErrorAction SilentlyContinue } else { "N/A" }
    $exit = if ($null -ne $exitContent) { $exitContent.ToString().Trim() } else { "N/A" }
    $status = if ($exit -eq '0') { "PASS" } else { "FAIL" }
    $color = if ($status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$status] $($j.Name) (Exit: $exit)" -ForegroundColor $color
    if ($status -ne "PASS") { $FailCount++ }
}

# Final Clean
Get-ChildItem -Path $LogDir -Filter "*.exit" | Remove-Item -Force -ErrorAction SilentlyContinue
Remove-Job $Jobs -Force

if ($FailCount -gt 0) {
    Write-Host "Preflight FAILED with $FailCount error(s)." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Preflight PASSED!" -ForegroundColor Green
    exit 0
}
