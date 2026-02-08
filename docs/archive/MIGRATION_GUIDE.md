# Database Migration Guide

See also:

- `docs/DEVELOPMENT.md`
- `docs/CI_CONTRACT.md`
- `docs/VALIDATION.md`

## Prerequisites
You need access to your Supabase project's SQL Editor or database connection.

## Option 1: Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/sql
2. Copy and paste the contents of each migration file in order (001-015)
3. Run each migration sequentially
4. After all migrations, run the seed.sql file

## Option 2: Using psql (If you have database credentials)

```bash
# Get your database connection string from Supabase Dashboard > Settings > Database
# Connection string format: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres

# Apply all migrations
psql "postgresql://postgres:[PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres" \
  -f supabase/migrations/20260127000001_create_extensions_and_enums.sql \
  -f supabase/migrations/20260127000002_create_profiles.sql \
  -f supabase/migrations/20260127000003_create_domains.sql \
  -f supabase/migrations/20260127000004_create_skills.sql \
  -f supabase/migrations/20260127000005_create_questions.sql \
  -f supabase/migrations/20260127000006_create_attempts.sql \
  -f supabase/migrations/20260127000007_create_sessions.sql \
  -f supabase/migrations/20260127000008_create_skill_progress.sql \
  -f supabase/migrations/20260127000009_create_outbox.sql \
  -f supabase/migrations/20260127000010_create_sync_meta.sql \
  -f supabase/migrations/20260127000011_create_curriculum_meta.sql \
  -f supabase/migrations/20260127000012_create_indexes.sql \
  -f supabase/migrations/20260127000013_create_triggers.sql \
  -f supabase/migrations/20260127000014_create_rls_policies.sql \
  -f supabase/migrations/20260127000015_create_rpc_functions.sql \
  -f supabase/seed.sql
```

## Option 3: All-in-One Script (Dashboard)

A combined migration script is available at: `scripts/apply-migrations-dashboard.sql`

This file contains all migrations in one script that can be pasted into the Supabase SQL Editor.

## Verification

After running migrations, verify tables exist:
```bash
curl -X GET 'https://[YOUR-PROJECT-ID].supabase.co/rest/v1/profiles?select=*&limit=1' \
  -H "apikey: [YOUR-ANON-KEY]"
```

If successful, you should see [] (empty array) instead of error "Could not find the table".
