#!/usr/bin/env pwsh
# Security headers middleware for Cloudflare Pages deployment
# This script adds security headers to the _headers file for Cloudflare Pages

$HeadersFile = "admin-panel\public\_headers"

# Create public directory if it doesn't exist
if (!(Test-Path "admin-panel\public")) {
    New-Item -ItemType Directory -Path "admin-panel\public" -Force
}

# Security headers configuration
$HeadersContent = @"
# Security Headers for Questerix Admin Panel
# Applied to all routes
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: "1; mode=block"
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'

# API routes (more restrictive CSP)
/api/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'

# Static assets (long caching)
/static/*
  Cache-Control: public, max-age=31536000, immutable

# HTML files (no caching)
/*.html
  Cache-Control: no-cache, no-store, must-revalidate
"@

# Write headers file
Set-Content -Path $HeadersFile -Value $HeadersContent -Encoding UTF8

Write-Host "Security headers configuration written to $HeadersFile" -ForegroundColor Green
Write-Host "Headers include:" -ForegroundColor Yellow
Write-Host "  - X-Frame-Options: DENY" -ForegroundColor White
Write-Host "  - X-Content-Type-Options: nosniff" -ForegroundColor White
Write-Host "  - X-XSS-Protection" -ForegroundColor White
Write-Host "  - Referrer-Policy" -ForegroundColor White
Write-Host "  - Permissions-Policy" -ForegroundColor White
Write-Host "  - Strict-Transport-Security" -ForegroundColor White
Write-Host "  - Content-Security-Policy" -ForegroundColor White
