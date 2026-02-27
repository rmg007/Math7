$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module (Join-Path $ScriptDir "_shared\Import-EnvFile.psm1") -Force

# Load environment variables from .secrets or .env.test.local
$envFiles = @(
    (Join-Path $ScriptDir "..\.secrets"),
    (Join-Path $ScriptDir "..\.env.test.local")
)
Import-EnvFile -FilePaths $envFiles

# Use stored credentials
$dbPassword = $env:SUPABASE_DB_PASSWORD
if (-not $dbPassword) {
    Write-Error "SUPABASE_DB_PASSWORD environment variable is not set. Please add it to .secrets or set it in your environment."
    exit 1
}
$projectRef = "qvslbiceoonrgjxzkotb"
$dbUrl = "postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres"

Write-Host "Generating TypeScript types from DB..." -ForegroundColor Cyan

# Fallback to npx
$cmd = "npx -y supabase"

# Run command
$cmdArgs = "gen types typescript --db-url ""$dbUrl"""
$outputFile = "../admin-panel/src/lib/database.types.ts"

Write-Host "Running: $cmd $cmdArgs > $outputFile" -ForegroundColor Cyan
Set-Location "scripts"
Invoke-Expression "$cmd $cmdArgs > $outputFile"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Types generated successfully at $outputFile" -ForegroundColor Green
} else {
    Write-Host "Type generation failed." -ForegroundColor Red
    exit $LASTEXITCODE
}
