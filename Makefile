# Makefile - AppShell Monorepo
# =============================
# This file is part of the project template. Agents may modify targets to meet
# requirements but must NOT replace the contract (target names, port bindings,
# and Proof of Run expectations).
#
# Layout:
#   admin-panel/   (React + Vite + TS + TanStack Query + shadcn/ui)
#   supabase/      (Supabase project: migrations, config, scripts)

SHELL := /bin/bash
.ONESHELL:
.SILENT:

# ---------- Paths ----------
ADMIN_DIR   := admin-panel
SUPA_DIR    := supabase

# ---------- Ports ----------
WEB_PORT          ?= 5173

# ---------- Helpers ----------
define require_cmd
	@command -v $(1) >/dev/null 2>&1 || { echo "Missing dependency: $(1)"; exit 1; }
endef

.PHONY: help
help:
	@echo ""
	@echo "AppShell Makefile - Run and Test Contract"
	@echo "=========================================="
	@echo ""
	@echo "Admin Web (React/Vite):"
	@echo "  make web_setup        Install dependencies"
	@echo "  make web_dev          Run dev server (0.0.0.0:$(WEB_PORT))"
	@echo "  make web_lint         Lint code"
	@echo "  make web_test         Run tests"
	@echo "  make web_build        Production build"
	@echo ""
	@echo "Database (Supabase):"
	@echo "  make db_start         Start local Supabase stack"
	@echo "  make db_stop          Stop local Supabase stack"
	@echo "  make db_pull          Pull remote schema"
	@echo "  make db_migrate       Apply migrations"
	@echo "  make db_reset         Reset local DB (DESTRUCTIVE)"
	@echo "  make db_verify_rls    Run RLS verification"
	@echo ""
	@echo "CI/Validation:"
	@echo "  make setup            Unified environment setup"
	@echo "  make ci               Run all lint/test/build gates"
	@echo "  make validate_phase_0 Run Phase 0 validation script"
	@echo "  make validate_phase_1 Run Phase 1 validation script"
	@echo "  make validate_phase_2 Run Phase 2 validation script"
	@echo "  make validate_phase_3 Run Phase 3 validation script"
	@echo "  make validate_phase_4 Run Phase 4 validation script"
	@echo ""

# ==========================================================================
# Admin Web (React/Vite)
# ==========================================================================

.PHONY: web_setup
web_setup:
	$(call require_cmd,node)
	$(call require_cmd,npm)
	@echo "Installing Admin Panel dependencies..."
	cd "$(ADMIN_DIR)" && \
	if [ -f package-lock.json ]; then npm ci; else npm install; fi

.PHONY: web_dev
web_dev:
	$(call require_cmd,node)
	$(call require_cmd,npm)
	@echo "Starting Admin Panel dev server on 0.0.0.0:$(WEB_PORT)..."
	cd "$(ADMIN_DIR)" && npm run dev -- --host 0.0.0.0 --port $(WEB_PORT)

.PHONY: web_lint
web_lint:
	$(call require_cmd,node)
	$(call require_cmd,npm)
	@echo "Linting Admin Panel..."
	cd "$(ADMIN_DIR)" && npm run lint

.PHONY: web_test
web_test:
	$(call require_cmd,node)
	$(call require_cmd,npm)
	@echo "Testing Admin Panel..."
	cd "$(ADMIN_DIR)" && npm run test

.PHONY: web_build
web_build:
	$(call require_cmd,node)
	$(call require_cmd,npm)
	@echo "Building Admin Panel..."
	cd "$(ADMIN_DIR)" && npm run build


# ==========================================================================
# Database (Supabase)
# ==========================================================================

.PHONY: db_start
db_start:
	$(call require_cmd,supabase)
	@echo "Starting local Supabase stack..."
	cd "$(SUPA_DIR)" && supabase start

.PHONY: db_stop
db_stop:
	$(call require_cmd,supabase)
	@echo "Stopping local Supabase stack..."
	cd "$(SUPA_DIR)" && supabase stop

.PHONY: db_pull
db_pull:
	$(call require_cmd,supabase)
	@echo "Pulling remote schema..."
	cd "$(SUPA_DIR)" && supabase db pull

.PHONY: db_migrate
db_migrate:
	$(call require_cmd,supabase)
	@echo "Applying migrations..."
	cd "$(SUPA_DIR)" && supabase db push

.PHONY: db_reset
db_reset:
	$(call require_cmd,supabase)
	@echo "WARNING: Resetting local database (DESTRUCTIVE)..."
	cd "$(SUPA_DIR)" && supabase db reset

.PHONY: db_verify_rls
db_verify_rls:
	@echo "Running RLS verification..."
	cd "$(SUPA_DIR)" && bash ./scripts/verify_rls.sh

# ==========================================================================
# CI / Validation Gates
# ==========================================================================

.PHONY: ci
ci: web_setup web_lint web_test web_build
	@echo ""
	@echo "=========================================="
	@echo "CI gates passed."
	@echo "=========================================="

.PHONY: validate_phase_0
validate_phase_0:
	@echo "Running Phase 0 validation..."
	pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/validate-phase-0.ps1

.PHONY: validate_phase_1
validate_phase_1:
	@echo "Running Phase 1 validation..."
	pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/validate-phase-1.ps1

.PHONY: validate_phase_2
validate_phase_2:
	@echo "Running Phase 2 validation..."
	pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/validate-phase-2.ps1

.PHONY: validate_phase_3
validate_phase_3:
	@echo "Running Phase 3 validation..."
	pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/validate-phase-3.ps1

.PHONY: setup
setup:
	@echo "Running unified setup..."
	bash setup.sh

.PHONY: validate_phase_4
validate_phase_4:
	@echo "Running Phase 4 validation..."
	pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/validate-phase-4.ps1

# ==========================================================================
# Maintenance
# ==========================================================================

.PHONY: cleanup
cleanup:
	@echo "Running agent memory cleanup (LIVE)..."
	powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/maintenance/agent-memory-cleanup.ps1 -Verbose

.PHONY: cleanup_dry
cleanup_dry:
	@echo "Running agent memory cleanup (DRY RUN)..."
	powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/maintenance/agent-memory-cleanup.ps1 -DryRun -Verbose
