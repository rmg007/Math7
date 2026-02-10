-- Harden RLS policies for tenant isolation
-- VUL-018: Admins should only have access to their own app's data.

-- 1. Subject Management (Only Super Admins should manage subjects globally)
DROP POLICY IF EXISTS "Admins full access to subjects" ON subjects;
CREATE POLICY "Super Admins full access to subjects" ON subjects
FOR ALL TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

CREATE POLICY "Admins can view subjects" ON subjects
FOR SELECT TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
);

-- 2. App Management
DROP POLICY IF EXISTS "Admins can view all apps" ON apps;
CREATE POLICY "Super Admins can view all apps" ON apps
FOR SELECT TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

CREATE POLICY "Admins can view their own app" ON apps
FOR SELECT TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND app_id = apps.app_id))
);

CREATE POLICY "Super Admins full access to apps" ON apps
FOR ALL TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

-- 3. Domains Management
DROP POLICY IF EXISTS "Admins can do everything domains" ON domains;
DROP POLICY IF EXISTS "Admins full access to domains" ON domains;

CREATE POLICY "Super Admins full access to domains" ON domains
FOR ALL TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

CREATE POLICY "Admins full access to their app domains" ON domains
FOR ALL TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND app_id = domains.app_id))
);

-- 4. Skills Management
DROP POLICY IF EXISTS "Admins can do everything skills" ON skills;
DROP POLICY IF EXISTS "Admins full access to skills" ON skills;

CREATE POLICY "Super Admins full access to skills" ON skills
FOR ALL TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

CREATE POLICY "Admins full access to their app skills" ON skills
FOR ALL TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND app_id = skills.app_id))
);

-- 5. Questions Management
DROP POLICY IF EXISTS "Admins can do everything questions" ON questions;
DROP POLICY IF EXISTS "Admins full access to questions" ON questions;

CREATE POLICY "Super Admins full access to questions" ON questions
FOR ALL TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
);

CREATE POLICY "Admins full access to their app questions" ON questions
FOR ALL TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND app_id = questions.app_id))
);

-- 6. Profiles Management
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Super Admins can view all profiles" ON profiles
FOR SELECT TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
);

CREATE POLICY "Admins can view their app profiles" ON profiles
FOR SELECT TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND (p.app_id = profiles.app_id OR profiles.id = auth.uid())))
);

-- 7. Invitation Codes (Super Admin only)
DROP POLICY IF EXISTS "Admins can manage invitation codes" ON invitation_codes;
CREATE POLICY "Super Admins can manage invitation codes" ON invitation_codes
FOR ALL TO authenticated
USING ( 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
);
