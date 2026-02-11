-- Oracle Plus: Spec Validations Table
-- Purpose: Store results of specification validation/drift detection
-- Tracks history of spec compliance checks for audit trail

CREATE TABLE IF NOT EXISTS spec_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  spec_id UUID REFERENCES specifications(id) ON DELETE SET NULL,
  
  -- Validation Context
  validation_type TEXT NOT NULL CHECK (validation_type IN ('drift_detection', 'schema_compliance', 'code_compliance', 'test_coverage', 'manual_review')),
  target_entity TEXT NOT NULL, -- File path, table name, function name, etc.
  scope TEXT, -- Optional: what was checked (e.g., 'all', 'schema only', 'code only')
  
  -- Results
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'error')),
  findings JSONB, -- Detailed drift/issues found
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  
  -- Metrics
  total_checks INTEGER DEFAULT 0,
  passed_checks INTEGER DEFAULT 0,
  failed_checks INTEGER DEFAULT 0,
  
  -- Context
  git_commit TEXT,
  git_branch TEXT,
  pr_number INTEGER,
  triggered_by TEXT CHECK (triggered_by IN ('manual', 'ci', 'pre-commit', 'scheduled', 'api')),
  triggered_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (passed_checks + failed_checks <= total_checks)
);

-- Indexes
CREATE INDEX idx_spec_validations_app_id ON spec_validations(app_id);
CREATE INDEX idx_spec_validations_spec_id ON spec_validations(spec_id) WHERE spec_id IS NOT NULL;
CREATE INDEX idx_spec_validations_status ON spec_validations(status);
CREATE INDEX idx_spec_validations_severity ON spec_validations(severity) WHERE severity IS NOT NULL;
CREATE INDEX idx_spec_validations_created_at ON spec_validations(created_at DESC);
CREATE INDEX idx_spec_validations_pr ON spec_validations(pr_number) WHERE pr_number IS NOT NULL;

-- RLS Policies
ALTER TABLE spec_validations ENABLE ROW LEVEL SECURITY;

-- Users can read validations for their apps
CREATE POLICY "Users can read their app validations"
  ON spec_validations
  FOR SELECT
  USING (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE a.id = spec_validations.app_id
    )
  );

-- Platform admins can manage all validations
CREATE POLICY "Platform admins can manage validations"
  ON spec_validations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'platform_admin'
    )
  );

-- App members and CI can insert validations
CREATE POLICY "App members can insert validations"
  ON spec_validations
  FOR INSERT
  WITH CHECK (
    app_id IN (
      SELECT a.id FROM apps a
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE a.id = spec_validations.app_id
      AND ur.role IN ('platform_admin', 'app_owner', 'app_editor', 'app_viewer')
    )
  );

-- View for recent critical failures (useful for monitoring)
CREATE OR REPLACE VIEW critical_spec_failures AS
SELECT 
  sv.id,
  sv.app_id,
  a.name as app_name,
  s.entity_type,
  s.entity_name,
  sv.validation_type,
  sv.target_entity,
  sv.status,
  sv.severity,
  sv.findings,
  sv.git_commit,
  sv.pr_number,
  sv.created_at
FROM spec_validations sv
JOIN apps a ON a.id = sv.app_id
LEFT JOIN specifications s ON s.id = sv.spec_id
WHERE sv.status = 'fail'
  AND sv.severity IN ('critical', 'high')
  AND sv.created_at > NOW() - INTERVAL '7 days'
ORDER BY sv.created_at DESC;

-- Grant access to view
GRANT SELECT ON critical_spec_failures TO authenticated;

-- Comment on table
COMMENT ON TABLE spec_validations IS 'Oracle Plus: Stores validation results for specification compliance checks';
COMMENT ON COLUMN spec_validations.findings IS 'JSON array of specific drift/issues found during validation';
COMMENT ON COLUMN spec_validations.triggered_by IS 'Source of the validation: manual, CI, pre-commit hook, scheduled job, or API call';
COMMENT ON VIEW critical_spec_failures IS 'Recent critical/high severity specification failures for monitoring';
