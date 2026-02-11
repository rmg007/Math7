-- Oracle Plus: Specifications Table
-- Purpose: Store specifications for entities (tables, functions, endpoints, features)
-- Each spec can be validated against actual code/schema for drift detection

CREATE TABLE IF NOT EXISTS specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(app_id) ON DELETE CASCADE,
  
  -- Specification Identity
  entity_type TEXT NOT NULL CHECK (entity_type IN ('table', 'function', 'endpoint', 'feature', 'workflow', 'component')),
  entity_name TEXT NOT NULL,
  scope TEXT, -- Optional: namespace/module path (e.g., 'student-app/lib/features/auth')
  
  -- Specification Content
  spec_content TEXT NOT NULL,
  requirements JSONB, -- Optional structured requirements
  
  -- Metadata
  version INTEGER DEFAULT 1 CHECK (version > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'planned', 'implemented')),
  author TEXT,
  source_file TEXT, -- Original doc file if imported from docs
  
  -- Vector Search (OpenAI text-embedding-3-small)
  embedding vector(1536),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(app_id, entity_type, entity_name, version)
);

-- Indexes
CREATE INDEX idx_specifications_app_id ON specifications(app_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_specifications_entity ON specifications(entity_type, entity_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_specifications_status ON specifications(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_specifications_embedding ON specifications USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger: Update updated_at on modifications
CREATE OR REPLACE FUNCTION update_specifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER specifications_updated_at
  BEFORE UPDATE ON specifications
  FOR EACH ROW
  EXECUTE FUNCTION update_specifications_updated_at();

-- RLS Policies
ALTER TABLE specifications ENABLE ROW LEVEL SECURITY;

-- Users can read specifications for their apps
CREATE POLICY "Users can read their app specifications"
  ON specifications
  FOR SELECT
  USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE a.id = specifications.app_id
    )
  );

-- Platform admins can manage all specifications
CREATE POLICY "Platform admins can manage specifications"
  ON specifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'platform_admin'
    )
  );

-- App owners and editors can insert/update their app's specifications
CREATE POLICY "App members can manage their app specifications"
  ON specifications
  FOR INSERT
  WITH CHECK (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE a.id = specifications.app_id
      AND ur.role IN ('platform_admin', 'app_owner', 'app_editor')
    )
  );

CREATE POLICY "App members can update their app specifications"
  ON specifications
  FOR UPDATE
  USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE a.id = specifications.app_id
      AND ur.role IN ('platform_admin', 'app_owner', 'app_editor')
    )
  );

-- Soft delete policy
CREATE POLICY "App members can soft delete specifications"
  ON specifications
  FOR UPDATE
  USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE a.id = specifications.app_id
      AND ur.role IN ('platform_admin', 'app_owner', 'app_editor')
    )
  );

-- Comment on table
COMMENT ON TABLE specifications IS 'Oracle Plus: Stores specifications for entities to enable drift detection and spec-driven development';
COMMENT ON COLUMN specifications.entity_type IS 'Type of entity: table, function, endpoint, feature, workflow, component';
COMMENT ON COLUMN specifications.embedding IS 'Vector embedding for semantic search (OpenAI text-embedding-3-small, 1536 dimensions)';
COMMENT ON COLUMN specifications.requirements IS 'Optional structured requirements in JSON format';
