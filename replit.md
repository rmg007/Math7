# Questerix - Educational Platform

## Overview
Questerix is a comprehensive multi-tenant educational platform featuring student/mentor/admin roles, curriculum management, AI-powered question generation, progress tracking, and secure content management.

## Recent Changes
- **2026-02-09**: Reverted to original Supabase architecture
  - Restored original Supabase client SDK (`@supabase/supabase-js`)
  - Removed Express API server and Drizzle ORM migration
  - App uses Supabase for database, auth, edge functions, and RLS
  - Production hosted on Cloudflare + Supabase

## Architecture

### Backend
- **Supabase** - Handles database, authentication, edge functions, and RLS
- **Supabase Edge Functions** (`supabase/functions/`) - Serverless functions for AI, content validation, etc.

### Frontend
- **Admin Panel** (`admin-panel/`) - React/Vite app on port 5000
  - Uses `@supabase/supabase-js` client at `admin-panel/src/lib/supabase.ts`
  - Uses React Query for data fetching
  - Radix UI components with Tailwind CSS
- **Student App** (`student-app/`) - Flutter web/mobile app

### Key Files
- `admin-panel/src/lib/supabase.ts` - Supabase client
- `admin-panel/vite.config.ts` - Vite config
- `supabase/` - Supabase migrations and edge functions

### Environment Variables (Required)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Workflows
- **Admin Panel**: `cd admin-panel && npx vite --port 5000 --host 0.0.0.0`

### Auth
- Supabase Auth with email/password
- Roles: super_admin, admin, student, mentor

### Hosting
- **Production**: Cloudflare (frontend) + Supabase (backend/database)
- **Development**: Replit (this environment)

## User Preferences
- Keep using Supabase - do not migrate to Replit database
- Push changes to GitHub for Cloudflare deployment
