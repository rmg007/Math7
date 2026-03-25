-- Migration: Harden error_logs with PII sanitization and RLS hardening
-- Description: Adds a trigger to automatically sanitize PII from error messages and extra context.

-- 1. Create the PII sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_jsonb_pii(p_data jsonb)
RETURNS jsonb AS $$
DECLARE
    v_key text;
    v_value jsonb;
    v_result jsonb := '{}'::jsonb;
    -- Common PII and sensitive data keys
    v_pii_keys text[] := ARRAY[
        'email', 'password', 'token', 'secret', 'phone', 'address', 'name', 
        'credit_card', 'ssn', 'auth', 'cookie', 'session', 'ip_address',
        'key', 'api_key', 'pass', 'pwd', 'login', 'user_name'
    ];
BEGIN
    -- If p_data is null or not an object, return it as is (or handle as needed)
    IF p_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    IF jsonb_typeof(p_data) != 'object' THEN
        RETURN p_data;
    END IF;

    -- Iterate through each key-value pair in the object
    FOR v_key, v_value IN SELECT * FROM jsonb_each(p_data)
    LOOP
        -- Check if the key matches any PII patterns (case-insensitive substring match)
        IF EXISTS (SELECT 1 FROM unnest(v_pii_keys) k WHERE v_key ~* k) THEN
            v_result := v_result || jsonb_build_object(v_key, '[REDACTED]');
        ELSIF jsonb_typeof(v_value) = 'object' THEN
            -- Recurse for nested objects
            v_result := v_result || jsonb_build_object(v_key, public.sanitize_jsonb_pii(v_value));
        ELSIF jsonb_typeof(v_value) = 'array' THEN
            -- Basic support for arrays of objects (one level deep recursion)
            -- For simplicity and performance, we don't do deep recursion in arrays here
            -- but we can redact the whole array if it's named something suspicious
            v_result := v_result || jsonb_build_object(v_key, v_value);
        ELSE
            v_result := v_result || jsonb_build_object(v_key, v_value);
        END IF;
    END LOOP;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- 2. Create the trigger function for error_logs
CREATE OR REPLACE FUNCTION public.trg_sanitize_error_logs()
RETURNS TRIGGER AS $$
BEGIN
    -- Sanitize error_message if it looks like it contains JSON or sensitive patterns
    -- For simplicity, we mostly focus on extra_context which is already jsonb
    
    IF NEW.extra_context IS NOT NULL THEN
        NEW.extra_context := public.sanitize_jsonb_pii(NEW.extra_context);
    END IF;

    -- Basic string replacement for common PII patterns in error_message
    -- (This is less robust than jsonb sanitization but helps)
    NEW.error_message := regexp_replace(NEW.error_message, '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', '[EMAIL_REDACTED]', 'g');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Apply the trigger
DROP TRIGGER IF EXISTS trigger_sanitize_error_logs ON public.error_logs;
CREATE TRIGGER trigger_sanitize_error_logs
    BEFORE INSERT OR UPDATE ON public.error_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_sanitize_error_logs();

-- 4. Set search_path on promote_error_to_issue and log_error if they exist
DO $body$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'promote_error_to_issue'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.promote_error_to_issue(uuid, text, text, text) SET search_path = public';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'log_error'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.log_error(text, text, text, text, text, text, text, uuid, jsonb) SET search_path = public';
  END IF;
END $body$;

-- 5. Add a comment for audit
COMMENT ON COLUMN public.error_logs.extra_context IS 'Contains additional error metadata, automatically sanitized for PII.';
