-- Migration: 20260204000001_operation_ironclad.sql
-- Description: Security Hardening & Multi-Tenant Scoping (Operation Ironclad)

-- 1. Security: Student Recovery Keys
CREATE TABLE IF NOT EXISTS public.student_recovery_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

ALTER TABLE public.student_recovery_keys ENABLE ROW LEVEL SECURITY;

-- 2. Groups Update (requires_approval)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'requires_approval') THEN
        ALTER TABLE public.groups ADD COLUMN requires_approval BOOLEAN DEFAULT true NOT NULL;
    END IF;
END $$;

-- 3. Group Join Requests
CREATE TABLE IF NOT EXISTS public.group_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(group_id, student_id)
);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

-- 4. Multi-Tenant Hardening (attempts.app_id, profiles.app_id)

-- Attempts: Add app_id column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attempts' AND column_name = 'app_id') THEN
        ALTER TABLE public.attempts ADD COLUMN app_id UUID REFERENCES public.apps(app_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Profiles: Add app_id column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'app_id') THEN
        ALTER TABLE public.profiles ADD COLUMN app_id UUID REFERENCES public.apps(app_id); 
    END IF;
END $$;

-- 5. RLS Policies (Update Policies to enforce app scope)

-- Update 'Students can insert own attempts' to enforce app_id consistency
DROP POLICY IF EXISTS "Students can insert own attempts" ON public.attempts;

CREATE POLICY "Students can insert own attempts" ON public.attempts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (
       -- If profile has app_id, attempt must match it
       (SELECT app_id FROM public.profiles WHERE id = auth.uid()) IS NULL
       OR
       app_id = (SELECT app_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_attempts_app_id ON public.attempts(app_id);
CREATE INDEX IF NOT EXISTS idx_profiles_app_id ON public.profiles(app_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_group ON public.group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_student ON public.group_join_requests(student_id);
