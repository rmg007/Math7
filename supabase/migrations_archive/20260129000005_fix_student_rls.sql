-- Migration: 20260129000005_fix_student_rls.sql
-- Description: Add RLS policies for curriculum_snapshots table
-- Note: outbox and sync_meta remain admin-only as students use local (Drift) database for these

-- Curriculum Snapshots: Everyone can read, only admins can write
DROP POLICY IF EXISTS "Everyone can read curriculum_snapshots" ON public.curriculum_snapshots;
DROP POLICY IF EXISTS "Admins can manage curriculum_snapshots" ON public.curriculum_snapshots;

CREATE POLICY "Everyone can read curriculum_snapshots" ON public.curriculum_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage curriculum_snapshots" ON public.curriculum_snapshots
  FOR ALL USING (is_admin());
