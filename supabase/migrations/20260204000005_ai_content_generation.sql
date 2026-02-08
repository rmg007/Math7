-- Migration: AI-Assisted Content Generation (Phase 11)
-- Description: Tables for storing source documents and generation sessions

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Source Documents Table
-- Stores uploaded files (PDF, DOCX, images) for AI processing
CREATE TABLE IF NOT EXISTS public.source_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    app_id UUID REFERENCES public.apps(app_id) ON DELETE CASCADE,
    
    -- File metadata
    filename TEXT NOT NULL,
    file_size INTEGER NOT NULL, -- bytes
    mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg')),
    storage_path TEXT NOT NULL, -- Supabase Storage path
    
    -- Processing status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- Extracted content (stored for caching/reprocessing)
    extracted_text TEXT,
    page_count INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_source_documents_uploaded_by ON public.source_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_source_documents_app_id ON public.source_documents(app_id);
CREATE INDEX IF NOT EXISTS idx_source_documents_status ON public.source_documents(status) WHERE deleted_at IS NULL;

-- RLS: Admins only
ALTER TABLE public.source_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage source documents" ON public.source_documents
  FOR ALL USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_source_documents_updated_at 
  BEFORE UPDATE ON public.source_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. AI Generation Sessions Table
-- Stores the AI generation requests and their outputs (staging area before import)
CREATE TABLE IF NOT EXISTS public.ai_generation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    source_document_id UUID REFERENCES public.source_documents(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
    
    -- Generation parameters
    model_used TEXT NOT NULL, -- e.g., 'gemini-1.5-flash', 'gpt-4o-mini'
    prompt_text TEXT NOT NULL, -- The actual prompt sent to AI
    difficulty_distribution JSONB, -- e.g., {"easy": 20, "medium": 50, "hard": 30}
    
    -- AI Response
    raw_response JSONB, -- Array of generated question objects
    token_count INTEGER, -- For cost tracking
    generation_time_ms INTEGER,
    
    -- Review status
    status TEXT DEFAULT 'reviewing' CHECK (status IN ('reviewing', 'approved', 'rejected', 'imported')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Statistics
    questions_generated INTEGER DEFAULT 0 NOT NULL,
    questions_imported INTEGER DEFAULT 0 NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_created_by ON public.ai_generation_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_status ON public.ai_generation_sessions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ai_sessions_skill_id ON public.ai_generation_sessions(skill_id);

-- RLS: Admins only
ALTER TABLE public.ai_generation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage generation sessions" ON public.ai_generation_sessions
  FOR ALL USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_ai_sessions_updated_at 
  BEFORE UPDATE ON public.ai_generation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Generation Audit Log (Optional - for cost tracking and debugging)
CREATE TABLE IF NOT EXISTS public.generation_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.ai_generation_sessions(id) ON DELETE CASCADE NOT NULL,
    
    event_type TEXT NOT NULL CHECK (event_type IN ('prompt_sent', 'response_received', 'error', 'review_started', 'review_completed', 'imported')),
    event_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_session_id ON public.generation_audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON public.generation_audit_log(event_type);

ALTER TABLE public.generation_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.generation_audit_log
  FOR SELECT USING (is_admin());

-- 4. RPC: Mark Session as Imported
-- Called after admin successfully imports questions via bulk import
CREATE OR REPLACE FUNCTION public.mark_session_imported(
    p_session_id UUID,
    p_imported_count INTEGER
)
RETURNS void AS $$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can update sessions';
    END IF;
    
    UPDATE public.ai_generation_sessions
    SET 
        status = 'imported',
        questions_imported = p_imported_count,
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_session_id;
    
    -- Log the event
    INSERT INTO public.generation_audit_log (session_id, event_type, event_data)
    VALUES (p_session_id, 'imported', jsonb_build_object('count', p_imported_count));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
