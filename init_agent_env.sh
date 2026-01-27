#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

echo "========================================"
echo "  Agent Environment Initialization"
echo "========================================"

# 1. Create Directory Topology
echo ""
echo "[1/4] Creating directory structure..."
mkdir -p AppShell/docs
mkdir -p admin-panel/src/features
mkdir -p admin-panel/src/components/ui
mkdir -p admin-panel/src/lib
mkdir -p admin-panel/src/hooks
mkdir -p student-app/lib/src/features
mkdir -p student-app/lib/src/core
mkdir -p student-app/lib/src/routing
mkdir -p supabase/migrations
mkdir -p scripts
echo "  ✓ Directory topology created"

# 2. Verify AGENTS.md exists
echo ""
echo "[2/4] Verifying AGENTS.md..."
if [ -f "AppShell/docs/AGENTS.md" ]; then
  echo "  ✓ AGENTS.md exists"
else
  echo "  ✗ ERROR: AppShell/docs/AGENTS.md not found"
  echo "    Please ensure AGENTS.md is present before continuing."
  exit 1
fi

# 3. Verify SCHEMA.md exists
echo ""
echo "[3/4] Verifying SCHEMA.md..."
if [ -f "AppShell/docs/SCHEMA.md" ]; then
  echo "  ✓ SCHEMA.md exists"
else
  echo "  ✗ ERROR: AppShell/docs/SCHEMA.md not found"
  echo "    Please ensure SCHEMA.md is present before continuing."
  exit 1
fi

# 4. Initialize PHASE_STATE.json if not exists
echo ""
echo "[4/4] Initializing PHASE_STATE.json..."
if [ -f "PHASE_STATE.json" ]; then
  echo "  ✓ PHASE_STATE.json already exists (preserving current state)"
else
  cat << 'EOF' > PHASE_STATE.json
{
  "current_phase": 0,
  "completed_phases": [],
  "phase_artifacts": {},
  "blocked_on": null,
  "last_error": null
}
EOF
  echo "  ✓ PHASE_STATE.json initialized"
fi

# 5. Display current state
echo ""
echo "========================================"
echo "  Environment Ready"
echo "========================================"
echo ""
echo "Directory Structure:"
echo "  ├── AppShell/docs/"
echo "  │   ├── AGENTS.md    (The Law)"
echo "  │   └── SCHEMA.md    (Database Truth)"
echo "  ├── admin-panel/src/"
echo "  ├── student-app/lib/src/"
echo "  ├── supabase/migrations/"
echo "  └── PHASE_STATE.json (Progress Tracker)"
echo ""
echo "Current Phase: $(grep -o '"current_phase": [0-9]*' PHASE_STATE.json | grep -o '[0-9]*')"
echo ""
echo "Next Steps:"
echo "  1. Run Phase -1: Environment Validation"
echo "     - flutter --version (>= 3.19.0)"
echo "     - node --version (>= 18.0.0)"
echo "     - supabase --version (>= 1.123.0)"
echo "  2. Execute Phase 0: Project Bootstrap"
echo "     - flutter create student-app"
echo "     - npm create vite@latest admin-panel"
echo "     - supabase init"
echo ""
echo "Agent is ready for Phase 1 (Data Foundations)."
echo "========================================"
