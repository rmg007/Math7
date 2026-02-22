-- ============================================================
-- Fix Missing RLS Policies — Real Gap Remediation
-- Tables: known_issues, curriculum_meta, security_logs,
--         curriculum_snapshots, source_documents
-- ============================================================

-- ---- known_issues ----
-- Admins create, update, and delete known issues
CREATE POLICY known_issues_admin_insert ON public.known_issues
  FOR INSERT TO authenticated
  WITH CHECK (jwt_is_tenant_admin() OR jwt_is_super_admin());

CREATE POLICY known_issues_admin_update ON public.known_issues
  FOR UPDATE TO authenticated
  USING (jwt_is_tenant_admin() OR jwt_is_super_admin());

CREATE POLICY known_issues_admin_delete ON public.known_issues
  FOR DELETE TO authenticated
  USING (jwt_is_tenant_admin() OR jwt_is_super_admin());


-- ---- curriculum_meta ----
-- Admins can delete curriculum metadata (e.g., when unpublishing)
CREATE POLICY curriculum_meta_admin_delete ON public.curriculum_meta
  FOR DELETE TO authenticated
  USING (jwt_is_tenant_admin() OR jwt_is_super_admin());


-- ---- security_logs ----
-- Security logs are append-only records.
-- UPDATE intentionally omitted: security_logs entries must not be modified
--   after creation (immutability is a security requirement).
-- DELETE allowed for super admins only (log pruning / data retention).
CREATE POLICY security_logs_admin_delete ON public.security_logs
  FOR DELETE TO authenticated
  USING (jwt_is_super_admin());


-- ---- curriculum_snapshots ----
-- Admins can delete old snapshots. INSERT is via publish RPC (SECURITY DEFINER).
-- UPDATE intentionally omitted: snapshots are immutable once published.
CREATE POLICY curriculum_snapshots_admin_delete ON public.curriculum_snapshots
  FOR DELETE TO authenticated
  USING (jwt_is_tenant_admin() OR jwt_is_super_admin());


-- ---- source_documents ---- (Table missing in current schema sequence - skipping)
-- CREATE POLICY source_documents_admin_select ON public.source_documents ...
