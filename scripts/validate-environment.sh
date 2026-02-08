#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
VALIDATION_ERRORS=0
VALIDATION_WARNINGS=0
VALIDATION_SUCCESS=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    local details=${3:-""}
    
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ((VALIDATION_SUCCESS++))
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            if [[ -n "$details" ]]; then
                echo -e "   ${YELLOW}$details${NC}"
            fi
            ((VALIDATION_WARNINGS++))
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            if [[ -n "$details" ]]; then
                echo -e "   ${RED}$details${NC}"
            fi
            ((VALIDATION_ERRORS++))
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            if [[ -n "$details" ]]; then
                echo -e "   ${CYAN}$details${NC}"
            fi
            ;;
        "header")
            echo -e "${PURPLE}🔍 $message${NC}"
            echo "=================================="
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check version
get_version() {
    local cmd=$1
    local version_flag=${2:-"--version"}
    if command_exists "$cmd"; then
        $cmd $version_flag 2>/dev/null | head -1 || echo "Unknown version"
    else
        echo "Not installed"
    fi
}

# Function to validate web environment
validate_web_environment() {
    print_status "header" "Web Development Environment"
    
    # Check Node.js
    if command_exists node; then
        local node_version=$(node --version)
        local major_version=$(echo $node_version | cut -d'.' -f1 | sed 's/v//')
        if [[ $major_version -ge 18 ]]; then
            print_status "success" "Node.js" "$node_version"
        else
            print_status "warning" "Node.js version outdated" "$node_version (recommended: 18+)"
        fi
    else
        print_status "error" "Node.js not found" "Install Node.js 18+ for web development"
    fi
    
    # Check npm
    if command_exists npm; then
        print_status "success" "npm" "$(npm --version)"
    else
        print_status "error" "npm not found" "npm should be installed with Node.js"
    fi
    
    # Check admin-panel directory
    if [[ -d "admin-panel" ]]; then
        if [[ -f "admin-panel/package.json" ]]; then
            print_status "success" "Admin panel project structure" "package.json found"
            
            # Check if node_modules exists
            if [[ -d "admin-panel/node_modules" ]]; then
                print_status "success" "Admin panel dependencies" "node_modules present"
            else
                print_status "warning" "Admin panel dependencies" "Run 'npm install' in admin-panel"
            fi
        else
            print_status "error" "Admin panel package.json not found"
        fi
    else
        print_status "error" "Admin panel directory not found"
    fi
    
    # Check Vite
    if [[ -d "admin-panel" ]] && [[ -f "admin-panel/package.json" ]]; then
        if grep -q "vite" admin-panel/package.json; then
            print_status "success" "Vite build tool" "Found in package.json"
        else
            print_status "warning" "Vite not found" "Vite is recommended for development"
        fi
    fi
    
    # Check TypeScript
    if [[ -d "admin-panel" ]] && [[ -f "admin-panel/package.json" ]]; then
        if grep -q "typescript" admin-panel/package.json; then
            print_status "success" "TypeScript" "Found in package.json"
        else
            print_status "warning" "TypeScript not found" "TypeScript is recommended"
        fi
    fi
    
    # Check Tailwind CSS
    if [[ -d "admin-panel" ]] && [[ -f "admin-panel/package.json" ]]; then
        if grep -q "tailwindcss" admin-panel/package.json; then
            print_status "success" "Tailwind CSS" "Found in package.json"
        else
            print_status "warning" "Tailwind CSS not found" "Tailwind CSS is used in this project"
        fi
    fi
    
    echo ""
}

