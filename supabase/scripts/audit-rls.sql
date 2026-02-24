-- ============================================================
-- RLS Completeness Audit — Dev Tool
-- ============================================================
-- Identifies all tables where a CRUD operation has NO policy.
-- Expected to return ZERO 🔴 rows for admin-managed tables.
--
-- NOTE: This query correctly expands cmd = 'ALL' into individual
-- operations so tables with a catch-all policy are not falsely
-- reported as missing policies for each operation.
--
-- Usage:
--   psql $DATABASE_URL -f supabase/scripts/audit-rls.sql
--   supabase db query --project-ref <ref> "$(cat supabase/scripts/audit-rls.sql)"
-- Run after every migration that touches the schema.
-- ============================================================

WITH all_tables AS (
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'supabase_%'
    AND tablename NOT IN ('schema_migrations')
),
-- Expand ALL policies into separate rows for SELECT/INSERT/UPDATE/DELETE
expanded_policies AS (
  SELECT DISTINCT tablename, expanded_cmd AS cmd
  FROM pg_policies,
  LATERAL (
    SELECT CASE
      WHEN cmd = 'ALL' THEN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE'])
      ELSE cmd
    END AS expanded_cmd
  ) e
  WHERE schemaname = 'public'
),
missing AS (
  SELECT t.tablename, c.cmd
  FROM all_tables t
  CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS c(cmd)
  LEFT JOIN expanded_policies ep ON t.tablename = ep.tablename AND c.cmd = ep.cmd
  WHERE ep.cmd IS NULL
)
SELECT
  tablename,
  STRING_AGG(cmd, ', ' ORDER BY cmd) AS missing_policies,
  CASE
    WHEN tablename IN (
      -- Admin-managed: MUST have all 4 policies
      'known_issues', 'error_logs', 'source_documents', 'security_logs',
      'curriculum_meta', 'app_landing_pages'
    ) THEN '🔴 REAL GAP — fix required'

    WHEN tablename IN (
      -- Student-write-only: INSERT only by design
      'attempts', 'sessions', 'skill_progress', 'profiles'
    ) THEN '🔵 Intentional (student INSERT only, no admin CRUD needed)'

    WHEN tablename IN (
      -- Service-role-only: no user-facing RLS needed
      'ai_token_usage', 'ai_generation_sessions', 'generation_audit_log',
      'tenant_quotas', 'student_recovery_keys', 'platform_config'
    ) THEN '🔵 Intentional (service role only)'

    WHEN tablename IN (
      -- RPC-only: accessed via SECURITY DEFINER functions
      'domains', 'skills', 'questions', 'subjects',
      'curriculum_snapshots', 'approval_workflows',
      'content_validation_rules'
    ) THEN '🔵 Intentional (RPC-gated, SECURITY DEFINER)'

    -- Intentional omissions documented here:
    -- security_logs.UPDATE: intentionally omitted — audit logs are append-only
    -- curriculum_snapshots.UPDATE: intentionally omitted — snapshots are immutable once published

    ELSE '🟡 Unknown — investigate before closing'
  END AS verdict
FROM missing
GROUP BY tablename
ORDER BY verdict, tablename;
