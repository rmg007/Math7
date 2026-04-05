-- Migration: Audit and sanitize existing PII in error_logs and known_issues
-- Description: Applies the sanitize_jsonb_pii and regex sweeping over existing records to clean them up.

-- 1. Sanitize error_logs
-- The trigger handles new rows, but for existing rows we must apply the sanitize_jsonb_pii function manually.
-- To avoid touching rows unnecessarily, we just update all rows where extra_context is not null or error_message contains an email.
-- Since the trigger `trg_sanitize_error_logs` is already present, simply touching
-- an existing column will fire the BEFORE UPDATE trigger and sanitize legacy rows.
-- will fire the BEFORE UPDATE trigger and automatically sanitize everything!
UPDATE public.error_logs 
SET error_message = error_message
WHERE extra_context IS NOT NULL 
   OR error_message ~* '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})';

-- 2. Sanitize known_issues
-- known_issues doesn't have the trigger, so we can either manually run the function or apply the same regex.
-- Let's apply the regex on the error_message and title.
UPDATE public.known_issues
SET title = regexp_replace(title, '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', '[EMAIL_REDACTED]', 'g'),
    error_message = regexp_replace(error_message, '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', '[EMAIL_REDACTED]', 'g')
WHERE title ~* '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
   OR error_message ~* '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})';
