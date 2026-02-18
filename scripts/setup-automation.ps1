# Questerix Minimal Viable Automation (MVA) Setup (PowerShell)
# This script initializes Husky and lint-staged for Windows environments.

Write-Host " Setting up Questerix MVA..." -ForegroundColor Cyan

# 1. Install root dependencies
Write-Host " Installing root dependencies..."
npm install --save-dev husky lint-staged

# 2. Initialize Husky
Write-Host " Initializing Husky..."
npx husky

# 3. Create pre-commit hook
Write-Host " Creating pre-commit hook..."
Set-Content -Path .husky/pre-commit -Value "npx lint-staged"

# 4. Create pre-push hook
Write-Host " Creating pre-push hook..."
$prePushContent = @"
#!/bin/sh
echo " Running pre-push quality gates..."

echo " Checking admin-panel Types..."
cd admin-panel && npm run typecheck || exit 1

echo " Analyzing student-app Flutter..."
cd ../student-app && flutter analyze || exit 1

echo " All quality gates passed!"
"@

Set-Content -Path .husky/pre-push -Value $prePushContent

Write-Host " MVA Setup complete!" -ForegroundColor Green
Write-Host "Try committing a file to see it in action."
