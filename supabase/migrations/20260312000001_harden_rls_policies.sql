-- Migration: 20260312000001_harden_rls_policies.sql
-- Description: Hardens RLS policies for admin-managed tables to ensure strict tenant isolation.
-- This removes leaky "role-only" policies and replaces them with "role + app_id" checks.

-- 1. Hardening known_issues
DROP POLICY IF EXISTS "Anyone authenticated can view known issues" ON public.known_issues;
DROP POLICY IF EXISTS "known_issues_tenant_isolation" ON public.known_issues;
DROP POLICY IF EXISTS "known_issues_admin_insert" ON public.known_issues;
DROP POLICY IF EXISTS "known_issues_admin_update" ON public.known_issues;
DROP POLICY IF EXISTS "known_issues_admin_delete" ON public.known_issues;

CREATE POLICY "known_issues_isolation_select" ON public.known_issues
  FOR SELECT TO authenticated
  USING (app_id = public.current_app_id() OR jwt_is_super_admin());

CREATE POLICY "known_issues_isolation_insert" ON public.known_issues
  FOR INSERT TO authenticated
  WITH CHECK ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());

CREATE POLICY "known_issues_isolation_update" ON public.known_issues
  FOR UPDATE TO authenticated
  USING ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());

CREATE POLICY "known_issues_isolation_delete" ON public.known_issues
  FOR DELETE TO authenticated
  USING ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());


-- 2. Hardening source_documents
DROP POLICY IF EXISTS "Admins can manage source documents" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_admin_select" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_admin_insert" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_admin_update" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_admin_delete" ON public.source_documents;
DROP POLICY IF EXISTS "source_documents_admin_only" ON public.source_documents;

CREATE POLICY "source_documents_isolation_select" ON public.source_documents
  FOR SELECT TO authenticated
  USING (app_id = public.current_app_id() OR jwt_is_super_admin());

CREATE POLICY "source_documents_isolation_insert" ON public.source_documents
  FOR INSERT TO authenticated
  WITH CHECK ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());

CREATE POLICY "source_documents_isolation_update" ON public.source_documents
  FOR UPDATE TO authenticated
  USING ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());

CREATE POLICY "source_documents_isolation_delete" ON public.source_documents
  FOR DELETE TO authenticated
  USING ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());


-- 3. Hardening app_landing_pages
DROP POLICY IF EXISTS "landing_pages_public_read" ON public.app_landing_pages;
DROP POLICY IF EXISTS "landing_pages_admin_insert" ON public.app_landing_pages;
DROP POLICY IF EXISTS "landing_pages_admin_update" ON public.app_landing_pages;
DROP POLICY IF EXISTS "landing_pages_admin_delete" ON public.app_landing_pages;
DROP POLICY IF EXISTS "app_landing_pages_read" ON public.app_landing_pages;
DROP POLICY IF EXISTS "app_landing_pages_admin_all" ON public.app_landing_pages;

-- Public can only see published pages
CREATE POLICY "app_landing_pages_public_read" ON public.app_landing_pages
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Admins can manage their own app's pages
CREATE POLICY "app_landing_pages_isolation_select" ON public.app_landing_pages
  FOR SELECT TO authenticated
  USING (app_id = public.current_app_id() OR jwt_is_super_admin());

CREATE POLICY "app_landing_pages_isolation_insert" ON public.app_landing_pages
  FOR INSERT TO authenticated
  WITH CHECK ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());

CREATE POLICY "app_landing_pages_isolation_update" ON public.app_landing_pages
  FOR UPDATE TO authenticated
  USING ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());

CREATE POLICY "app_landing_pages_isolation_delete" ON public.app_landing_pages
  FOR DELETE TO authenticated
  USING ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());


-- 4. Hardening curriculum_meta
DROP POLICY IF EXISTS "curriculum_meta_read" ON public.curriculum_meta;
DROP POLICY IF EXISTS "curriculum_meta_admin_all" ON public.curriculum_meta;
DROP POLICY IF EXISTS "curriculum_meta_admin_write" ON public.curriculum_meta;
DROP POLICY IF EXISTS "curriculum_meta_admin_update" ON public.curriculum_meta;
DROP POLICY IF EXISTS "curriculum_meta_admin_delete" ON public.curriculum_meta;
DROP POLICY IF EXISTS "curriculum_meta_select_admin" ON public.curriculum_meta;
DROP POLICY IF EXISTS "curriculum_meta_insert_admin" ON public.curriculum_meta;
DROP POLICY IF EXISTS "curriculum_meta_update_admin" ON public.curriculum_meta;
DROP POLICY IF EXISTS "curriculum_meta_delete_admin" ON public.curriculum_meta;

CREATE POLICY "curriculum_meta_isolation_select" ON public.curriculum_meta
  FOR SELECT TO authenticated
  USING (app_id = public.current_app_id() OR jwt_is_super_admin());

CREATE POLICY "curriculum_meta_isolation_insert" ON public.curriculum_meta
  FOR INSERT TO authenticated
  WITH CHECK ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());

CREATE POLICY "curriculum_meta_isolation_update" ON public.curriculum_meta
  FOR UPDATE TO authenticated
  USING ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());

CREATE POLICY "curriculum_meta_isolation_delete" ON public.curriculum_meta
  FOR DELETE TO authenticated
  USING ((jwt_is_tenant_admin() AND app_id = public.current_app_id()) OR jwt_is_super_admin());
