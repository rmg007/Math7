-- ══════════════════════════════════════════════════════════════════════════════
-- RESTORE LANDING PAGES SCHEMA
-- Purpose: Add missing columns and ensure consistent table structure for app_landing_pages.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure table exists with core columns
CREATE TABLE IF NOT EXISTS public.app_landing_pages (
  landing_page_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL UNIQUE REFERENCES public.apps(app_id) ON DELETE CASCADE,
  hero_headline TEXT,
  hero_subheadline TEXT,
  meta_title TEXT,
  meta_description TEXT,
  cta_text TEXT,
  sections JSONB DEFAULT '[]'::JSONB,
  features JSONB DEFAULT '[]'::JSONB,
  status curriculum_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add missing columns to existing table if it was created with a bare schema
DO $$ 
BEGIN
    -- Add landing_page_id if missing (though it was likely the PK if present)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_landing_pages' AND column_name = 'landing_page_id') THEN
        ALTER TABLE public.app_landing_pages ADD COLUMN landing_page_id UUID DEFAULT gen_random_uuid();
        -- If we just added it, we might need to set it as PK if app_id was PK
        -- But let's assume if it's missing, we just need to add it and other columns.
    END IF;

    -- Add hero_subheadline if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_landing_pages' AND column_name = 'hero_subheadline') THEN
        ALTER TABLE public.app_landing_pages ADD COLUMN hero_subheadline TEXT;
    END IF;

    -- Add meta_title if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_landing_pages' AND column_name = 'meta_title') THEN
        ALTER TABLE public.app_landing_pages ADD COLUMN meta_title TEXT;
    END IF;

    -- Add meta_description if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_landing_pages' AND column_name = 'meta_description') THEN
        ALTER TABLE public.app_landing_pages ADD COLUMN meta_description TEXT;
    END IF;

    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_landing_pages' AND column_name = 'status') THEN
        ALTER TABLE public.app_landing_pages ADD COLUMN status curriculum_status DEFAULT 'draft';
    END IF;
END $$;

-- 3. Enable RLS and setup policies
ALTER TABLE public.app_landing_pages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_landing_pages' AND policyname = 'app_landing_pages_admin_all') THEN
        CREATE POLICY "app_landing_pages_admin_all" ON public.app_landing_pages
        FOR ALL TO authenticated USING (jwt_is_admin()) WITH CHECK (jwt_is_admin());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_landing_pages' AND policyname = 'app_landing_pages_read') THEN
        CREATE POLICY "app_landing_pages_read" ON public.app_landing_pages
        FOR SELECT TO anon, authenticated USING (status = 'published');
    END IF;
END $$;
