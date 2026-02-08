#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FLUTTER_VERSION="3.24.5"
ANDROID_SDK_VERSION="11076708"
JAVA_VERSION="17"

# Directories
FLUTTER_DIR="$HOME/flutter"
ANDROID_SDK_DIR="$HOME/Android/Sdk"
INSTALL_DIR="/tmp/questerix-mobile-setup"

echo -e "${BLUE}🚀 Questerix Mobile Development Setup${NC}"
echo "=================================="

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    FLUTTER_OS="macos"
    ANDROID_OS="mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    FLUTTER_OS="linux"
    ANDROID_OS="linux"
else
    echo -e "${RED}❌ Unsupported OS: $OSTYPE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Detected OS: $OS${NC}"

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Flutter
install_flutter() {
    if command_exists flutter; then
        echo -e "${YELLOW}⚠️  Flutter already found: $(flutter --version | head -1)${NC}"
        read -p "Do you want to reinstall Flutter? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi

    echo -e "${BLUE}📦 Installing Flutter SDK...${NC}"
    
    FLUTTER_ARCHIVE="flutter_${FLUTTER_OS}_$FLUTTER_VERSION-stable.tar.xz"
    FLUTTER_URL="https://storage.googleapis.com/flutter_infra_release/releases/stable/${FLUTTER_OS}/${FLUTTER_ARCHIVE}"
    
    if [[ "$OS" == "macos" ]]; then
        curl -L -o "$FLUTTER_ARCHIVE" "$FLUTTER_URL"
    else
        wget -O "$FLUTTER_ARCHIVE" "$FLUTTER_URL"
    fi
    
    # Remove existing Flutter installation
    rm -rf "$FLUTTER_DIR"
    
    # Extract Flutter
    tar xf "$FLUTTER_ARCHIVE"
    mv flutter "$FLUTTER_DIR"
    rm "$FLUTTER_ARCHIVE"
    
    echo -e "${GREEN}✅ Flutter installed to $FLUTTER_DIR${NC}"
}

