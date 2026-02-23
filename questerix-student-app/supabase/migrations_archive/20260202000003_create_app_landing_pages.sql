-- Migration: Create App Landing Pages Table
-- Description: Stores custom landing page content for each app
-- Part of Questerix Transformation Phase 0

-- Create app_landing_pages table
CREATE TABLE IF NOT EXISTS app_landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  
  -- Hero Section
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_cta_text TEXT DEFAULT 'Get Started',
  hero_background_url TEXT,
  
  -- Features Section
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature objects
  
  -- Testimonials
  testimonials JSONB DEFAULT '[]'::jsonb, -- Array of testimonial objects
  
  -- FAQ
  faqs JSONB DEFAULT '[]'::jsonb, -- Array of FAQ objects
  
  -- Pricing (if applicable)
  pricing_enabled BOOLEAN DEFAULT false,
  pricing_plans JSONB DEFAULT '[]'::jsonb,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  og_image_url TEXT,
  
  -- Custom Content Blocks
  content_blocks JSONB DEFAULT '[]'::jsonb, -- Array of custom content blocks
  
  -- Styling
  theme JSONB DEFAULT '{}'::jsonb, -- Custom theme overrides
  
  -- Status
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one landing page per app
  CONSTRAINT app_landing_pages_app_unique UNIQUE (app_id)
);

-- Add indexes for performance
CREATE INDEX idx_app_landing_pages_app ON app_landing_pages(app_id);
CREATE INDEX idx_app_landing_pages_published ON app_landing_pages(is_published);

-- Add RLS (Row Level Security) policies
ALTER TABLE app_landing_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published landing pages
CREATE POLICY "app_landing_pages_select_policy"
  ON app_landing_pages FOR SELECT
  USING (is_published = true);

-- Policy: Admins can view all landing pages (including drafts)
CREATE POLICY "app_landing_pages_select_admin_policy"
  ON app_landing_pages FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only authenticated admins can insert landing pages
CREATE POLICY "app_landing_pages_insert_policy"
  ON app_landing_pages FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only authenticated admins can update landing pages
CREATE POLICY "app_landing_pages_update_policy"
  ON app_landing_pages FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only authenticated admins can delete landing pages
CREATE POLICY "app_landing_pages_delete_policy"
  ON app_landing_pages FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_app_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set published_at when publishing
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_landing_pages_updated_at_trigger
  BEFORE UPDATE ON app_landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_app_landing_pages_updated_at();

-- Add comments for documentation
COMMENT ON TABLE app_landing_pages IS 'Custom landing page content for each app';
COMMENT ON COLUMN app_landing_pages.app_id IS 'Reference to the app this landing page belongs to';
COMMENT ON COLUMN app_landing_pages.features IS 'Array of features to display: [{title, description, icon}]';
COMMENT ON COLUMN app_landing_pages.testimonials IS 'Array of testimonials: [{name, role, content, avatar_url}]';
COMMENT ON COLUMN app_landing_pages.faqs IS 'Array of FAQs: [{question, answer}]';
COMMENT ON COLUMN app_landing_pages.pricing_plans IS 'Array of pricing tiers (if applicable)';
COMMENT ON COLUMN app_landing_pages.content_blocks IS 'Custom content blocks for flexible layouts';
COMMENT ON COLUMN app_landing_pages.theme IS 'Custom theme overrides (colors, fonts, etc.)';
COMMENT ON COLUMN app_landing_pages.is_published IS 'Whether landing page is live';
COMMENT ON COLUMN app_landing_pages.meta_title IS 'SEO title tag';
COMMENT ON COLUMN app_landing_pages.meta_description IS 'SEO meta description';

-- Create view for published landing pages with app details
CREATE OR REPLACE VIEW public_landing_pages AS
SELECT 
  alp.*,
  a.name AS app_name,
  a.display_name AS app_display_name,
  a.grade_level,
  s.name AS subject_name,
  s.display_name AS subject_display_name,
  s.theme_color AS subject_color
FROM app_landing_pages alp
JOIN apps a ON alp.app_id = a.id
JOIN subjects s ON a.subject_id = s.id
WHERE alp.is_published = true
  AND a.is_active = true
  AND s.is_active = true;

COMMENT ON VIEW public_landing_pages IS 'Published landing pages with joined app and subject details';
