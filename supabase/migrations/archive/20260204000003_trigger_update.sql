-- Migration: 20260204000003_trigger_update.sql
-- Description: Update handle_new_user trigger to capture app_id from metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name, app_id)
  VALUES (
    NEW.id,
    'student',
    COALESCE(NEW.email, 'anonymous-' || NEW.id::text || '@device.local'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
    (NEW.raw_user_meta_data->>'app_id')::UUID -- Extract app_id from signup metadata
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
