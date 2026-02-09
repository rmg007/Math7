# Questerix - Educational Platform

## Overview
Questerix is a comprehensive multi-tenant educational platform featuring student/mentor/admin roles, curriculum management, AI-powered question generation, progress tracking, and secure content management.

## Recent Changes
- **2026-02-09**: Migrated from Supabase to Neon Postgres with Drizzle ORM
  - Replaced Supabase client SDK with custom API client
  - Created Express API server with JWT authentication
  - Ported Supabase Edge Functions to Express routes
  - Created Drizzle schema with 33 tables
  - Set up Vite proxy for API calls

## Architecture

### Backend
- **Express API Server** (`server/index.ts`) on port 3001
  - JWT-based authentication (login, register, session management)
  - Generic CRUD endpoint (`POST /api/data`) handles all database operations
  - RPC endpoints (`POST /api/rpc/:name`) for custom functions
  - Edge function replacements (`POST /api/functions/:name`)
- **Database**: Neon Postgres (Replit built-in) via `DATABASE_URL`
- **ORM**: Drizzle ORM with schema at `shared/schema.ts`

### Frontend
- **Admin Panel** (`admin-panel/`) - React/Vite app on port 5000
  - Supabase-compatible API client at `admin-panel/src/lib/supabase.ts`
  - Uses React Query for data fetching
  - Radix UI components with Tailwind CSS
- **Student App** (`student-app/`) - Flutter web/mobile app (not yet migrated)

### Key Files
- `server/index.ts` - Express API server
- `shared/schema.ts` - Drizzle ORM schema (33 tables)
- `drizzle.config.ts` - Drizzle Kit configuration
- `admin-panel/src/lib/supabase.ts` - API client (Supabase-compatible interface)
- `admin-panel/vite.config.ts` - Vite config with API proxy to server
- `supabase/` - Original Supabase migrations (reference only)

### Database Tables (33 total)
Core: profiles, subjects, apps, domains, skills, questions
Tracking: attempts, sessions, skill_progress
Groups: groups, group_members, assignments
Support: invitation_codes, curriculum_meta, curriculum_snapshots, outbox, sync_meta
Platform: app_landing_pages, user_subscriptions, security_events, security_logs
Monitoring: error_logs, known_issues
AI: source_documents, ai_generation_sessions, generation_audit_log, tenant_quotas, content_validation_rules, approval_workflows
Specs: specifications, spec_validations
Knowledge: kb_registry, kb_metrics

### Workflows
- **Server**: `npx tsx server/index.ts` (port 3001)
- **Admin Panel**: `npx vite --port 5000 --host 0.0.0.0` (port 5000)

### Auth
- JWT tokens with bcrypt password hashing
- Seed admin: admin@questerix.com / admin123
- Roles: super_admin, admin, student, mentor

## User Preferences
- Track migration progress in `.local/state/replit/agent/progress_tracker.md`
