-- Add is_test_account flag to profiles to exclude bot actions from analytics
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT false;

-- Create an index for faster analytics filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_test_account_analytics ON public.profiles(is_test_account) WHERE is_test_account = true;

-- Ensure RLS on profiles accommodates read of the new column correctly (no extra policy needed as tenant isolation handles it)
