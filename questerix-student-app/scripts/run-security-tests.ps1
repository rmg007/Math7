#!/usr/bin/env pwsh
# Security Test Runner for Questerix Edge Functions
# This script runs all security-related tests to ensure no regressions
# Note: Tests are designed for Deno runtime, not Node.js/TypeScript compiler

Write-Host "🔒 Questerix Security Test Runner" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Check if Deno is installed
try {
    $DenoVersion = deno --version 2>$null
    Write-Host "✅ Deno found: $DenoVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Deno not found. Please install Deno to run security tests." -ForegroundColor Red
    Write-Host "Install from: https://deno.land/" -ForegroundColor Yellow
    exit 1
}

# Test directories
$SecurityTests = @(
    "supabase/functions/_shared/rate-limiter.test.ts",
    "supabase/functions/_shared/input-sanitizer.test.ts", 
    "supabase/functions/_shared/error-sanitizer.test.ts",
    "supabase/functions/generate-questions/security.test.ts"
)

$PassedTests = 0
$FailedTests = 0
$TotalTests = 0

Write-Host "\n📋 Running security tests with Deno..." -ForegroundColor Yellow

foreach ($TestFile in $SecurityTests) {
    Write-Host "\n📋 Running $TestFile..." -ForegroundColor Yellow
    
    if (Test-Path $TestFile) {
        try {
            # Run Deno test for each security test file
            $TestResult = deno test $TestFile --allow-read --allow-net --allow-env --no-check 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ PASSED: $TestFile" -ForegroundColor Green
                $PassedTests++
                
                # Extract test count from output
                $TestCount = ($TestResult | Select-String "passed \d+").ForEach({ $_.Matches.Value -replace "passed ", "" })
                if ($TestCount) {
                    $TotalTests += [int]$TestCount
                }
            }
            else {
                Write-Host "❌ FAILED: $TestFile" -ForegroundColor Red
                Write-Host $TestResult -ForegroundColor Red
                $FailedTests++
            }
        }
        catch {
            Write-Host "❌ ERROR running $TestFile`: $($_.Exception.Message)" -ForegroundColor Red
            $FailedTests++
        }
    }
    else {
        Write-Host "⚠️  SKIPPED: $TestFile not found" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "\n📊 Security Test Summary" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Total Tests: $TotalTests" -ForegroundColor White
Write-Host "Passed: $PassedTests" -ForegroundColor Green
Write-Host "Failed: $FailedTests" -ForegroundColor Red

if ($FailedTests -gt 0) {
    Write-Host "\n🚨 SECURITY TESTS FAILED!" -ForegroundColor Red
    Write-Host "Security regressions detected. Review and fix failed tests before deployment." -ForegroundColor Red
    exit 1
}
else {
    Write-Host "\n✅ ALL SECURITY TESTS PASSED!" -ForegroundColor Green
    Write-Host "No security regressions detected. Safe to proceed with deployment." -ForegroundColor Green
    exit 0
}
