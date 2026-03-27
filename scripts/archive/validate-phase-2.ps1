$ErrorActionPreference = "Stop"
Write-Host "Validating Phase 2..." -ForegroundColor Cyan

# 1. Check math7-domain package
if (-not (Test-Path "math7_domain/pubspec.yaml")) {
    Write-Error "math7_domain/pubspec.yaml not found"
}
if (-not (Test-Path "math7_domain/lib/math7_domain.dart")) {
    Write-Error "math7_domain/lib/math7_domain.dart not found"
}

# 2. Check generated Dart files
if (-not (Test-Path "math7_domain/lib/src/models/domain.freezed.dart")) {
    Write-Warning "domain.freezed.dart not found (build_runner might be running or failed)"
}

# 3. Check TypeScript types
$tsPath = "admin-panel/src/lib/database.types.ts"
if (-not (Test-Path $tsPath)) {
    Write-Error "database.types.ts not found"
}
$tsContent = Get-Content $tsPath -Raw
if ($tsContent.Length -lt 100) {
    Write-Error "database.types.ts seems empty or too small"
}

# 4. Check Student App integration
$studentPubspec = Get-Content "student-app/pubspec.yaml" -Raw
if ($studentPubspec -notmatch "math7_domain") {
    Write-Error "student-app/pubspec.yaml does not reference math7_domain"
}

Write-Host "Phase 2 validation passed!" -ForegroundColor Green
