param(
    [string]$ConfigFile,
    [string]$SecretsFile = ".secrets"
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

$Config = Get-Content $ConfigFile | ConvertFrom-Json
$Secrets = @{}
if (Test-Path $SecretsFile) {
    Get-Content $SecretsFile | ForEach-Object {
        if ($_ -match '^([A-Z_]+)=(.*)$') {
            $Secrets[$Matches[1]] = $Matches[2].Trim()
        }
    }
} else {
    Write-Host "[WARN] .secrets file not found. Some phases may fail." -ForegroundColor Yellow
}

if (-not $Secrets.ContainsKey('SUPABASE_SERVICE_KEY')) {
    throw "SUPABASE_SERVICE_KEY not found in .secrets!"
}

$projectRef = $Config.supabase.project_ref
$region = $Config.supabase.region

Write-Host "Pushing migrations to project: $projectRef ($region)" -ForegroundColor Cyan
if ($Secrets.ContainsKey('SUPABASE_DB_PASSWORD')) {
    $dbPass = $Secrets['SUPABASE_DB_PASSWORD']
    Write-Host "Linking to project: $projectRef" -ForegroundColor Gray
    
    $OldEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    
    npx supabase link --project-ref $projectRef --password "$dbPass" 2>&1 | Write-Host

    # P0: Migration Divergence Gate
    Write-Host "Checking migration status..." -ForegroundColor Gray
    $migrationList = npx supabase migration list --password "$dbPass" 2>&1
    
    $hasDivergence = $false
    $divergedVersions = @()
    
    foreach ($line in $migrationList) {
        # Look for lines that have a Remote version but no Local version
        # Format is:  [Local] | [Remote] | [Time]
        if ($line -match '^\s{3,}\d*\s+\|\s+(\d{14})\s+\|') {
            $localPart = $line.Split('|')[0].Trim()
            $remoteVersion = $Matches[1]
            if ([string]::IsNullOrWhiteSpace($localPart)) {
                $hasDivergence = $true
                $divergedVersions += $remoteVersion
            }
        }
    }

    if ($hasDivergence) {
        Write-Host "[FAIL] Migration divergence detected!" -ForegroundColor Red
        Write-Host "Remote database has migrations not present in your local 'supabase/migrations' directory:" -ForegroundColor Yellow
        foreach ($v in $divergedVersions) { Write-Host "  - $v" -ForegroundColor Yellow }
        Write-Host "`nTo fix this, you must either:" -ForegroundColor Cyan
        Write-Host "1. Repair the remote history (if those migrations were deleted/renamed):" -ForegroundColor White
        Write-Host "   npx supabase migration repair --status reverted $($divergedVersions -join ' ')" -ForegroundColor Gray
        Write-Host "2. Pull the missing migrations from the remote database:" -ForegroundColor White
        Write-Host "   npx supabase db pull" -ForegroundColor Gray
        throw "Supabase migration divergence gate failed. Please resolve history mismatch before deploying."
    }

    Write-Host "Pushing migrations..." -ForegroundColor Gray
    npx supabase db push --password "$dbPass" --yes 2>&1 | Write-Host
    
    $ErrorActionPreference = $OldEAP
    if ($LASTEXITCODE -ne 0) { throw "Supabase migration push failed" }
} else {
    Write-Host "[WARN] SUPABASE_DB_PASSWORD not found. Skipping migration push." -ForegroundColor Yellow
}

Write-Host "Generating TypeScript types..." -ForegroundColor Cyan
$typePath = Join-Path $RootDir "packages\core\src\types\database.ts"
$OldEAP = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$output = npx supabase gen types typescript --project-id $projectRef 2>&1
$ErrorActionPreference = $OldEAP

if ($LASTEXITCODE -eq 0) {
    $cleanOutput = $output | Where-Object {
        $_ -notmatch "^A new version of Supabase CLI" -and
        $_ -notmatch "^We recommend updating" -and
        $_ -notmatch "^https://supabase.com/docs" -and
        $_ -notmatch "^\[WARN\]" -and
        $_ -notmatch "^\[INFO\]"
    }
    $cleanOutput | Out-File $typePath -Encoding utf8
} else {
    $output | ForEach-Object { Write-Host "[FAIL] $_" -ForegroundColor Red }
    throw "Supabase type generation failed"
}

Write-Host "[PASS] Supabase synchronized" -ForegroundColor Green
