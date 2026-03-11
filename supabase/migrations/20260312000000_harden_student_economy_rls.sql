-- Migration: Harden Student Economy and Tracking RLS
-- Description: Standardize policies on current_app_id(), add super_admin bypass, and enforce strict app_id isolation.
-- Task: HARDEN-003

BEGIN;

-- Standardize user_metadata
DROP POLICY IF EXISTS user_metadata_isolation ON public.user_metadata;
CREATE POLICY user_metadata_isolation ON public.user_metadata
FOR ALL TO authenticated
USING (
    jwt_is_super_admin()
    OR
    (id = auth.uid() AND app_id = current_app_id())
    OR
    (jwt_is_admin() AND app_id = current_app_id())
)
WITH CHECK (
    jwt_is_super_admin()
    OR
    (id = auth.uid() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
    OR
    (jwt_is_admin() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- Standardize user_activity
DROP POLICY IF EXISTS user_activity_isolation ON public.user_activity;
CREATE POLICY user_activity_isolation ON public.user_activity
FOR ALL TO authenticated
USING (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = current_app_id())
    OR
    (jwt_is_admin() AND app_id = current_app_id())
)
WITH CHECK (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
    OR
    (jwt_is_admin() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- Standardize purchases
DROP POLICY IF EXISTS purchases_isolation ON public.purchases;
CREATE POLICY purchases_isolation ON public.purchases
FOR ALL TO authenticated
USING (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = current_app_id())
    OR
    (jwt_is_admin() AND app_id = current_app_id())
)
WITH CHECK (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
    OR
    (jwt_is_admin() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- Standardize attempts
DROP POLICY IF EXISTS attempts_isolation ON public.attempts;
CREATE POLICY attempts_isolation ON public.attempts
FOR ALL TO authenticated
USING (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = current_app_id())
    OR
    (jwt_is_admin() AND app_id = current_app_id())
)
WITH CHECK (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
    OR
    (jwt_is_admin() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- Standardize sessions
DROP POLICY IF EXISTS sessions_isolation ON public.sessions;
CREATE POLICY sessions_isolation ON public.sessions
FOR ALL TO authenticated
USING (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = current_app_id())
    OR
    (jwt_is_admin() AND app_id = current_app_id())
)
WITH CHECK (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
    OR
    (jwt_is_admin() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

-- Standardize skill_progress
DROP POLICY IF EXISTS skill_progress_isolation ON public.skill_progress;
CREATE POLICY skill_progress_isolation ON public.skill_progress
FOR ALL TO authenticated
USING (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = current_app_id())
    OR
    (jwt_is_admin() AND app_id = current_app_id())
)
WITH CHECK (
    jwt_is_super_admin()
    OR
    (user_id = auth.uid() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
    OR
    (jwt_is_admin() AND app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid()))
);

COMMIT;
