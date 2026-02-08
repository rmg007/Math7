$ErrorActionPreference = "Stop"

function Test-Command ($command) {
    try {
        $null = Get-Command $command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

Write-Host "Starting agent migration script..." -ForegroundColor Cyan

# Check for supabase CLI
if (Test-Command "supabase") {
    Write-Host "Found 'supabase' in PATH." -ForegroundColor Green
    $cmd = "supabase"
} elseif (Test-Command "npx") {
    Write-Host "'supabase' not found. Falling back to 'npx supabase'." -ForegroundColor Yellow
    $cmd = "npx -y supabase"
} else {
    Write-Error "Neither 'supabase' nor 'npx' found. Cannot run migrations."
    exit 1
}

# Set database credentials
$dbPassword = $env:SUPABASE_DB_PASSWORD
if (-not $dbPassword) {
    Write-Error "SUPABASE_DB_PASSWORD environment variable is not set."
    exit 1
}
$projectRef = "qvslbiceoonrgjxzkotb"
$dbUrl = "postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres"

Write-Host "Constructed DB URL for project $projectRef" -ForegroundColor Cyan

# Define command arguments
# using --db-url avoids the need for 'supabase link' and 'supabase login'
$cmdArgs = "db push --db-url ""$dbUrl"""

# Run the command
Write-Host "Running: $cmd $cmdArgs" -ForegroundColor Cyan
# Set-Location "supabase" # db push --db-url can be run from root if configured, but let's stick to root context or ensure migrations dir is found.
# Actually, db push looks for supabase/migrations by default.
# The previous script changed dir to 'supabase', let's check if that's needed.
# If we are in root, and 'supabase/config.toml' doesn't exist, it might complain.
# safely change to root if needed, but the ps1 is in scripts/
# Let's assume we run from root.

Invoke-Expression "$cmd $cmdArgs"
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "Migration successful!" -ForegroundColor Green
} else {
    Write-Host "Migration failed." -ForegroundColor Red
    exit $exitCode
}