# Function to validate mobile environment
validate_mobile_environment() {
    print_status "header" "Mobile Development Environment"
    
    # Check Flutter
    if command_exists flutter; then
        local flutter_version=$(flutter --version 2>/dev/null | head -1)
        print_status "success" "Flutter" "$flutter_version"
        
        # Check Flutter doctor
        if command_exists flutter; then
            local flutter_doctor=$(flutter doctor 2>/dev/null)
            if echo "$flutter_doctor" | grep -q "No issues found"; then
                print_status "success" "Flutter doctor" "No issues found"
            else
                print_status "warning" "Flutter doctor issues found" "Run 'flutter doctor' for details"
            fi
        fi
    else
        print_status "error" "Flutter not found" "Run 'bash scripts/setup-mobile.sh' to install"
    fi
    
    # Check Android SDK
    if [[ -n "${ANDROID_SDK_ROOT:-}" ]] && [[ -d "$ANDROID_SDK_ROOT" ]]; then
        print_status "success" "Android SDK" "$ANDROID_SDK_ROOT"
        
        # Check platform-tools
        if [[ -d "$ANDROID_SDK_ROOT/platform-tools" ]]; then
            print_status "success" "Android platform-tools" "Found"
        else
            print_status "warning" "Android platform-tools" "Not found, run setup script"
        fi
    else
        print_status "error" "Android SDK not found" "Run 'bash scripts/setup-mobile.sh' to install"
    fi
    
    # Check student-app directory
    if [[ -d "student-app" ]]; then
        if [[ -f "student-app/pubspec.yaml" ]]; then
            print_status "success" "Student app project structure" "pubspec.yaml found"
            
            # Check if Flutter dependencies are installed
            if [[ -d "student-app/.dart_tool" ]]; then
                print_status "success" "Flutter dependencies" ".dart_tool present"
            else
                print_status "warning" "Flutter dependencies" "Run 'flutter pub get' in student-app"
            fi
        else
            print_status "error" "Student app pubspec.yaml not found"
        fi
    else
        print_status "error" "Student app directory not found"
    fi
    
    # Check for connected devices
    if command_exists flutter; then
        local devices=$(flutter devices 2>/dev/null | grep -E "^[a-zA-Z0-9]+.*" | wc -l)
        if [[ $devices -gt 0 ]]; then
            print_status "success" "Connected devices" "$devices device(s) found"
        else
            print_status "warning" "No connected devices" "Connect a device or use emulator"
        fi
    fi
    
    echo ""
}

# Function to validate shared environment
validate_shared_environment() {
    print_status "header" "Shared Development Environment"
    
    # Check Git
    if command_exists git; then
        print_status "success" "Git" "$(git --version)"
        
        # Check if we're in a git repository
        if [[ -d ".git" ]]; then
            print_status "success" "Git repository" "Initialized"
            
            # Check for uncommitted changes
            if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
                print_status "warning" "Uncommitted changes" "Commit or stash changes before deployment"
            else
                print_status "success" "Working directory" "Clean"
            fi
        else
            print_status "warning" "Not a git repository" "Initialize with 'git init'"
        fi
    else
        print_status "error" "Git not found" "Install Git for version control"
    fi
    
    # Check Docker (optional)
    if command_exists docker; then
        print_status "success" "Docker" "$(docker --version | head -1)"
        
        # Check if Docker is running
        if docker info >/dev/null 2>&1; then
            print_status "success" "Docker daemon" "Running"
        else
            print_status "warning" "Docker daemon" "Not running"
        fi
    else
        print_status "info" "Docker" "Not installed (optional for web development)"
    fi
    
    # Check Python (for content engine)
    if command_exists python3; then
        print_status "success" "Python" "$(python3 --version)"
    else
        print_status "warning" "Python3 not found" "Required for content engine"
    fi
    
    # Check for environment files
    if [[ -f ".env" ]]; then
        print_status "success" "Environment file" ".env found"
    else
        print_status "warning" "Environment file" ".env not found (create from .env.example)"
    fi
    
    # Check for Supabase CLI
    if command_exists supabase; then
        print_status "success" "Supabase CLI" "$(supabase --version)"
    else
        print_status "warning" "Supabase CLI" "Install for local development"
    fi
    
    echo ""
}

# Function to validate IDE/Agent compatibility
validate_ide_compatibility() {
    print_status "header" "IDE/Agent Compatibility"
    
    # Check VS Code extensions file
    if [[ -f ".vscode/extensions.json" ]]; then
        print_status "success" "VS Code extensions" "extensions.json found"
    else
        print_status "info" "VS Code extensions" "No extensions.json found"
    fi
    
    # Check cursorrules file
    if [[ -f ".cursorrules" ]]; then
        print_status "success" "Cursor rules" ".cursorrules found"
    else
        print_status "info" "Cursor rules" "No .cursorrules found"
    fi
    
    # Check AGENT_QUICKSTART.md
    if [[ -f "AGENT_QUICKSTART.md" ]]; then
        print_status "success" "Agent documentation" "AGENT_QUICKSTART.md found"
    else
        print_status "warning" "Agent documentation" "AGENT_QUICKSTART.md not found"
    fi
    
    # Check for devcontainer
    if [[ -d ".devcontainer" ]]; then
        if [[ -f ".devcontainer/devcontainer.json" ]]; then
            print_status "success" "DevContainer" "Configuration found"
        else
            print_status "warning" "DevContainer" "Directory exists but no devcontainer.json"
        fi
    else
        print_status "info" "DevContainer" "Not configured"
    fi
    
    echo ""
}

