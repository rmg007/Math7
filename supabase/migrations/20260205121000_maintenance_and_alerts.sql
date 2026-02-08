-- =============================================
-- MAINTENANCE & ALERTS (Project Oracle & Observability)
-- =============================================

-- 1. Error Log Pruning (Maintenance)
-- Keep only the last 30 days of error logs to prevent table bloat
CREATE OR REPLACE FUNCTION public.prune_old_error_logs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.error_logs
    WHERE created_at < now() - interval '30 days'
    AND status != 'promoted'; -- Keep promoted logs for knowledge reference
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 2. Critical Alerting Logic
-- Simple trigger to detect critical errors and flag them for Edge Function processing
-- (Wait: Supabase has 'Database Webhooks' in the dashboard, but we can set up the 
-- plumbing here by adding a specific flag or using a queue)

ALTER TABLE public.error_logs ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.trigger_critical_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only alert on 'critical' severity or specific high-impact error types
    -- Use COALESCE to handle NULL extra_context safely
    IF NEW.error_type ILIKE '%Critical%' OR (COALESCE(NEW.extra_context, '{}'::jsonb)->>'severity') = 'critical' THEN
        -- Mark for Edge Function processing
        NEW.extra_context = jsonb_set(COALESCE(NEW.extra_context, '{}'::jsonb), '{alert_needed}', '"true"');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_critical_error ON public.error_logs;
CREATE TRIGGER on_critical_error
    BEFORE INSERT ON public.error_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_critical_alert();

-- 3. Vector Index Optimization (Search Recall Fix)
-- Ensure HNSW extension is available before trying to use it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        DROP INDEX IF EXISTS knowledge_chunks_embedding_idx;
        
        -- Using HNSW for better recall and performance as the KB grows
        -- Note: If this fails, the vector extension might be outdated (pre-0.5.0)
        BEGIN
            CREATE INDEX knowledge_chunks_embedding_idx 
                ON knowledge_chunks 
                USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'HNSW failed, falling back to IVFFlat with more lists';
            CREATE INDEX knowledge_chunks_embedding_idx 
                ON knowledge_chunks 
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100);
        END;
    END IF;
END $$;

-- 4. Cleanup/Maintenance Schedule Documentation
-- To enable the cron job, run:
-- SELECT cron.schedule('prune-errors-daily', '0 0 * * *', 'SELECT public.prune_old_error_logs()');
