-- Migration: Create Apps Table
-- Description: Defines individual apps within each subject (e.g., Math7, Science8, ELA6)
-- Part of Questerix Transformation Phase 0

-- Create apps table
CREATE TABLE IF NOT EXISTS apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "math7", "science8"
  display_name TEXT NOT NULL, -- e.g., "Math 7th Grade", "Science 8th Grade"
  description TEXT,
  grade_level TEXT, -- e.g., "7", "8", "6-8"
  icon_url TEXT,
  app_url TEXT, -- URL to the student app (e.g., "app.questerix.com/math7")
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features JSONB DEFAULT '{}'::jsonb, -- App-specific features/config
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique app name per subject
  CONSTRAINT apps_subject_name_unique UNIQUE (subject_id, name)
);

-- Add indexes for performance
CREATE INDEX idx_apps_subject ON apps(subject_id);
CREATE INDEX idx_apps_active ON apps(is_active);
CREATE INDEX idx_apps_subject_active ON apps(subject_id, is_active);
CREATE INDEX idx_apps_order ON apps(order_index);
CREATE INDEX idx_apps_grade ON apps(grade_level);

-- Add RLS (Row Level Security) policies
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active apps
CREATE POLICY "apps_select_policy"
  ON apps FOR SELECT
  USING (is_active = true);

-- Policy: Only authenticated admins can insert apps
CREATE POLICY "apps_insert_policy"
  ON apps FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only authenticated admins can update apps
CREATE POLICY "apps_update_policy"
  ON apps FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only authenticated admins can delete apps
CREATE POLICY "apps_delete_policy"
  ON apps FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apps_updated_at_trigger
  BEFORE UPDATE ON apps
  FOR EACH ROW
  EXECUTE FUNCTION update_apps_updated_at();

-- Add comments for documentation
COMMENT ON TABLE apps IS 'Individual educational apps within each subject';
COMMENT ON COLUMN apps.id IS 'Unique identifier for the app';
COMMENT ON COLUMN apps.subject_id IS 'Parent subject this app belongs to';
COMMENT ON COLUMN apps.name IS 'Internal slug name (e.g., "math7")';
COMMENT ON COLUMN apps.display_name IS 'User-facing name (e.g., "Math 7th Grade")';
COMMENT ON COLUMN apps.grade_level IS 'Target grade level(s)';
COMMENT ON COLUMN apps.app_url IS 'URL to access the student app';
COMMENT ON COLUMN apps.features IS 'JSON object containing app-specific features';
COMMENT ON COLUMN apps.metadata IS 'Additional app metadata (tags, categories, etc.)';
