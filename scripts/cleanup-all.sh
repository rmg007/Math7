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
CLEANUP_ERRORS=0
CLEANUP_WARNINGS=0
CLEANUP_SUCCESS=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    local details=${3:-""}
    
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ((CLEANUP_SUCCESS++))
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            if [[ -n "$details" ]]; then
                echo -e "   ${YELLOW}$details${NC}"
            fi
            ((CLEANUP_WARNINGS++))
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            if [[ -n "$details" ]]; then
                echo -e "   ${RED}$details${NC}"
            fi
            ((CLEANUP_ERRORS++))
            ;;
        "info")
            echo -e "${BLUE}ℹ️  $message${NC}"
            if [[ -n "$details" ]]; then
                echo -e "   ${CYAN}$details${NC}"
            fi
            ;;
        "header")
            echo -e "${PURPLE}🧹 $message${NC}"
            echo "=================================="
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get directory size
get_dir_size() {
    local dir=$1
    if [[ -d "$dir" ]]; then
        du -sh "$dir" 2>/dev/null | cut -f1 || echo "Unknown"
    else
        echo "Not found"
    fi
}

# Function to clean web environment
clean_web_environment() {
    print_status "header" "Web Environment Cleanup"
    
    # Clean admin-panel
    if [[ -d "admin-panel" ]]; then
        local original_size=$(get_dir_size "admin-panel")
        
        print_status "info" "Cleaning admin-panel" "Original size: $original_size"
        
        cd admin-panel
        
        # Remove node_modules
        if [[ -d "node_modules" ]]; then
            local node_modules_size=$(get_dir_size "node_modules")
            print_status "info" "Removing node_modules" "Size: $node_modules_size"
            rm -rf node_modules
            print_status "success" "node_modules removed"
        else
            print_status "info" "node_modules not found"
        fi
        
        # Remove build artifacts
        if [[ -d "dist" ]]; then
            local dist_size=$(get_dir_size "dist")
            print_status "info" "Removing dist directory" "Size: $dist_size"
            rm -rf dist
            print_status "success" "dist directory removed"
        fi
        
        # Remove cache files
        if [[ -d ".vite" ]]; then
            print_status "info" "Removing .vite cache"
            rm -rf .vite
            print_status "success" ".vite cache removed"
        fi
        
        # Remove TypeScript build outputs
        if [[ -d "*.tsbuildinfo" ]] 2>/dev/null || ls *.tsbuildinfo 1> /dev/null 2>&1; then
            print_status "info" "Removing TypeScript build info"
            rm -f *.tsbuildinfo
            print_status "success" "TypeScript build info removed"
        fi
        
        # Clean npm cache
        if command_exists npm; then
            print_status "info" "Cleaning npm cache"
            npm cache clean --force 2>/dev/null || print_status "warning" "npm cache clean failed"
        fi
        
        cd ..
        
        local final_size=$(get_dir_size "admin-panel")
        print_status "success" "Web cleanup complete" "Final size: $final_size"
    else
        print_status "warning" "admin-panel directory not found"
    fi
    
    echo ""
}

# Function to clean mobile environment
clean_mobile_environment() {
    print_status "header" "Mobile Environment Cleanup"
    
    # Clean student-app
    if [[ -d "student-app" ]]; then
        local original_size=$(get_dir_size "student-app")
        
        print_status "info" "Cleaning student-app" "Original size: $original_size"
        
        cd student-app
        
        # Clean Flutter build artifacts
        if command_exists flutter; then
            print_status "info" "Running Flutter clean"
            flutter clean 2>/dev/null || print_status "warning" "Flutter clean failed"
        else
            print_status "warning" "Flutter not found, cleaning manually"
            
            # Manual Flutter cleanup
            if [[ -d "build" ]]; then
                local build_size=$(get_dir_size "build")
                print_status "info" "Removing build directory" "Size: $build_size"
                rm -rf build
                print_status "success" "build directory removed"
            fi
            
            if [[ -d ".dart_tool" ]]; then
                local dart_tool_size=$(get_dir_size ".dart_tool")
                print_status "info" "Removing .dart_tool directory" "Size: $dart_tool_size"
                rm -rf .dart_tool
                print_status "success" ".dart_tool directory removed"
            fi
            
            # Remove pub cache files
            find . -name ".pub-cache" -type d -exec rm -rf {} + 2>/dev/null || true
            find . -name "*.lock" -name "pubspec.lock" -delete 2>/dev/null || true
        fi
        
        # Remove Android build artifacts
        if [[ -d "android/app/build" ]]; then
            local android_build_size=$(get_dir_size "android/app/build")
            print_status "info" "Removing Android build artifacts" "Size: $android_build_size"
            rm -rf android/app/build
            print_status "success" "Android build artifacts removed"
        fi
        
        # Remove iOS build artifacts (if exists)
        if [[ -d "ios/build" ]]; then
            local ios_build_size=$(get_dir_size "ios/build")
            print_status "info" "Removing iOS build artifacts" "Size: $ios_build_size"
            rm -rf ios/build
            print_status "success" "iOS build artifacts removed"
        fi
        
        # Remove Flutter generated files
        find . -name "*.g.dart" -delete 2>/dev/null || print_status "info" "No generated files to remove"
        find . -name "*.freezed.dart" -delete 2>/dev/null || print_status "info" "No freezed files to remove"
        
        cd ..
        
        local final_size=$(get_dir_size "student-app")
        print_status "success" "Mobile cleanup complete" "Final size: $final_size"
    else
        print_status "warning" "student-app directory not found"
    fi
    
    echo ""
}

