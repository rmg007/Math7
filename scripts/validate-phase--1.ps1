# Phase -1: Environment Validation (PowerShell)
# This script verifies all required tools are installed

$ErrorActionPreference = "Continue"
$errors = 0

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase -1: Environment Validation"
Write-Host "=========================================" -ForegroundColor Cyan

# Check Flutter
Write-Host ""
Write-Host "Checking Flutter..."
try {
    $flutterVersion = (flutter --version 2>$null | Select-String -Pattern "Flutter (\d+\.\d+\.\d+)" | ForEach-Object { $_.Matches.Groups[1].Value })
    if ($flutterVersion) {
        $required = [version]"3.19.0"
        $current = [version]$flutterVersion
        if ($current -ge $required) {
            Write-Host "  OK: Flutter $flutterVersion" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: Flutter version $flutterVersion is below minimum 3.19.0" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "  ERROR: Could not determine Flutter version" -ForegroundColor Red
        $errors++
    }
} catch {
    Write-Host "  ERROR: Flutter not found" -ForegroundColor Red
    $errors++
}

# Check Node
Write-Host ""
Write-Host "Checking Node.js..."
try {
    $nodeVersion = (node --version 2>$null) -replace 'v', ''
    if ($nodeVersion) {
        $required = [version]"18.0.0"
        $current = [version]$nodeVersion
        if ($current -ge $required) {
            Write-Host "  OK: Node $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: Node version $nodeVersion is below minimum 18.0.0" -ForegroundColor Red
            $errors++
        }
    }
} catch {
    Write-Host "  ERROR: Node.js not found" -ForegroundColor Red
    $errors++
}

# Check npm
Write-Host ""
Write-Host "Checking npm..."
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "  OK: npm $npmVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "  ERROR: npm not found" -ForegroundColor Red
    $errors++
}

# Check Supabase CLI
Write-Host ""
Write-Host "Checking Supabase CLI..."
try {
    $supabaseOutput = supabase --version 2>$null
    if ($supabaseOutput) {
        Write-Host "  OK: $supabaseOutput" -ForegroundColor Green
        
        # Check authentication
        Write-Host ""
        Write-Host "Checking Supabase authentication..."
        try {
            $null = supabase projects list 2>$null
            Write-Host "  OK: Supabase CLI authenticated" -ForegroundColor Green
        } catch {
            Write-Host "  WARNING: Supabase CLI not authenticated. Run 'supabase login'" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  ERROR: Supabase CLI not found" -ForegroundColor Red
    $errors++
}

# Check Git
Write-Host ""
Write-Host "Checking Git..."
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Host "  OK: $gitVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "  ERROR: Git not found" -ForegroundColor Red
    $errors++
}

# Summary
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "Phase -1 PASSED: All tools validated" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "Phase -1 FAILED: $errors error(s) found" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "BLOCKER: Fix the errors above before proceeding" -ForegroundColor Red
    exit 1
}
