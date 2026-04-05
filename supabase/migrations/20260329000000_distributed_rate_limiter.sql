-- Migration: 20260329000000_distributed_rate_limiter.sql
-- Description: Adds Postgres-backed distributed rate limiting tables and functions.

-- 1. Create rate limit buckets table
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,                    -- "user:<uuid>" or "ip:<addr>"
  route TEXT NOT NULL,                  -- "generateQuestions", "validateContent", etc.
  window_start TIMESTAMPTZ NOT NULL,    -- Start of the current window
  request_count INTEGER NOT NULL DEFAULT 1,
  circuit_failure_count INTEGER NOT NULL DEFAULT 0,
  circuit_open_until TIMESTAMPTZ,       -- NULL = circuit closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT rate_limit_buckets_unique UNIQUE (key, route, window_start)
);

-- 2. Indexes for fast lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_lookup 
  ON public.rate_limit_buckets (key, route, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_cleanup 
  ON public.rate_limit_buckets (window_start);

-- 3. Security: Service role only (bypasses RLS)
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.rate_limit_buckets
  FOR ALL USING (auth.role() = 'service_role');

-- 4. RPC function for atomic check
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_route TEXT,
  p_window_ms INTEGER,
  p_max_requests INTEGER,
  p_circuit_threshold INTEGER DEFAULT NULL,
  p_circuit_reset_ms INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_window_start TIMESTAMPTZ;
  v_bucket RECORD;
  v_allowed BOOLEAN;
  v_remaining INTEGER;
  v_reset_time BIGINT;
  v_circuit_open BOOLEAN := FALSE;
  v_circuit_reset_time BIGINT;
BEGIN
  -- Calculate window start (floor to window boundary)
  v_window_start := to_timestamp(
    floor(extract(epoch from v_now) / (p_window_ms / 1000.0)) * (p_window_ms / 1000.0)
  );
  
  -- Upsert bucket with atomic increment
  INSERT INTO public.rate_limit_buckets (key, route, window_start, request_count, updated_at)
  VALUES (p_key, p_route, v_window_start, 1, v_now)
  ON CONFLICT (key, route, window_start) DO UPDATE
  SET request_count = rate_limit_buckets.request_count + 1,
      updated_at = v_now
  RETURNING * INTO v_bucket;
  
  -- Check circuit breaker first
  IF v_bucket.circuit_open_until IS NOT NULL AND v_bucket.circuit_open_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', FALSE,
      'limit', p_max_requests,
      'remaining', 0,
      'resetTime', extract(epoch from v_bucket.circuit_open_until) * 1000,
      'circuitOpen', TRUE,
      'circuitResetTime', extract(epoch from v_bucket.circuit_open_until) * 1000
    );
  END IF;
  
  -- Clear expired circuit breaker
  IF v_bucket.circuit_open_until IS NOT NULL AND v_bucket.circuit_open_until <= v_now THEN
    UPDATE public.rate_limit_buckets
    SET circuit_open_until = NULL, circuit_failure_count = 0
    WHERE id = v_bucket.id;
  END IF;
  
  -- Check rate limit
  v_reset_time := extract(epoch from v_window_start) * 1000 + p_window_ms;
  
  IF v_bucket.request_count > p_max_requests THEN
    v_allowed := FALSE;
    v_remaining := 0;
    
    -- Handle circuit breaker
    IF p_circuit_threshold IS NOT NULL THEN
      UPDATE public.rate_limit_buckets
      SET circuit_failure_count = circuit_failure_count + 1
      WHERE id = v_bucket.id
      RETURNING circuit_failure_count INTO v_bucket.circuit_failure_count;
      
      IF v_bucket.circuit_failure_count >= p_circuit_threshold THEN
        v_circuit_open := TRUE;
        v_circuit_reset_time := extract(epoch from v_now) * 1000 + COALESCE(p_circuit_reset_ms, 60000);
        
        UPDATE public.rate_limit_buckets
        SET circuit_open_until = v_now + (COALESCE(p_circuit_reset_ms, 60000) || ' milliseconds')::interval
        WHERE id = v_bucket.id;
      END IF;
    END IF;
  ELSE
    v_allowed := TRUE;
    v_remaining := p_max_requests - v_bucket.request_count;
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'limit', p_max_requests,
    'remaining', GREATEST(v_remaining, 0),
    'resetTime', v_reset_time,
    'circuitOpen', v_circuit_open,
    'circuitResetTime', v_circuit_reset_time
  );
END;
$$;

-- 5. Cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_buckets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Delete buckets older than 1 hour (plenty of buffer for most windows)
  DELETE FROM public.rate_limit_buckets
  WHERE window_start < now() - interval '1 hour'
    AND circuit_open_until IS NULL; -- Don't delete active circuit breakers
END;
$$;
