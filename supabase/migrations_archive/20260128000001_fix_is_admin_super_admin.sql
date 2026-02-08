-- Migration: 20260128000001_fix_is_admin_super_admin.sql
-- Description: Fix is_admin() function to also recognize super_admin role

-- Update is_admin function to include super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