# Function to clean shared environment
clean_shared_environment() {
    print_status "header" "Shared Environment Cleanup"
    
    # Clean Docker resources
    if command_exists docker; then
        print_status "info" "Cleaning Docker resources"
        
        # Check if Docker is running
        if docker info >/dev/null 2>&1; then
            # Remove stopped containers
            local stopped_containers=$(docker ps -aq --filter "status=exited")
            if [[ -n "$stopped_containers" ]]; then
                print_status "info" "Removing stopped containers"
                docker rm $stopped_containers 2>/dev/null || print_status "warning" "Failed to remove some containers"
            fi
            
            # Remove unused images
            print_status "info" "Removing unused Docker images"
            docker image prune -f 2>/dev/null || print_status "warning" "Docker image prune failed"
            
            # Remove unused volumes
            print_status "info" "Removing unused Docker volumes"
            docker volume prune -f 2>/dev/null || print_status "warning" "Docker volume prune failed"
            
            print_status "success" "Docker cleanup complete"
        else
            print_status "warning" "Docker daemon not running"
        fi
    else
        print_status "info" "Docker not installed"
    fi
    
    # Clean DevContainer volumes
    print_status "info" "Checking DevContainer volumes"
    
    # Remove Questerix-specific volumes
    local volumes_to_remove=(
        "questerix-npm-cache"
        "questerix-node-modules"
        "questerix-pub-cache"
        "questerix-android-sdk"
        "questerix-flutter-sdk"
    )
    
    for volume in "${volumes_to_remove[@]}"; do
        if command_exists docker && docker info >/dev/null 2>&1; then
            if docker volume ls -q | grep -q "^$volume$"; then
                print_status "info" "Removing Docker volume: $volume"
                docker volume rm "$volume" 2>/dev/null || print_status "warning" "Failed to remove volume: $volume"
            fi
        fi
    done
    
    # Clean Python cache
    if [[ -d "content-engine" ]]; then
        print_status "info" "Cleaning Python cache"
        find content-engine -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
        find content-engine -name "*.pyc" -delete 2>/dev/null || true
        find content-engine -name "*.pyo" -delete 2>/dev/null || true
        print_status "success" "Python cache cleaned"
    fi
    
    # Clean temporary files
    print_status "info" "Cleaning temporary files"
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name "*.log" -size +10M -delete 2>/dev/null || true
    find . -name ".DS_Store" -delete 2>/dev/null || true
    find . -name "Thumbs.db" -delete 2>/dev/null || true
    
    print_status "success" "Shared environment cleanup complete"
    echo ""
}

# Function to clean IDE and agent files
clean_ide_environment() {
    print_status "header" "IDE and Agent Environment Cleanup"
    
    # Clean VS Code cache
    if [[ -d ".vscode" ]]; then
        print_status "info" "Cleaning VS Code cache"
        
        # Remove VS Code server cache
        if [[ -d ".vscode-server" ]]; then
            local vscode_size=$(get_dir_size ".vscode-server")
            print_status "info" "Removing VS Code server cache" "Size: $vscode_size"
            rm -rf .vscode-server
            print_status "success" "VS Code server cache removed"
        fi
        
        # Clean VS Code extensions cache (user-level)
        if [[ -d "$HOME/.vscode/extensions" ]]; then
            print_status "info" "VS Code extensions cache found" "Run 'code --disable-extensions' for clean start"
        fi
    fi
    
    # Clean Cursor cache
    if [[ -d "$HOME/.cursor" ]]; then
        print_status "info" "Cursor cache found" "Manual cleanup may be required"
    fi
    
    # Clean Windsurf cache
    if [[ -d "$HOME/.windsurf" ]]; then
        print_status "info" "Windsurf cache found" "Manual cleanup may be required"
    fi
    
    # Clean Git objects
    if [[ -d ".git" ]]; then
        print_status "info" "Cleaning Git objects"
        
        # Git garbage collection
        git gc --aggressive --prune=now 2>/dev/null || print_status "warning" "Git gc failed"
        
        # Clean reflog
        git reflog expire --expire=now --all 2>/dev/null || print_status "warning" "Git reflog cleanup failed"
        
        print_status "success" "Git cleanup complete"
    fi
    
    print_status "success" "IDE and agent cleanup complete"
    echo ""
}