# Function to setup Android SDK
install_android_sdk() {
    if [ -d "$ANDROID_SDK_DIR" ]; then
        echo -e "${YELLOW}⚠️  Android SDK already found at $ANDROID_SDK_DIR${NC}"
        read -p "Do you want to reinstall Android SDK? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 0
        fi
    fi

    echo -e "${BLUE}📱 Installing Android SDK...${NC}"
    
    # Create Android SDK directory
    mkdir -p "$ANDROID_SDK_DIR/cmdline-tools"
    
    # Download command line tools
    CMDLINE_TOOLS_ARCHIVE="commandlinetools-${ANDROID_OS}-${ANDROID_SDK_VERSION}_latest.zip"
    CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/${CMDLINE_TOOLS_ARCHIVE}"
    
    if [[ "$OS" == "macos" ]]; then
        curl -L -o "$CMDLINE_TOOLS_ARCHIVE" "$CMDLINE_TOOLS_URL"
    else
        wget -O "$CMDLINE_TOOLS_ARCHIVE" "$CMDLINE_TOOLS_URL"
    fi
    
    # Extract command line tools
    unzip -q "$CMDLINE_TOOLS_ARCHIVE"
    mkdir -p "$ANDROID_SDK_DIR/cmdline-tools/latest"
    mv cmdline-tools/* "$ANDROID_SDK_DIR/cmdline-tools/latest/"
    rm "$CMDLINE_TOOLS_ARCHIVE"
    
    echo -e "${GREEN}✅ Android SDK installed to $ANDROID_SDK_DIR${NC}"
}

# Function to setup environment variables
setup_environment() {
    echo -e "${BLUE}🔧 Setting up environment variables...${NC}"
    
    # Create shell profile
    PROFILE_FILE="$HOME/.bashrc"
    if [[ "$OS" == "macos" ]]; then
        PROFILE_FILE="$HOME/.zshrc"
    fi
    
    # Remove existing Questerix mobile config
    sed -i.bak '/# Questerix Mobile Development/,/# End Questerix Mobile/d' "$PROFILE_FILE" 2>/dev/null || true
    
    # Add new configuration
    cat >> "$PROFILE_FILE" << 'EOF'

# Questerix Mobile Development
export FLUTTER_ROOT="$HOME/flutter"
export ANDROID_SDK_ROOT="$HOME/Android/Sdk"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export PATH="$FLUTTER_ROOT/bin:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

# Questerix mobile aliases
alias dev-mobile="cd student-app && flutter run"
alias test-mobile="cd student-app && flutter test"
alias build-mobile="cd student-app && flutter build apk"
alias clean-mobile="cd student-app && flutter clean && flutter pub get"
alias doctor-mobile="flutter doctor -v"
# End Questerix Mobile
EOF
    
    # Source the profile for current session
    source "$PROFILE_FILE" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Environment variables configured${NC}"
}

# Function to accept Android licenses
accept_licenses() {
    echo -e "${BLUE}📋 Accepting Android licenses...${NC}"
    
    # Export variables for this session
    export FLUTTER_ROOT="$FLUTTER_DIR"
    export ANDROID_SDK_ROOT="$ANDROID_SDK_DIR"
    export ANDROID_HOME="$ANDROID_SDK_DIR"
    export PATH="$FLUTTER_ROOT/bin:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"
    
    # Accept all licenses
    yes | sdkmanager --licenses
    
    echo -e "${GREEN}✅ Android licenses accepted${NC}"
}

# Function to install Android components
install_android_components() {
    echo -e "${BLUE}📦 Installing Android components...${NC}"
    
    # Export variables for this session
    export FLUTTER_ROOT="$FLUTTER_DIR"
    export ANDROID_SDK_ROOT="$ANDROID_SDK_DIR"
    export ANDROID_HOME="$ANDROID_SDK_DIR"
    export PATH="$FLUTTER_ROOT/bin:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"
    
    # Install required components
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
    
    echo -e "${GREEN}✅ Android components installed${NC}"
}

# Function to setup Flutter
setup_flutter() {
    echo -e "${BLUE}🐦 Configuring Flutter...${NC}"
    
    # Export variables for this session
    export FLUTTER_ROOT="$FLUTTER_DIR"
    export ANDROID_SDK_ROOT="$ANDROID_SDK_DIR"
    export ANDROID_HOME="$ANDROID_SDK_DIR"
    export PATH="$FLUTTER_ROOT/bin:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"
    
    # Configure Flutter
    flutter config --enable-web
    flutter config --enable-android
    
    echo -e "${GREEN}✅ Flutter configured${NC}"
}

# Function to install project dependencies
install_project_dependencies() {
    echo -e "${BLUE}📦 Installing project dependencies...${NC}"
    
    # Export variables for this session
    export FLUTTER_ROOT="$FLUTTER_DIR"
    export ANDROID_SDK_ROOT="$ANDROID_SDK_DIR"
    export ANDROID_HOME="$ANDROID_SDK_DIR"
    export PATH="$FLUTTER_ROOT/bin:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"
    
    # Install Flutter dependencies
    if [ -d "student-app" ]; then
        cd student-app
        flutter pub get
        echo -e "${GREEN}✅ Flutter dependencies installed${NC}"
        cd ..
    else
        echo -e "${YELLOW}⚠️  student-app directory not found${NC}"
    fi
}

# Function to run final checks
run_checks() {
    echo -e "${BLUE}🔍 Running final checks...${NC}"
    
    # Export variables for this session
    export FLUTTER_ROOT="$FLUTTER_DIR"
    export ANDROID_SDK_ROOT="$ANDROID_SDK_DIR"
    export ANDROID_HOME="$ANDROID_SDK_DIR"
    export PATH="$FLUTTER_ROOT/bin:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"
    
    # Check Flutter
    if command_exists flutter; then
        echo -e "${GREEN}✅ Flutter: $(flutter --version | head -1)${NC}"
    else
        echo -e "${RED}❌ Flutter not found in PATH${NC}"
        return 1
    fi
    
    # Check Android SDK
    if [ -d "$ANDROID_SDK_DIR" ]; then
        echo -e "${GREEN}✅ Android SDK: $ANDROID_SDK_DIR${NC}"
    else
        echo -e "${RED}❌ Android SDK not found${NC}"
        return 1
    fi
    
    # Run Flutter doctor
    echo -e "${BLUE}🏥 Running Flutter doctor...${NC}"
    flutter doctor
    
    echo -e "${GREEN}✅ Setup complete!${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting mobile development setup...${NC}"
    
    # Install components
    install_flutter
    install_android_sdk
    setup_environment
    accept_licenses
    install_android_components
    setup_flutter
    install_project_dependencies
    run_checks
    
    # Cleanup
    cd /
    rm -rf "$INSTALL_DIR"
    
    echo ""
    echo -e "${GREEN}🎉 Questerix Mobile Development Setup Complete!${NC}"
    echo "============================================="
    echo -e "${BLUE}Quick Start Commands:${NC}"
    echo "  dev-mobile    - Start Flutter app development"
    echo "  test-mobile   - Run Flutter tests"
    echo "  build-mobile  - Build Android APK"
    echo "  clean-mobile  - Clean and reinstall dependencies"
    echo "  doctor-mobile - Run Flutter doctor"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Restart your terminal or run 'source ~/.bashrc' to use the new environment variables${NC}"
}

# Run main function
main "$@"
