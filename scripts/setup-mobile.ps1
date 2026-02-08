# Questerix Mobile Development Setup for Windows
# PowerShell script to install Flutter and Android SDK

param(
    [switch]$Force,
    [string]$FlutterVersion = "3.24.5",
    [string]$AndroidSdkVersion = "11076708"
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

# Configuration
$FlutterDir = "$env:USERPROFILE\flutter"
$AndroidSdkDir = "$env:USERPROFILE\AppData\Local\Android\Sdk"
$InstallDir = "$env:TEMP\questerix-mobile-setup"

Write-ColorOutput "🚀 Questerix Mobile Development Setup" "Blue"
Write-Host "=================================="

# Create installation directory
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Set-Location $InstallDir

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

# Function to install Chocolatey if not present
function Install-Chocolatey {
    if (-not (Test-Command choco)) {
        Write-ColorOutput "📦 Installing Chocolatey..." "Blue"
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-ColorOutput "✅ Chocolatey installed" "Green"
    }
    else {
        Write-ColorOutput "✅ Chocolatey already installed" "Green"
    }
}

# Function to install Java
function Install-Java {
    if (-not (Test-Command java)) {
        Write-ColorOutput "☕ Installing Java 17..." "Blue"
        choco install openjdk17 -y
        Write-ColorOutput "✅ Java 17 installed" "Green"
    }
    else {
        Write-ColorOutput "✅ Java already installed" "Green"
    }
}

# Function to install Flutter
function Install-Flutter {
    if (Test-Command flutter) {
        $flutterVersion = flutter --version | Select-Object -First 1
        Write-ColorOutput "⚠️  Flutter already found: $flutterVersion" "Yellow"
        if (-not $Force) {
            $response = Read-Host "Do you want to reinstall Flutter? (y/N)"
            if ($response -notmatch '^[Yy]') {
                return
            }
        }
    }

    Write-ColorOutput "📦 Installing Flutter SDK..." "Blue"
    
    $FlutterArchive = "flutter_windows_$FlutterVersion-stable.zip"
    $FlutterUrl = "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/$FlutterArchive"
    
    try {
        Invoke-WebRequest -Uri $FlutterUrl -OutFile $FlutterArchive -UseBasicParsing
        
        # Remove existing Flutter installation
        if (Test-Path $FlutterDir) {
            Remove-Item -Path $FlutterDir -Recurse -Force
        }
        
        # Extract Flutter
        Expand-Archive -Path $FlutterArchive -DestinationPath $env:USERPROFILE
        Remove-Item $FlutterArchive
        
        Write-ColorOutput "✅ Flutter installed to $FlutterDir" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to download Flutter: $_" "Red"
        exit 1
    }
}

# Function to setup Android SDK
function Install-AndroidSdk {
    if (Test-Path $AndroidSdkDir) {
        Write-ColorOutput "⚠️  Android SDK already found at $AndroidSdkDir" "Yellow"
        if (-not $Force) {
            $response = Read-Host "Do you want to reinstall Android SDK? (y/N)"
            if ($response -notmatch '^[Yy]') {
                return
            }
        }
    }

    Write-ColorOutput "📱 Installing Android SDK..." "Blue"
    
    try {
        # Install Android SDK using Chocolatey
        choco install android-sdk -y
        
        # Create command-line-tools directory
        $CmdlineToolsDir = "$AndroidSdkDir\cmdline-tools"
        New-Item -ItemType Directory -Path $CmdlineToolsDir -Force | Out-Null
        New-Item -ItemType Directory -Path "$CmdlineToolsDir\latest" -Force | Out-Null
        
        # Download command line tools
        $CmdlineToolsArchive = "commandlinetools-win-${AndroidSdkVersion}_latest.zip"
        $CmdlineToolsUrl = "https://dl.google.com/android/repository/$CmdlineToolsArchive"
        
        Invoke-WebRequest -Uri $CmdlineToolsUrl -OutFile $CmdlineToolsArchive -UseBasicParsing
        Expand-Archive -Path $CmdlineToolsArchive -DestinationPath $CmdlineToolsDir\latest
        Remove-Item $CmdlineToolsArchive
        
        Write-ColorOutput "✅ Android SDK installed to $AndroidSdkDir" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to install Android SDK: $_" "Red"
        exit 1
    }
}

# Function to setup environment variables
function Set-EnvironmentVariables {
    Write-ColorOutput "🔧 Setting up environment variables..." "Blue"
    
    # Set user environment variables
    [Environment]::SetEnvironmentVariable("FLUTTER_ROOT", $FlutterDir, "User")
    [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $AndroidSdkDir, "User")
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $AndroidSdkDir, "User")
    
    # Update PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    $newPaths = @(
        "$FlutterDir\bin",
        "$AndroidSdkDir\cmdline-tools\latest\bin",
        "$AndroidSdkDir\platform-tools"
    )
    
    foreach ($path in $newPaths) {
        if ($currentPath -notlike "*$path*") {
            $currentPath += ";$path"
        }
    }
    
    [Environment]::SetEnvironmentVariable("PATH", $currentPath, "User")
    
    # Set for current session
    $env:FLUTTER_ROOT = $FlutterDir
    $env:ANDROID_SDK_ROOT = $AndroidSdkDir
    $env:ANDROID_HOME = $AndroidSdkDir
    $env:PATH = "$currentPath;$env:PATH"
    
    Write-ColorOutput "✅ Environment variables configured" "Green"
}

