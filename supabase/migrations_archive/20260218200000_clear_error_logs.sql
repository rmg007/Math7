-- Migration to clear the error_logs table
-- This is a one-time operation to clear old/stale logs after fixing issues.
-- It uses TRUNCATE for efficiency and to reset the table completely.

TRUNCATE TABLE public.error_logs CASCADE;