# Function to provide recommendations
provide_recommendations() {
    print_status "header" "Recommendations"
    
    if [[ $VALIDATION_ERRORS -gt 0 ]]; then
        print_status "error" "Critical issues found" "$VALIDATION_ERRORS error(s) must be resolved"
        echo ""
        print_status "info" "Quick fixes:"
        if ! command_exists node; then
            echo "   • Install Node.js: https://nodejs.org/"
        fi
        if ! command_exists flutter; then
            echo "   • Setup mobile: bash scripts/setup-mobile.sh"
        fi
        if [[ ! -d "admin-panel" ]] || [[ ! -d "student-app" ]]; then
            echo "   • Ensure project structure is correct"
        fi
    fi
    
    if [[ $VALIDATION_WARNINGS -gt 0 ]]; then
        print_status "warning" "Improvements suggested" "$VALIDATION_WARNINGS warning(s) found"
        echo ""
        print_status "info" "Recommended actions:"
        if [[ -d "admin-panel" ]] && [[ ! -d "admin-panel/node_modules" ]]; then
            echo "   • Install web dependencies: cd admin-panel && npm install"
        fi
        if [[ -d "student-app" ]] && [[ ! -d "student-app/.dart_tool" ]]; then
            echo "   • Install mobile dependencies: cd student-app && flutter pub get"
        fi
        if ! command_exists docker; then
            echo "   • Install Docker for containerized development"
        fi
    fi
    
    if [[ $VALIDATION_ERRORS -eq 0 ]] && [[ $VALIDATION_WARNINGS -eq 0 ]]; then
        print_status "success" "Environment is perfect!" "All validations passed"
        echo ""
        print_status "info" "You're ready to develop:"
        echo "   • Web development: cd admin-panel && npm run dev"
        echo "   • Mobile development: cd student-app && flutter run"
        echo "   • Full setup: npm run setup:all"
    fi
    
    echo ""
}

# Function to generate report
generate_report() {
    print_status "header" "Validation Summary"
    echo "Environment Validation Report - $(date)"
    echo "=================================="
    echo "Status Summary:"
    echo "  ✅ Success: $VALIDATION_SUCCESS"
    echo "  ⚠️  Warnings: $VALIDATION_WARNINGS"
    echo "  ❌ Errors: $VALIDATION_ERRORS"
    echo ""
    
    if [[ $VALIDATION_ERRORS -eq 0 ]]; then
        echo "🎉 Environment is ready for development!"
        exit 0
    else
        echo "🚨 Environment has critical issues that need attention."
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Questerix Environment Validation Tool"
    echo "===================================="
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --web-only     Validate only web development environment"
    echo "  --mobile-only  Validate only mobile development environment"
    echo "  --shared-only  Validate only shared environment"
    echo "  --ide-only     Validate only IDE/Agent compatibility"
    echo "  --quiet        Suppress detailed output, show summary only"
    echo "  --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Validate everything"
    echo "  $0 --web-only         # Validate web environment only"
    echo "  $0 --mobile-only      # Validate mobile environment only"
    echo ""
}

# Main execution
main() {
    local web_only=false
    local mobile_only=false
    local shared_only=false
    local ide_only=false
    local quiet=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --web-only)
                web_only=true
                shift
                ;;
            --mobile-only)
                mobile_only=true
                shift
                ;;
            --shared-only)
                shared_only=true
                shift
                ;;
            --ide-only)
                ide_only=true
                shift
                ;;
            --quiet)
                quiet=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Run validations based on arguments
    if [[ "$web_only" == true ]]; then
        validate_web_environment
    elif [[ "$mobile_only" == true ]]; then
        validate_mobile_environment
    elif [[ "$shared_only" == true ]]; then
        validate_shared_environment
    elif [[ "$ide_only" == true ]]; then
        validate_ide_compatibility
    else
        # Run all validations
        validate_web_environment
        validate_mobile_environment
        validate_shared_environment
        validate_ide_compatibility
    fi
    
    # Provide recommendations and generate report
    if [[ "$quiet" != true ]]; then
        provide_recommendations
    fi
    
    generate_report
}

# Run main function with all arguments
main "$@"