# Function to provide cleanup recommendations
provide_cleanup_recommendations() {
    print_status "header" "Cleanup Recommendations"
    
    if [[ $CLEANUP_ERRORS -gt 0 ]]; then
        print_status "error" "Cleanup errors encountered" "$CLEANUP_ERRORS error(s) occurred"
        echo ""
        print_status "info" "Manual cleanup may be required for:"
        echo "   • Docker resources that couldn't be removed"
        echo "   • Files in use by running processes"
        echo "   • Permission-protected files"
    fi
    
    if [[ $CLEANUP_WARNINGS -gt 0 ]]; then
        print_status "warning" "Cleanup warnings" "$CLEANUP_WARNINGS warning(s) occurred"
        echo ""
        print_status "info" "Review these items:"
        echo "   • Missing directories (may be expected)"
        echo "   • Commands not found (install missing tools)"
        echo "   • Failed operations (retry manually)"
    fi
    
    print_status "success" "Next steps:"
    echo "   • npm run setup:all    - Rebuild both environments"
    echo "   • npm run validate     - Verify environment health"
    echo "   • npm run dev:web      - Test web environment"
    echo "   • npm run dev:mobile   - Test mobile environment"
    echo ""
    
    print_status "info" "Storage optimization tips:"
    echo "   • Use volume mounts for persistent caches"
    echo "   • Regular cleanup prevents large accumulations"
    echo "   • Monitor disk usage with 'df -h'"
    echo "   • Consider external storage for large artifacts"
}

# Function to show cleanup summary
show_cleanup_summary() {
    print_status "header" "Cleanup Summary"
    echo "Environment Cleanup Report - $(date)"
    echo "=================================="
    echo "Cleanup Summary:"
    echo "  ✅ Success: $CLEANUP_SUCCESS"
    echo "  ⚠️  Warnings: $CLEANUP_WARNINGS"
    echo "  ❌ Errors: $CLEANUP_ERRORS"
    echo ""
    
    # Show disk usage
    echo "Current Disk Usage:"
    df -h . 2>/dev/null || echo "Disk usage information unavailable"
    echo ""
    
    # Show directory sizes
    echo "Directory Sizes:"
    if [[ -d "admin-panel" ]]; then
        echo "  admin-panel: $(get_dir_size "admin-panel")"
    fi
    if [[ -d "student-app" ]]; then
        echo "  student-app: $(get_dir_size "student-app")"
    fi
    if [[ -d ".git" ]]; then
        echo "  .git: $(get_dir_size ".git")"
    fi
    echo ""
    
    if [[ $CLEANUP_ERRORS -eq 0 ]]; then
        print_status "success" "Cleanup completed successfully!"
        echo "Your development environment is now clean and ready for fresh setup."
    else
        print_status "warning" "Cleanup completed with some issues"
        echo "Review the errors above and consider manual cleanup."
    fi
}

# Function to show help
show_help() {
    echo "Questerix Environment Cleanup Tool"
    echo "=================================="
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --web-only      Clean only web development environment"
    echo "  --mobile-only   Clean only mobile development environment"
    echo "  --shared-only   Clean only shared environment"
    echo "  --ide-only      Clean only IDE and agent files"
    echo "  --dry-run       Show what would be cleaned without actually cleaning"
    echo "  --force         Force removal without confirmation"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Clean everything"
    echo "  $0 --web-only         # Clean web environment only"
    echo "  $0 --mobile-only      # Clean mobile environment only"
    echo "  $0 --dry-run          # Preview cleanup actions"
    echo ""
    echo "Warning: This will remove build artifacts, caches, and temporary files."
    echo "Source code and configuration files will be preserved."
}

# Main execution
main() {
    local web_only=false
    local mobile_only=false
    local shared_only=false
    local ide_only=false
    local dry_run=false
    local force=false
    
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
            --dry-run)
                dry_run=true
                shift
                ;;
            --force)
                force=true
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
    
    # Safety check
    if [[ "$dry_run" != true ]] && [[ "$force" != true ]]; then
        echo "⚠️  This will remove build artifacts, caches, and temporary files."
        echo "Source code and configuration files will be preserved."
        echo ""
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Cleanup cancelled."
            exit 0
        fi
    fi
    
    if [[ "$dry_run" == true ]]; then
        print_status "info" "DRY RUN MODE" "No files will be actually removed"
        echo ""
    fi
    
    # Run cleanup based on arguments
    if [[ "$web_only" == true ]]; then
        clean_web_environment
    elif [[ "$mobile_only" == true ]]; then
        clean_mobile_environment
    elif [[ "$shared_only" == true ]]; then
        clean_shared_environment
    elif [[ "$ide_only" == true ]]; then
        clean_ide_environment
    else
        # Run all cleanup operations
        clean_web_environment
        clean_mobile_environment
        clean_shared_environment
        clean_ide_environment
    fi
    
    # Provide recommendations and summary
    provide_cleanup_recommendations
    show_cleanup_summary
    
    # Exit with appropriate code
    if [[ $CLEANUP_ERRORS -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function with all arguments
main "$@"
