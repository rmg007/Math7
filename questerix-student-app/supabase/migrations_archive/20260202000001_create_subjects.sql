-- Migration: Create Subjects Table
-- Description: Establishes top-level subject categories (Math, Science, ELA, etc.)
-- Part of Questerix Transformation Phase 0

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  theme_color TEXT, -- Hex color code for subject branding
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_subjects_active ON subjects(is_active);
CREATE INDEX idx_subjects_order ON subjects(order_index);

-- Add RLS (Row Level Security) policies
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active subjects
CREATE POLICY "subjects_select_policy" 
  ON subjects FOR SELECT 
  USING (is_active = true);

-- Policy: Only authenticated admins can insert subjects
CREATE POLICY "subjects_insert_policy"
  ON subjects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only authenticated admins can update subjects
CREATE POLICY "subjects_update_policy"
  ON subjects FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only authenticated admins can delete subjects
CREATE POLICY "subjects_delete_policy"
  ON subjects FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subjects_updated_at_trigger
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_subjects_updated_at();

-- Add comments for documentation
COMMENT ON TABLE subjects IS 'Top-level subject categories for Questerix platform';
COMMENT ON COLUMN subjects.id IS 'Unique identifier for the subject';
COMMENT ON COLUMN subjects.name IS 'Internal slug name (e.g., "math", "science")';
COMMENT ON COLUMN subjects.display_name IS 'User-facing name (e.g., "Mathematics", "Science")';
COMMENT ON COLUMN subjects.theme_color IS 'Primary color for subject branding (hex code)';
COMMENT ON COLUMN subjects.order_index IS 'Display order on landing pages';
COMMENT ON COLUMN subjects.is_active IS 'Whether the subject is visible to users';
