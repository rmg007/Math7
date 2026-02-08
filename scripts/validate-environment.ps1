# Questerix Environment Validation Tool for Windows
# PowerShell script to validate development environment

param(
    [switch]$WebOnly,
    [switch]$MobileOnly,
    [switch]$SharedOnly,
    [switch]$IdeOnly,
    [switch]$Quiet,
    [switch]$Help
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Purple = "DarkMagenta"
    Cyan = "Cyan"
    White = "White"
}

# Global counters
$script:ValidationErrors = 0
$script:ValidationWarnings = 0
$script:ValidationSuccess = 0

# Function to print colored output
function Write-Status {
    param(
        [string]$Status,
        [string]$Message,
        [string]$Details = ""
    )
    
    switch ($Status) {
        "success" {
            Write-Host "✅ $Message" -ForegroundColor $Colors.Green
            $script:ValidationSuccess++
        }
        "warning" {
            Write-Host "⚠️  $Message" -ForegroundColor $Colors.Yellow
            if ($Details) {
                Write-Host "   $Details" -ForegroundColor $Colors.Yellow
            }
            $script:ValidationWarnings++
        }
        "error" {
            Write-Host "❌ $Message" -ForegroundColor $Colors.Red
            if ($Details) {
                Write-Host "   $Details" -ForegroundColor $Colors.Red
            }
            $script:ValidationErrors++
        }
        "info" {
            Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Blue
            if ($Details) {
                Write-Host "   $Details" -ForegroundColor $Colors.Cyan
            }
        }
        "header" {
            Write-Host "🔍 $Message" -ForegroundColor $Colors.Purple
            Write-Host "=================================="
        }
    }
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to get version
function Get-Version {
    param(
        [string]$Command,
        [string]$VersionFlag = "--version"
    )
    try {
        if (Test-Command $Command) {
            $result = & $Command $VersionFlag 2>$null | Select-Object -First 1
            return $result.ToString().Trim()
        }
        else {
            return "Not installed"
        }
    }
    catch {
        return "Unknown version"
    }
}

# Function to validate web environment
function Test-WebEnvironment {
    Write-Status "header" "Web Development Environment"
    
    # Check Node.js
    if (Test-Command node) {
        $nodeVersion = node --version
        $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($majorVersion -ge 18) {
            Write-Status "success" "Node.js" $nodeVersion
        }
        else {
            Write-Status "warning" "Node.js version outdated" "$nodeVersion (recommended: 18+)"
        }
    }
    else {
        Write-Status "error" "Node.js not found" "Install Node.js 18+ for web development"
    }
    
    # Check npm
    if (Test-Command npm) {
        Write-Status "success" "npm" (npm --version)
    }
    else {
        Write-Status "error" "npm not found" "npm should be installed with Node.js"
    }
    
    # Check admin-panel directory
    if (Test-Path "admin-panel") {
        if (Test-Path "admin-panel\package.json") {
            Write-Status "success" "Admin panel project structure" "package.json found"
            
            # Check if node_modules exists
            if (Test-Path "admin-panel\node_modules") {
                Write-Status "success" "Admin panel dependencies" "node_modules present"
            }
            else {
                Write-Status "warning" "Admin panel dependencies" "Run 'npm install' in admin-panel"
            }
        }
        else {
            Write-Status "error" "Admin panel package.json not found"
        }
    }
    else {
        Write-Status "error" "Admin panel directory not found"
    }
    
    # Check Vite
    if ((Test-Path "admin-panel") -and (Test-Path "admin-panel\package.json")) {
        $packageJson = Get-Content "admin-panel\package.json" | ConvertFrom-Json
        if ($packageJson.devDependencies.PSObject.Properties.Name -contains "vite") {
            Write-Status "success" "Vite build tool" "Found in package.json"
        }
        else {
            Write-Status "warning" "Vite not found" "Vite is recommended for development"
        }
    }
    
    # Check TypeScript
    if ((Test-Path "admin-panel") -and (Test-Path "admin-panel\package.json")) {
        $packageJson = Get-Content "admin-panel\package.json" | ConvertFrom-Json
        if ($packageJson.devDependencies.PSObject.Properties.Name -contains "typescript") {
            Write-Status "success" "TypeScript" "Found in package.json"
        }
        else {
            Write-Status "warning" "TypeScript not found" "TypeScript is recommended"
        }
    }
    
    # Check Tailwind CSS
    if ((Test-Path "admin-panel") -and (Test-Path "admin-panel\package.json")) {
        $packageJson = Get-Content "admin-panel\package.json" | ConvertFrom-Json
        if ($packageJson.devDependencies.PSObject.Properties.Name -contains "tailwindcss") {
            Write-Status "success" "Tailwind CSS" "Found in package.json"
        }
        else {
            Write-Status "warning" "Tailwind CSS not found" "Tailwind CSS is used in this project"
        }
    }
    
    Write-Host ""
}

# Function to validate mobile environment
function Test-MobileEnvironment {
    Write-Status "header" "Mobile Development Environment"
    
    # Check Flutter
    if (Test-Command flutter) {
        $flutterVersion = flutter --version 2>$null | Select-Object -First 1
        Write-Status "success" "Flutter" $flutterVersion
        
        # Check Flutter doctor
        $flutterDoctor = flutter doctor 2>$null
        if ($flutterDoctor -match "No issues found") {
            Write-Status "success" "Flutter doctor" "No issues found"
        }
        else {
            Write-Status "warning" "Flutter doctor issues found" "Run 'flutter doctor' for details"
        }
    }
    else {
        Write-Status "error" "Flutter not found" "Run 'scripts\setup-mobile.ps1' to install"
    }
    
    # Check Android SDK
    $androidSdkRoot = $env:ANDROID_SDK_ROOT
    if ($androidSdkRoot -and (Test-Path $androidSdkRoot)) {
        Write-Status "success" "Android SDK" $androidSdkRoot
        
        # Check platform-tools
        if (Test-Path "$androidSdkRoot\platform-tools") {
            Write-Status "success" "Android platform-tools" "Found"
        }
        else {
            Write-Status "warning" "Android platform-tools" "Not found, run setup script"
        }
    }
    else {
        Write-Status "error" "Android SDK not found" "Run 'scripts\setup-mobile.ps1' to install"
    }
    
    # Check student-app directory
    if (Test-Path "student-app") {
        if (Test-Path "student-app\pubspec.yaml") {
            Write-Status "success" "Student app project structure" "pubspec.yaml found"
            
            # Check if Flutter dependencies are installed
            if (Test-Path "student-app\.dart_tool") {
                Write-Status "success" "Flutter dependencies" ".dart_tool present"
            }
            else {
                Write-Status "warning" "Flutter dependencies" "Run 'flutter pub get' in student-app"
            }
        }
        else {
            Write-Status "error" "Student app pubspec.yaml not found"
        }
    }
    else {
        Write-Status "error" "Student app directory not found"
    }
    
    # Check for connected devices
    if (Test-Command flutter) {
        $devices = flutter devices 2>$null | Where-Object { $_ -match "^[a-zA-Z0-9]+.*" }
        if ($devices) {
            $deviceCount = ($devices | Measure-Object).Count
            Write-Status "success" "Connected devices" "$deviceCount device(s) found"
        }
        else {
            Write-Status "warning" "No connected devices" "Connect a device or use emulator"
        }
    }
    
    Write-Host ""
}

# Function to validate shared environment
function Test-SharedEnvironment {
    Write-Status "header" "Shared Development Environment"
    
    # Check Git
    if (Test-Command git) {
        Write-Status "success" "Git" (git --version)
        
        # Check if we're in a git repository
        if (Test-Path ".git") {
            Write-Status "success" "Git repository" "Initialized"
            
            # Check for uncommitted changes
            $gitStatus = git status --porcelain 2>$null
            if ($gitStatus) {
                Write-Status "warning" "Uncommitted changes" "Commit or stash changes before deployment"
            }
            else {
                Write-Status "success" "Working directory" "Clean"
            }
        }
        else {
            Write-Status "warning" "Not a git repository" "Initialize with 'git init'"
        }
    }
    else {
        Write-Status "error" "Git not found" "Install Git for version control"
    }
    
    # Check Docker (optional)
    if (Test-Command docker) {
        Write-Status "success" "Docker" (docker --version | Select-Object -First 1)
        
        # Check if Docker is running
        try {
            docker info *>$null
            Write-Status "success" "Docker daemon" "Running"
        }
        catch {
            Write-Status "warning" "Docker daemon" "Not running"
        }
    }
    else {
        Write-Status "info" "Docker" "Not installed (optional for web development)"
    }
    
    # Check Python (for content engine)
    if (Test-Command python) {
        Write-Status "success" "Python" (python --version)
    }
    elseif (Test-Command python3) {
        Write-Status "success" "Python" (python3 --version)
    }
    else {
        Write-Status "warning" "Python not found" "Required for content engine"
    }
    
    # Check for environment files
    if (Test-Path ".env") {
        Write-Status "success" "Environment file" ".env found"
    }
    else {
        Write-Status "warning" "Environment file" ".env not found (create from .env.example)"
    }
    
    # Check for Supabase CLI
    if (Test-Command supabase) {
        Write-Status "success" "Supabase CLI" (supabase --version)
    }
    else {
        Write-Status "warning" "Supabase CLI" "Install for local development"
    }
    
    Write-Host ""
}

# Function to validate IDE/Agent compatibility
function Test-IdeCompatibility {
    Write-Status "header" "IDE/Agent Compatibility"
    
    # Check VS Code extensions file
    if (Test-Path ".vscode\extensions.json") {
        Write-Status "success" "VS Code extensions" "extensions.json found"
    }
    else {
        Write-Status "info" "VS Code extensions" "No extensions.json found"
    }
    
    # Check cursorrules file
    if (Test-Path ".cursorrules") {
        Write-Status "success" "Cursor rules" ".cursorrules found"
    }
    else {
        Write-Status "info" "Cursor rules" "No .cursorrules found"
    }
    
    # Check AGENT_QUICKSTART.md
    if (Test-Path "AGENT_QUICKSTART.md") {
        Write-Status "success" "Agent documentation" "AGENT_QUICKSTART.md found"
    }
    else {
        Write-Status "warning" "Agent documentation" "AGENT_QUICKSTART.md not found"
    }
    
    # Check for devcontainer
    if (Test-Path ".devcontainer") {
        if (Test-Path ".devcontainer\devcontainer.json") {
            Write-Status "success" "DevContainer" "Configuration found"
        }
        else {
            Write-Status "warning" "DevContainer" "Directory exists but no devcontainer.json"
        }
    }
    else {
        Write-Status "info" "DevContainer" "Not configured"
    }
    
    Write-Host ""
}

# Function to provide recommendations
function Show-Recommendations {
    Write-Status "header" "Recommendations"
    
    if ($script:ValidationErrors -gt 0) {
        Write-Status "error" "Critical issues found" "$script:ValidationErrors error(s) must be resolved"
        Write-Host ""
        Write-Status "info" "Quick fixes:"
        if (-not (Test-Command node)) {
            Write-Host "   • Install Node.js: https://nodejs.org/"
        }
        if (-not (Test-Command flutter)) {
            Write-Host "   • Setup mobile: scripts\setup-mobile.ps1"
        }
        if ((-not (Test-Path "admin-panel")) -or (-not (Test-Path "student-app"))) {
            Write-Host "   • Ensure project structure is correct"
        }
    }
    
    if ($script:ValidationWarnings -gt 0) {
        Write-Status "warning" "Improvements suggested" "$script:ValidationWarnings warning(s) found"
        Write-Host ""
        Write-Status "info" "Recommended actions:"
        if ((Test-Path "admin-panel") -and (-not (Test-Path "admin-panel\node_modules"))) {
            Write-Host "   • Install web dependencies: cd admin-panel && npm install"
        }
        if ((Test-Path "student-app") -and (-not (Test-Path "student-app\.dart_tool"))) {
            Write-Host "   • Install mobile dependencies: cd student-app && flutter pub get"
        }
        if (-not (Test-Command docker)) {
            Write-Host "   • Install Docker for containerized development"
        }
    }
    
    if (($script:ValidationErrors -eq 0) -and ($script:ValidationWarnings -eq 0)) {
        Write-Status "success" "Environment is perfect!" "All validations passed"
        Write-Host ""
        Write-Status "info" "You're ready to develop:"
        Write-Host "   • Web development: cd admin-panel && npm run dev"
        Write-Host "   • Mobile development: cd student-app && flutter run"
        Write-Host "   • Full setup: npm run setup:all"
    }
    
    Write-Host ""
}

# Function to generate report
function New-ValidationReport {
    Write-Status "header" "Validation Summary"
    Write-Host "Environment Validation Report - $(Get-Date)"
    Write-Host "=================================="
    Write-Host "Status Summary:"
    Write-Host "  ✅ Success: $script:ValidationSuccess"
    Write-Host "  ⚠️  Warnings: $script:ValidationWarnings"
    Write-Host "  ❌ Errors: $script:ValidationErrors"
    Write-Host ""
    
    if ($script:ValidationErrors -eq 0) {
        Write-Host "🎉 Environment is ready for development!"
        exit 0
    }
    else {
        Write-Host "🚨 Environment has critical issues that need attention."
        exit 1
    }
}

# Function to show help
function Show-Help {
    Write-Host "Questerix Environment Validation Tool"
    Write-Host "===================================="
    Write-Host ""
    Write-Host "Usage: .\validate-environment.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -WebOnly      Validate only web development environment"
    Write-Host "  -MobileOnly   Validate only mobile development environment"
    Write-Host "  -SharedOnly   Validate only shared environment"
    Write-Host "  -IdeOnly      Validate only IDE/Agent compatibility"
    Write-Host "  -Quiet        Suppress detailed output, show summary only"
    Write-Host "  -Help         Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\validate-environment.ps1              # Validate everything"
    Write-Host "  .\validate-environment.ps1 -WebOnly     # Validate web environment only"
    Write-Host "  .\validate-environment.ps1 -MobileOnly  # Validate mobile environment only"
    Write-Host ""
}

# Main execution
try {
    if ($Help) {
        Show-Help
        exit 0
    }
    
    # Run validations based on arguments
    if ($WebOnly) {
        Test-WebEnvironment
    }
    elseif ($MobileOnly) {
        Test-MobileEnvironment
    }
    elseif ($SharedOnly) {
        Test-SharedEnvironment
    }
    elseif ($IdeOnly) {
        Test-IdeCompatibility
    }
    else {
        # Run all validations
        Test-WebEnvironment
        Test-MobileEnvironment
        Test-SharedEnvironment
        Test-IdeCompatibility
    }
    
    # Provide recommendations and generate report
    if (-not $Quiet) {
        Show-Recommendations
    }
    
    New-ValidationReport
}
catch {
    Write-Host "❌ Validation tool failed: $_" -ForegroundColor $Colors.Red
    exit 1
}
