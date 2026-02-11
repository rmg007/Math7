-- ══════════════════════════════════════════════════════════════════════════════
-- SCHEMA ALIGNMENT: MULTI-TENANT PLATFORM ENHANCEMENTS
-- Migration: 20260205125000_align_platform_schema.sql
-- Purpose: Add missing UI fields to apps and subjects tables to match the implementation.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Align subjects table
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT '#3B82F6';

-- 2. Align apps table
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.apps ADD COLUMN IF NOT EXISTS grade_level TEXT;

-- Migration: Backfill display_name from app_name if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'apps' AND column_name = 'app_name') THEN
        UPDATE public.apps SET display_name = app_name WHERE display_name IS NULL;
    END IF;
END $$;

-- 3. Update RLS for Landing Pages (ensuring public access works as intended)
-- (This aligns with 20260203000008_fix_public_landing_access.sql if already applied, else ensures it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'app_landing_pages' AND policyname = 'app_landing_pages_public_read'
    ) THEN
        CREATE POLICY "app_landing_pages_public_read" ON public.app_landing_pages
        FOR SELECT USING (true);
    END IF;
END $$;

-- 4. Enable RLS on any missed tables
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_landing_pages ENABLE ROW LEVEL SECURITY;
