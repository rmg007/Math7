-- Migration: 20260129000004_create_invitation_codes.sql
-- Description: Create invitation_codes table and related RPC functions for admin registration

-- Create invitation_codes table
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER NOT NULL DEFAULT 1,
  times_used INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for code lookup
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_is_active ON public.invitation_codes(is_active);

-- Enable RLS
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitation_codes
DROP POLICY IF EXISTS "Super admins full access to invitation_codes" ON public.invitation_codes;
CREATE POLICY "Super admins full access to invitation_codes" ON public.invitation_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_invitation_codes_updated_at ON public.invitation_codes;
CREATE TRIGGER update_invitation_codes_updated_at 
  BEFORE UPDATE ON public.invitation_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function: Generate invitation code
CREATE OR REPLACE FUNCTION public.generate_invitation_code(
  p_max_uses INTEGER DEFAULT 1,
  p_expires_days INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  expires_timestamp TIMESTAMPTZ;
BEGIN
  -- Verify caller is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only super admins can generate invitation codes';
  END IF;

  -- Generate a random 8-character alphanumeric code
  new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  
  -- Calculate expiration if provided
  IF p_expires_days IS NOT NULL THEN
    expires_timestamp := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;

  -- Insert the new code
  INSERT INTO public.invitation_codes (code, created_by, max_uses, expires_at)
  VALUES (new_code, auth.uid(), p_max_uses, expires_timestamp);

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Validate invitation code
CREATE OR REPLACE FUNCTION public.validate_invitation_code(p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  code_record RECORD;
BEGIN
  SELECT * INTO code_record
  FROM public.invitation_codes
  WHERE code = upper(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND times_used < max_uses;

  RETURN code_record IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Use invitation code (increment times_used)
CREATE OR REPLACE FUNCTION public.use_invitation_code(p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  code_record RECORD;
BEGIN
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

  UPDATE public.invitation_codes
  SET times_used = times_used + 1,
      updated_at = NOW()
  WHERE id = code_record.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Deactivate invitation code
CREATE OR REPLACE FUNCTION public.deactivate_invitation_code(p_code_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify caller is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only super admins can deactivate invitation codes';
  END IF;

  UPDATE public.invitation_codes
  SET is_active = false,
      updated_at = NOW()
  WHERE id = p_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_invitation_code(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invitation_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.use_invitation_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_invitation_code(UUID) TO authenticated;
