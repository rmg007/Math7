-- Add RLS policy to allow super_admins to view all groups
-- Super admins should have full access for administrative purposes

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Super admins read all groups" ON groups;

-- Create policy for super admins to read all groups
CREATE POLICY "Super admins read all groups" ON groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Also allow super_admin to manage all groups
DROP POLICY IF EXISTS "Super admins manage all groups" ON groups;
CREATE POLICY "Super admins manage all groups" ON groups
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );
