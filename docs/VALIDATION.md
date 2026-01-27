# Validation Guide

This document describes how to validate the project phases locally and in CI, including Strict Mode behavior.

## Running Validations Locally

The project includes validation scripts for each phase in `scripts/`.

### Usage
```bash
# Validate environment tools (Phase -1)
./scripts/validate-phase--1.sh

# Validate Bootstrap (Phase 0)
./scripts/validate-phase-0.sh

# ... and so on up to Phase 4
```

### Logging
Every run produces a log file in `artifacts/validation/`.
Example: `artifacts/validation/phase-0.log`
These logs contain:
- Command executed
- Tool versions (Flutter, Node, NPM, Docker)
- Exit code
- Environment information

## Validation Modes

The scripts support two modes via the `STRICT` environment variable.

### Non-Strict (Default)
Skipping checks (due to missing environment dependencies like Android SDK or physical devices) is allowed. Skips are logged as `SKIPPED`.

Example:
```bash
./scripts/validate-phase-4.sh
# Output: SKIPPED: Required Android packages (API 36) missing
# Exit Code: 0 (Pass)
```

### Strict Mode (CI)
Skipping checks creates a hard error. This is enforced in Continuous Integration (GitHub Actions).

Example:
```bash
STRICT=1 ./scripts/validate-phase-4.sh
# Output: ERROR: Skip not allowed in STRICT mode. Reason: Required Android packages (API 36) missing
# Exit Code: 1 (Fail)
```

## Disk Space and Cleaning
Validation scripts limit usage (via `check_disk`) to prevent running out of storage.
- **Phase 1**: Requires 2GB (Docker pulls).
- **Phase 4**: Requires 2GB (Android build artifacts).

If you are low on disk space:
```bash
# Run the cleanup utility
./scripts/cleanup_disk.sh

# Or manually:
docker system prune -af --volumes
cd student-app && flutter clean
rm -rf admin-panel/node_modules/.cache
```

## Flutter Setup
The project relies on the **System Flutter** installation (expected in `PATH`).
The deprecated `tools/flutter` directory should be removed if present.

## Codespaces Setup

### Installing Supabase CLI
NPM installation is not supported on Linux. Use the binary release:
```bash
# Example for Linux AMD64
wget https://github.com/supabase/cli/releases/download/v1.123.0/supabase_linux_amd64.tar.gz
tar -xzf supabase_linux_amd64.tar.gz
sudo mv supabase /usr/local/bin/
```

### Android Setup (Phase 4)
Phase 4 requires **API 36** packages. If running in CI or local environment that needs to pass Phase 4 strict:
```bash
# Install via sdkmanager (assuming it is in PATH or cmdline-tools)
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```
