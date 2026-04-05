#!/bin/bash
# Questerix Unified Setup Script
# This script initializes the environment and verifies dependencies.

set -euo pipefail

# 1. Directory Structure Initialization
echo "Initializing directory structure..."
bash init_agent_env.sh

# 2. Dependency Verification
echo ""
echo "Verifying dependencies..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    pwsh -File scripts/validate-phase-1.ps1
else
    bash scripts/validate-phase-1.sh
fi

echo ""
echo "Setup complete! Refer to docs/technical/PORTABILITY.md for next steps."
