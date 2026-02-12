-- Migration: 20260212083100_validate_and_use_invitation_code.sql
-- Description: Add atomic function to validate and consume invitation code in one operation
-- Purpose: Eliminate race condition in admin registration flow

-- Function: Validate AND consume invitation code atomically
CREATE OR REPLACE FUNCTION public.validate_and_use_invitation_code(p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Find and lock the invitation code row
  SELECT * INTO code_record
  FROM public.invitation_codes
  WHERE code = upper(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND times_used < max_uses
  FOR UPDATE;

  IF code_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Increment usage count atomically
  UPDATE public.invitation_codes
  SET times_used = times_used + 1,
      updated_at = NOW()
  WHERE id = code_record.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.validate_and_use_invitation_code(TEXT) TO authenticated;
