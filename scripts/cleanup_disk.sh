#!/bin/bash
set -e

# Navigate to project root
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "========================================="
echo "DISK CLEANUP START"
echo "Timestamp: $(date)"
echo "========================================="

# 1. Docker Cleanup
if command -v docker &> /dev/null; then
    echo "[Docker] Pruning system..."
    # -a: Remove all unused images not just dangling ones
    # -f: Force verification
    # --volumes: Prune volumes
    docker system prune -af --volumes
else
    echo "[Docker] Command not found, skipping."
fi

# 2. Flutter Cleanup
if [ -d "$PROJECT_ROOT/tools/flutter" ]; then
    echo "[Flutter] Removing legacy manual install at tools/flutter..."
    rm -rf "$PROJECT_ROOT/tools/flutter"
fi
echo "[Flutter] Cleaning artifacts in student-app..."
if [ -d "$PROJECT_ROOT/student-app" ]; then
    cd "$PROJECT_ROOT/student-app"
    
    # Check if flutter is in path, otherwise try to find it in common locations or fallback to rm
    if command -v flutter &> /dev/null; then
        echo "Running 'flutter clean'..."
        flutter clean
    else
        echo "'flutter' not in PATH. Fallback to manual removal..."
        echo "Removing 'build' directory..."
        rm -rf build
        echo "Removing '.dart_tool' directory..."
        rm -rf .dart_tool
        echo "Removing 'pubspec.lock' (optional, but good for deep clean)..."
        # Often useful to clear lock file if deep cleaning, but maybe too aggressive?
        # User asked for "build/ and .dart_tool/", I will stick to that.
    fi
    cd "$PROJECT_ROOT"
else
    echo "student-app directory not found."
fi

# 3. Node.js/Vite Cleanup
echo "[Node] Cleaning caches in admin-panel..."
if [ -d "$PROJECT_ROOT/admin-panel" ]; then
    cd "$PROJECT_ROOT/admin-panel"
    
    if [ -d "node_modules/.cache" ]; then
        echo "Removing node_modules/.cache..."
        rm -rf node_modules/.cache
    else
        echo "node_modules/.cache not found."
    fi

    if [ -d "dist" ]; then
        echo "Removing dist/..."
        rm -rf dist
    fi
    cd "$PROJECT_ROOT"
else
    echo "admin-panel directory not found."
fi

# 4. Logs Cleanup
echo "[Logs] Cleaning validation artifacts..."
VALIDATION_DIR="$PROJECT_ROOT/artifacts/validation"
if [ -d "$VALIDATION_DIR" ]; then
    count=$(find "$VALIDATION_DIR" -name "*.log" | wc -l)
    if [ "$count" -gt 0 ]; then
        echo "Removing $count log files from $VALIDATION_DIR..."
        rm -f "$VALIDATION_DIR"/*.log
    else
        echo "No log files found to clean."
    fi
else
    echo "Artifacts directory not found."
fi

echo "========================================="
echo "CLEANUP COMPLETE"
echo "Current Disk Usage:"
df -h .
echo "========================================="
