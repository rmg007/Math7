-- Fix foreign key constraint in groups table
-- The reference should be to apps(id) not apps(app_id)
-- Also make app_id nullable since groups don't always need to be tied to an app

-- Drop the existing constraint
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_app_id_fkey;

-- Re-add the constraint with correct reference and make it nullable
ALTER TABLE groups 
  ADD CONSTRAINT groups_app_id_fkey 
  FOREIGN KEY (app_id) 
  REFERENCES apps(id) 
  ON DELETE SET NULL;
