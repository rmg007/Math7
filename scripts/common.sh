#!/bin/bash

# Configuration
STRICT=${STRICT:-0}
# Resolve root relative to this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/artifacts/validation"

# Helper to check disk space (in GB)
check_disk() {
    local min_gb=$1
    local mount_point="${2:-.}"
    
    # Get available space in bytes
    if ! command -v df >/dev/null; then
        echo "WARNING: 'df' not found, skipping disk check."
        return 0
    fi

    local avail
    # Linux df output: Filesystem 1k-blocks Used Available Use% Mounted on
    avail=$(df -k --output=avail "$mount_point" 2>/dev/null | tail -n 1)
    
    if [ -z "$avail" ]; then
        echo "WARNING: Could not check disk space."
        return 0
    fi

    # Convert to GB (approximate, /1024/1024)
    local avail_gb=$((avail / 1024 / 1024))
    
    if [ "$avail_gb" -lt "$min_gb" ]; then
        if [ "$STRICT" -eq 1 ]; then
            echo "ERROR: Insufficient disk space. Available: ${avail_gb}GB, Required: ${min_gb}GB."
            exit 1
        else
            echo "WARNING: Low disk space (${avail_gb}GB < ${min_gb}GB)."
            return 1 # Caller should decide to skip
        fi
    fi
    return 0
}

setup_logging() {
    local phase=$1
    
    mkdir -p "$LOG_DIR"
    local log_file="$LOG_DIR/phase-${phase}.log"
    
    # Try to write to log file
    if ! touch "$log_file" 2>/dev/null; then
        echo "WARNING: Cannot write to log file $log_file. Disk full? Logging to stdout only."
        if [ "$STRICT" -eq 1 ]; then
             echo "ERROR: Log creation failed in STRICT mode."
             exit 1
        fi
    else
        # Redirect stdout/stderr to tee
        exec > >(tee "$log_file") 2>&1
    fi

    echo "========================================="
    echo "VALIDATION PHASE $phase START"
    echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "Command: $0 $@"
    echo "STRICT Mode: $STRICT"
    
    echo "--- Tool Versions ---"
    
    # Flutter
    if command -v flutter >/dev/null; then
        echo "Flutter Path: $(which flutter)"
        flutter --version 2>/dev/null | head -n 1
    else
        echo "Flutter: Not found"
    fi
    
    # Node
    if command -v node >/dev/null; then
        echo "Node: $(node --version)"
    else
        echo "Node: Not found"
    fi
    
    # Docker
    if command -v docker >/dev/null; then
        docker --version
    else
        echo "Docker: Not found"
    fi
    
    echo "--- Environment ---"
    env | grep -E "^(PATH|ANDROID|FLUTTER|PUB|NODE|NPM|STRICT)" | sort || true
    echo "========================================="
}

handle_skip() {
    local reason=$1
    if [ "$STRICT" -eq 1 ]; then
        echo "ERROR: Skip not allowed in STRICT mode. Reason: $reason"
        exit 1
    else
        echo "SKIPPED: $reason"
        exit 0
    fi
}

require_cmd() {
    local cmd=$1
    if ! command -v "$cmd" >/dev/null 2>&1; then
        handle_skip "Command '$cmd' not found"
    fi
}

require_dir() {
    local dir=$1
    if [ ! -d "$dir" ]; then
        handle_skip "Directory '$dir' not found"
    fi
}
