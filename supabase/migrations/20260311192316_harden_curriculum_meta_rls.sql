-- Migration: Harden Curriculum Meta and Snapshots RLS
-- Description: Enforce app_id isolation for curriculum metadata and snapshots.

BEGIN;

-- Harden curriculum_meta
DROP POLICY IF EXISTS curriculum_meta_read ON public.curriculum_meta;
CREATE POLICY curriculum_meta_read ON public.curriculum_meta
FOR SELECT TO authenticated
USING (app_id = current_app_id() OR jwt_is_super_admin());

DROP POLICY IF EXISTS curriculum_meta_admin_all ON public.curriculum_meta;
CREATE POLICY curriculum_meta_admin_all ON public.curriculum_meta
FOR ALL TO authenticated
USING (
    jwt_is_super_admin()
    OR
    (COALESCE((auth.jwt() ->> 'user_role') = 'admin', false) AND app_id = current_app_id())
);

-- Harden curriculum_snapshots
DROP POLICY IF EXISTS curriculum_snapshots_read ON public.curriculum_snapshots;
CREATE POLICY curriculum_snapshots_read ON public.curriculum_snapshots
FOR SELECT TO authenticated
USING (app_id = current_app_id() OR jwt_is_super_admin());

DROP POLICY IF EXISTS curriculum_snapshots_admin_all ON public.curriculum_snapshots;
CREATE POLICY curriculum_snapshots_admin_all ON public.curriculum_snapshots
FOR ALL TO authenticated
USING (
    jwt_is_super_admin()
    OR
    (COALESCE((auth.jwt() ->> 'user_role') = 'admin', false) AND app_id = current_app_id())
);

COMMIT;