# Function to accept Android licenses
function Accept-Licenses {
    Write-ColorOutput "📋 Accepting Android licenses..." "Blue"
    
    try {
        # Accept all licenses
        "y" | & "$AndroidSdkDir\cmdline-tools\latest\bin\sdkmanager.bat" --licenses
        Write-ColorOutput "✅ Android licenses accepted" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to accept licenses: $_" "Red"
    }
}

# Function to install Android components
function Install-AndroidComponents {
    Write-ColorOutput "📦 Installing Android components..." "Blue"
    
    try {
        & "$AndroidSdkDir\cmdline-tools\latest\bin\sdkmanager.bat" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
        Write-ColorOutput "✅ Android components installed" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to install Android components: $_" "Red"
    }
}

# Function to setup Flutter
function Set-FlutterConfig {
    Write-ColorOutput "🐦 Configuring Flutter..." "Blue"
    
    try {
        flutter config --enable-web
        flutter config --enable-android
        Write-ColorOutput "✅ Flutter configured" "Green"
    }
    catch {
        Write-ColorOutput "❌ Failed to configure Flutter: $_" "Red"
    }
}

# Function to install project dependencies
function Install-ProjectDependencies {
    Write-ColorOutput "📦 Installing project dependencies..." "Blue"
    
    if (Test-Path "student-app") {
        Set-Location "student-app"
        try {
            flutter pub get
            Write-ColorOutput "✅ Flutter dependencies installed" "Green"
        }
        catch {
            Write-ColorOutput "❌ Failed to install Flutter dependencies: $_" "Red"
        }
        Set-Location ..
    }
    else {
        Write-ColorOutput "⚠️  student-app directory not found" "Yellow"
    }
}

# Function to run final checks
function Invoke-FinalChecks {
    Write-ColorOutput "🔍 Running final checks..." "Blue"
    
    # Check Flutter
    if (Test-Command flutter) {
        $flutterVersion = flutter --version | Select-Object -First 1
        Write-ColorOutput "✅ Flutter: $flutterVersion" "Green"
    }
    else {
        Write-ColorOutput "❌ Flutter not found in PATH" "Red"
        return $false
    }
    
    # Check Android SDK
    if (Test-Path $AndroidSdkDir) {
        Write-ColorOutput "✅ Android SDK: $AndroidSdkDir" "Green"
    }
    else {
        Write-ColorOutput "❌ Android SDK not found" "Red"
        return $false
    }
    
    # Run Flutter doctor
    Write-ColorOutput "🏥 Running Flutter doctor..." "Blue"
    flutter doctor
    
    Write-ColorOutput "✅ Setup complete!" "Green"
    return $true
}

# Function to create PowerShell profile
function New-PowerShellProfile {
    Write-ColorOutput "📝 Creating PowerShell profile..." "Blue"
    
    $ProfilePath = $PROFILE.CurrentUserAllHosts
    $ProfileDir = Split-Path $ProfilePath -Parent
    
    if (-not (Test-Path $ProfileDir)) {
        New-Item -ItemType Directory -Path $ProfileDir -Force | Out-Null
    }
    
    # Remove existing Questerix mobile config
    if (Test-Path $ProfilePath) {
        $profileContent = Get-Content $ProfilePath
        $newContent = $profileContent -replace '(?s)# Questerix Mobile Development.*?# End Questerix Mobile', ''
        Set-Content -Path $ProfilePath -Value $newContent
    }
    
    # Add new configuration
    @"

# Questerix Mobile Development
`$env:FLUTTER_ROOT = "$FlutterDir"
`$env:ANDROID_SDK_ROOT = "$AndroidSdkDir"
`$env:ANDROID_HOME = "$AndroidSdkDir"

# Questerix mobile aliases
function dev-mobile { Set-Location student-app; flutter run }
function test-mobile { Set-Location student-app; flutter test }
function build-mobile { Set-Location student-app; flutter build apk }
function clean-mobile { Set-Location student-app; flutter clean; flutter pub get }
function doctor-mobile { flutter doctor -v }
# End Questerix Mobile
"@ | Out-File -FilePath $ProfilePath -Append
    
    Write-ColorOutput "✅ PowerShell profile created" "Green"
}

# Main execution
try {
    Write-ColorOutput "Starting mobile development setup..." "Blue"
    
    # Install prerequisites
    Install-Chocolatey
    Install-Java
    
    # Install components
    Install-Flutter
    Install-AndroidSdk
    Set-EnvironmentVariables
    New-PowerShellProfile
    Accept-Licenses
    Install-AndroidComponents
    Set-FlutterConfig
    Install-ProjectDependencies
    
    $setupSuccess = Invoke-FinalChecks
    
    # Cleanup
    Set-Location $env:TEMP
    Remove-Item -Path $InstallDir -Recurse -Force
    
    if ($setupSuccess) {
        Write-Host ""
        Write-ColorOutput "🎉 Questerix Mobile Development Setup Complete!" "Green"
        Write-Host "============================================="
        Write-ColorOutput "Quick Start Commands:" "Blue"
        Write-Host "  dev-mobile    - Start Flutter app development"
        Write-Host "  test-mobile   - Run Flutter tests"
        Write-Host "  build-mobile  - Build Android APK"
        Write-Host "  clean-mobile  - Clean and reinstall dependencies"
        Write-Host "  doctor-mobile - Run Flutter doctor"
        Write-Host ""
        Write-ColorOutput "⚠️  IMPORTANT: Restart PowerShell to use the new environment variables" "Yellow"
    }
    else {
        Write-ColorOutput "❌ Setup completed with errors. Please check the output above." "Red"
        exit 1
    }
}
catch {
    Write-ColorOutput "❌ Setup failed: $_" "Red"
    exit 1
}
