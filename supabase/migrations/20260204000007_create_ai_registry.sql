-- ============================================================================
-- Phase 13: AI Performance Registry
-- ============================================================================
-- Purpose: Provide deterministic, sub-second metadata retrieval for AI agents
-- to eliminate file-system "scavenging" latencies.
-- ============================================================================

-- ============================================================================
-- Table: kb_registry
-- ============================================================================
CREATE TABLE IF NOT EXISTS kb_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('app', 'library', 'service', 'docs', 'edge-function')),
    platform TEXT NOT NULL, -- e.g., 'cloudflare-pages', 'supabase', 'local-psh'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated', 'error')),
    live_url TEXT,
    tech_stack JSONB DEFAULT '{}'::jsonb, -- e.g., {"framework": "react", "version": "18"}
    last_deployed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B-tree indexes for fast lookups
CREATE INDEX kb_registry_platform_idx ON kb_registry (platform);
CREATE INDEX kb_registry_type_idx ON kb_registry (type);

-- ============================================================================
-- Table: kb_metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS kb_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name TEXT NOT NULL REFERENCES kb_registry(name) ON DELETE CASCADE,
    language TEXT NOT NULL, -- 'dart', 'typescript', 'sql', 'powershell'
    lines_of_code INTEGER DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    complexity_score INTEGER,
    last_analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RPC: get_ai_system_summary
-- ============================================================================
-- A "State of the Union" query for instant AI orientation.
-- ============================================================================
CREATE OR REPLACE FUNCTION get_ai_system_summary()
RETURNS TABLE (
    total_apps BIGINT,
    total_loc BIGINT,
    platform_distribution JSONB,
    active_projects TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM kb_registry WHERE type = 'app')::BIGINT,
        (SELECT SUM(lines_of_code) FROM kb_metrics)::BIGINT,
        (SELECT jsonb_object_agg(platform, count)
         FROM (SELECT platform, COUNT(*) as count FROM kb_registry GROUP BY platform) p),
        (SELECT array_agg(name) FROM kb_registry WHERE status = 'active');
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Security: RLS
-- ============================================================================
ALTER TABLE kb_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_metrics ENABLE ROW LEVEL SECURITY;

-- Reading is free for authenticated users (agents)
CREATE POLICY "Allow authenticated read on registry" ON kb_registry FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on metrics" ON kb_metrics FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- Triggers: updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_kb_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kb_registry_updated_at
BEFORE UPDATE ON kb_registry
FOR EACH ROW
EXECUTE FUNCTION update_kb_registry_updated_at();
