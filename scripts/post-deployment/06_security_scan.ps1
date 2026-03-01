<#
.SYNOPSIS
Runs a dockerized OWASP ZAP baseline scan against a target URL.
To be used for lightweight post-deployment security scanning (Header checks, basic XSS vectors).

.PARAMETER TargetUrl
The URL to scan (default is https://app.questerix.com/).

.PARAMETER ReportName
The name of the generated HTML report file.
#>

param (
    [string]$TargetUrl = "https://app.questerix.com/",
    [string]$ReportName = "zap-baseline-report.html"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting Lightweight Security Scan using OWASP ZAP Base Scanner..." -ForegroundColor Cyan
Write-Host "Target URL: $TargetUrl" -ForegroundColor Cyan
Write-Host "Report Name: $ReportName" -ForegroundColor Cyan

# Ensure Docker is running by checking docker info
try {
    Write-Host "Testing Docker connection..."
    docker info *> $null
} catch {
    Write-Error "Docker is not running or not accessible. Please start Docker Desktop/Daemon."
}

# The host directory we map for ZAP to save the report
$HostReportDir = (Get-Item -Path ".\").FullName

# Run OWASP ZAP baseline scan in Docker
# -t indicates the target
# -r indicates the report filename (generated inside the mapped /zap/wrk/ directory)
Write-Host "Pulling ghcr.io/zaproxy/zaproxy:stable and running scan (this may take a few minutes)..." -ForegroundColor Yellow

# Use -I to ignore specific warning exit codes so script passes and we can manually check the report.
$DockerArgs = @("run", "--rm", "-v", "$($HostReportDir):/zap/wrk/:rw", "-t", "ghcr.io/zaproxy/zaproxy:stable", "zap-baseline.py", "-t", $TargetUrl, "-r", $ReportName, "-I")

& docker $DockerArgs

Write-Host "Scan complete." -ForegroundColor Green
$ReportPath = Join-Path -Path $HostReportDir -ChildPath $ReportName

if (Test-Path $ReportPath) {
    Write-Host "Report generated at: $ReportPath" -ForegroundColor Green
    Write-Host "Open this file in a browser to view the security findings."
} else {
    Write-Host "Warning: Report file not found at expected path $ReportPath" -ForegroundColor Red
}
