#!/usr/bin/env bash
# =============================================================================
# scripts/smoke-test.sh
# Questerix Post-Deploy Smoke Test
#
# Curls 5 production endpoints and exits non-zero if any returns a connection
# error (0) or a 5xx server error. Authentication failures (401/403) and
# client errors (400/404) are treated as "alive" signals — they prove the
# server is up and routing correctly.
#
# Usage:
#   bash scripts/smoke-test.sh
#   SUPABASE_ANON_KEY=xxx bash scripts/smoke-test.sh   # authenticated check
#
# Environment overrides:
#   SMOKE_ADMIN_URL      (default: https://admin.questerix.com)
#   SMOKE_STUDENT_URL    (default: https://app.questerix.com)
#   SMOKE_SUPABASE_URL   (default: https://bkfhorslctqieetzqdtd.supabase.co)
#   SMOKE_WORKERS_URL    (default: https://questerix-workers.mhalim80.workers.dev)
#   SUPABASE_ANON_KEY    (optional: adds apikey header for Supabase checks)
#   SMOKE_TIMEOUT        (default: 12)
#
# Exit codes:
#   0 — All endpoints are alive (no 5xx, no connection failure)
#   1 — One or more endpoints are down
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Color output helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[SMOKE]${NC} $*"; }
log_pass() { echo -e "${GREEN}[ OK  ]${NC} $*"; }
log_fail() { echo -e "${RED}[FAIL ]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN ]${NC} $*"; }

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ADMIN_URL="${SMOKE_ADMIN_URL:-https://admin.questerix.com}"
STUDENT_URL="${SMOKE_STUDENT_URL:-https://app.questerix.com}"
SUPABASE_URL="${SMOKE_SUPABASE_URL:-https://bkfhorslctqieetzqdtd.supabase.co}"
WORKERS_URL="${SMOKE_WORKERS_URL:-https://questerix-workers.mhalim80.workers.dev}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
CURL_TIMEOUT="${SMOKE_TIMEOUT:-12}"

# ---------------------------------------------------------------------------
# Endpoint table
# Format: "label|url|method|min_ok|max_ok|extra_header"
#
# Acceptance windows:
#   200-299  - Full success (used for fully public endpoints)
#   200-499  - "Alive" check (server responded; auth failures are valid signals)
#   400-400  - Edge function alive check (400 = deployed, routing, requires payload)
#
# Fields:
#   label        - Human-readable endpoint name
#   url          - Target URL
#   method       - HTTP method (GET or POST)
#   min_ok       - Minimum acceptable HTTP status
#   max_ok       - Maximum acceptable HTTP status
#   extra_header - Optional extra header (empty string if none)
# ---------------------------------------------------------------------------
declare -a ENDPOINTS=(
  "Admin Panel (CDN/SPA)|${ADMIN_URL}|GET|200|299|"
  "Student App (CDN/SPA)|${STUDENT_URL}|GET|200|299|"
  "Supabase REST API|${SUPABASE_URL}/rest/v1/|GET|200|401|"
  "Workers AI (/health)|${WORKERS_URL}/health|GET|200|299|"
  "Edge Fn (critical-alert)|${SUPABASE_URL}/functions/v1/critical-alert|GET|200|401|"
)

# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------
PASSED=0
FAILED=0
declare -a FAILED_LABELS=()

log_info "Questerix post-deploy smoke test"
log_info "  Admin:    ${ADMIN_URL}"
log_info "  Student:  ${STUDENT_URL}"
log_info "  Supabase: ${SUPABASE_URL}"
log_info "  Workers:  ${WORKERS_URL}"
log_info "  Timeout:  ${CURL_TIMEOUT}s per request"
echo ""

for entry in "${ENDPOINTS[@]}"; do
  IFS='|' read -r label url method min_ok max_ok extra_header <<< "$entry"

  CURL_ARGS=(
    --silent
    --output /dev/null
    --write-out "%{http_code}"
    --max-time "${CURL_TIMEOUT}"
    --location
    --request "${method}"
  )

  # Attach anon key for Supabase endpoints when available
  if [[ "$url" == *"supabase.co"* ]] && [[ -n "$SUPABASE_ANON_KEY" ]]; then
    CURL_ARGS+=(-H "apikey: ${SUPABASE_ANON_KEY}")
    CURL_ARGS+=(-H "Authorization: Bearer ${SUPABASE_ANON_KEY}")
  fi

  # Attach any extra headers defined for the endpoint
  if [[ -n "$extra_header" ]]; then
    CURL_ARGS+=(-H "$extra_header")
  fi

  HTTP_STATUS=$(curl "${CURL_ARGS[@]}" "$url" 2>/dev/null || echo "000")

  if [[ "$HTTP_STATUS" =~ ^[0-9]+$ ]] \
     && [[ "$HTTP_STATUS" -ge "$min_ok" ]] \
     && [[ "$HTTP_STATUS" -le "$max_ok" ]]; then
    log_pass "[HTTP ${HTTP_STATUS}] ${label}"
    PASSED=$((PASSED + 1))
  else
    if [[ "$HTTP_STATUS" == "000" ]]; then
      log_fail "[CONN_ERR] ${label} → ${url} (connection refused or timeout)"
    else
      log_fail "[HTTP ${HTTP_STATUS}] ${label} → ${url} (expected ${min_ok}-${max_ok})"
    fi
    FAILED=$((FAILED + 1))
    FAILED_LABELS+=("$label")
  fi
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
log_info "─────────────────────────────────────────────"
log_info "Results: ${PASSED} passed, ${FAILED} failed"
log_info "─────────────────────────────────────────────"

if [[ $FAILED -gt 0 ]]; then
  log_fail "FAILED endpoints:"
  for lbl in "${FAILED_LABELS[@]}"; do
    log_fail "  ✗ $lbl"
  done
  echo ""
  log_fail "Smoke test FAILED — deploy may have broken production endpoints."
  exit 1
else
  log_pass "All ${PASSED} endpoints are alive. Smoke test PASSED. ✓"
  exit 0
fi
