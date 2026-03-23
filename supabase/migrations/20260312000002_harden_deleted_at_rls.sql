-- ══════════════════════════════════════════════════════════════════════════════
-- HARDENED RLS POLICIES FOR DELETED_AT (Tombstone Filtering)
-- Created: 2026-03-12
-- Description: Ensures that deleted items are filtered out for students by default, 
--              while allowing admins to see them for audit and restoration purposes.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. PROFILES
DROP POLICY IF EXISTS profiles_tenant_isolation ON public.profiles;
CREATE POLICY profiles_tenant_isolation ON public.profiles
FOR ALL TO authenticated
USING (
    public.jwt_is_super_admin()
    OR
    (
        app_id = public.current_app_id() 
        AND (id = auth.uid() OR public.jwt_is_admin())
        AND (public.jwt_is_admin() OR deleted_at IS NULL)
    )
);

-- 2. DOMAINS
DROP POLICY IF EXISTS curriculum_tenant_isolation ON public.domains;
CREATE POLICY curriculum_tenant_isolation ON public.domains
FOR ALL TO authenticated
USING (
    public.jwt_is_super_admin()
    OR
    (
        app_id = public.current_app_id()
        AND (public.jwt_is_admin() OR deleted_at IS NULL)
    )
);

-- 3. SKILLS
DROP POLICY IF EXISTS curriculum_tenant_isolation ON public.skills;
CREATE POLICY curriculum_tenant_isolation ON public.skills
FOR ALL TO authenticated
USING (
    public.jwt_is_super_admin()
    OR
    (
        app_id = public.current_app_id()
        AND (public.jwt_is_admin() OR deleted_at IS NULL)
    )
);

-- 4. QUESTIONS
DROP POLICY IF EXISTS curriculum_tenant_isolation ON public.questions;
CREATE POLICY curriculum_tenant_isolation ON public.questions
FOR ALL TO authenticated
USING (
    public.jwt_is_super_admin()
    OR
    (
        app_id = public.current_app_id()
        AND (public.jwt_is_admin() OR deleted_at IS NULL)
    )
);

-- 5. GROUPS
DROP POLICY IF EXISTS group_tenant_isolation ON public.groups;
CREATE POLICY group_tenant_isolation ON public.groups
FOR ALL TO authenticated
USING (
    public.jwt_is_super_admin()
    OR
    (
        app_id = public.current_app_id()
        AND (owner_id = auth.uid() OR public.jwt_is_admin() OR (
            EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.student_id = auth.uid())
            AND deleted_at IS NULL
        ))
    )
);

-- 6. ACHIEVEMENTS
DROP POLICY IF EXISTS achievements_tenant_isolation ON public.achievements;
CREATE POLICY achievements_tenant_isolation ON public.achievements
FOR ALL TO authenticated
USING (
    public.jwt_is_super_admin()
    OR
    (
        app_id = public.current_app_id()
        AND (user_id = auth.uid() OR public.jwt_is_admin())
        AND (public.jwt_is_admin() OR deleted_at IS NULL)
    )
);

-- 7. PURCHASES
DROP POLICY IF EXISTS purchases_tenant_isolation ON public.purchases;
CREATE POLICY purchases_tenant_isolation ON public.purchases
FOR ALL TO authenticated
USING (
    public.jwt_is_super_admin()
    OR
    (
        app_id = public.current_app_id()
        AND (user_id = auth.uid() OR public.jwt_is_admin())
        AND (public.jwt_is_admin() OR deleted_at IS NULL)
    )
);

-- 8. SOURCE DOCUMENTS (Already Admin Only, but add consistency)
DROP POLICY IF EXISTS source_documents_admin_only ON public.source_documents;
CREATE POLICY source_documents_admin_only ON public.source_documents
FOR ALL TO authenticated
USING (
    public.jwt_is_super_admin()
    OR
    (
        public.jwt_is_admin() 
        AND app_id = public.current_app_id()
        -- Admins see all source docs (including deleted ones) for audit trails
    )
);

-- 9. AI GENERATION SESSIONS (Already Admin Only)
DROP POLICY IF EXISTS ai_generation_admin_only ON public.ai_generation_sessions;
CREATE POLICY ai_generation_admin_only ON public.ai_generation_sessions
FOR ALL TO authenticated
USING (
    public.jwt_is_super_admin()
    OR
    (
        public.jwt_is_admin() 
        AND app_id = public.current_app_id()
    )
);

-- COMMENT on omitted filters for clarity
COMMENT ON POLICY group_tenant_isolation ON public.groups IS 'Students only see active groups. Mentors/Admins see all for their tenant.';
COMMENT ON POLICY profiles_tenant_isolation ON public.profiles IS 'Students only see active profiles. Admins see deactivated users.';
