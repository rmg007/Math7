# supabase/scripts/check-destructive.ps1
# Scans migrations for potentially destructive SQL statements

$migrationsDir = (Get-Item (Join-Path $PSScriptRoot "..")).FullName + "\migrations"
$destructivePatterns = @(
    "DROP TABLE",
    "DROP COLUMN",
    "DROP SCHEMA",
    "TRUNCATE",
    "DELETE FROM",
    "ALTER TABLE.*DROP"
)

$foundIssues = 0

Get-ChildItem -Path $migrationsDir -Filter *.sql | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content -Raw $file
    
    foreach ($pattern in $destructivePatterns) {
        if ($content -match $pattern) {
            Write-Warning "Potentially destructive command found in $(Split-Path $file -Leaf): $pattern"
            $foundIssues++
        }
    }
}

if ($foundIssues -gt 0) {
    Write-Host "⚠️ Security Audit: $foundIssues potentially destructive migration(s) detected." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Security Audit: No destructive migrations detected." -ForegroundColor Green
    exit 0
}
