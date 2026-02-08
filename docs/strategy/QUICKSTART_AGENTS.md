# Quickstart for AI Agents

**Welcome to Questerix.**

## 1. Where are you?
You are in a multi-repo monorepo (Flutter + React + Supabase).

## 2. What is the current goal?
Read `PHASE_STATE.json`. This file tracks the active phase of development.

## 3. How do I work safely?
1.  **Read**: `docs/strategy/AGENTS.md` (The Protocol).
2.  **Check**: `AI_CODING_INSTRUCTIONS.md` (The Hard Rules).
3.  **Validate**: Run `scripts/validate-phase-X.ps1` before finishing.

## 4. Key Constraints
- **Offline-First**: Mobile app writes to local Drift DB, then syncs.
- **Strict Types**: TypeScript and Dart types must match Supabase schema.
- **No Fluff**: Do not create "demo" code. Write for production.

## 5. Where is the code?
- **Student App**: `student-app/` (Flutter)
- **Admin Panel**: `admin-panel/` (React)
- **Backend Infrastructure**: `supabase/` (SQL, Edge Functions)
- **Shared Logic**: `questerix_domain/` (Dart)
