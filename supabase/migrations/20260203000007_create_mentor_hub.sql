-- 1. Add 'mentor' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'mentor';

-- 2. Create Enums for Groups and Assignments
DO $$ BEGIN
    CREATE TYPE group_type AS ENUM ('class', 'family');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_type AS ENUM ('skill_mastery', 'time_goal', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('pending', 'completed', 'late');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_scope AS ENUM ('mandatory', 'suggested');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    app_id UUID REFERENCES apps(app_id) ON DELETE CASCADE,
    type group_type NOT NULL,
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}'::JSONB,
    join_code VARCHAR(8) UNIQUE NOT NULL,
    code_expires_at TIMESTAMP WITH TIME ZONE,
    allow_anonymous_join BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nickname TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (group_id, user_id)
);

-- 5. Create Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Nullable for individual
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Nullable for class-wide
    target_id UUID NOT NULL, -- Generic ID (Skill, Domain, etc - client resolves)
    type assignment_type NOT NULL,
    scope assignment_scope DEFAULT 'mandatory',
    status assignment_status DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    completion_trigger JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (group_id IS NOT NULL OR student_id IS NOT NULL)
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(join_code);
CREATE INDEX IF NOT EXISTS idx_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_group ON assignments(group_id);

-- 7. Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- GROUPS: 
-- Mentors create/read/update their own groups
DROP POLICY IF EXISTS "Mentors manage their own groups" ON groups;
CREATE POLICY "Mentors manage their own groups" ON groups
    FOR ALL
    USING (auth.uid() = owner_id);

-- Students can read groups they are members of
DROP POLICY IF EXISTS "Students read their groups" ON groups;
CREATE POLICY "Students read their groups" ON groups
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_id = auth.uid()
        )
    );

-- GROUP MEMBERS:
-- Mentors manage members of their groups
DROP POLICY IF EXISTS "Mentors manage members" ON group_members;
CREATE POLICY "Mentors manage members" ON group_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM groups 
            WHERE groups.id = group_members.group_id 
            AND groups.owner_id = auth.uid()
        )
    );

-- Students can see themselves
DROP POLICY IF EXISTS "Students see self membership" ON group_members;
CREATE POLICY "Students see self membership" ON group_members
    FOR SELECT
    USING (user_id = auth.uid());

-- ASSIGNMENTS:
-- Mentors manage assignments for their groups
DROP POLICY IF EXISTS "Mentors manage assignments" ON assignments;
CREATE POLICY "Mentors manage assignments" ON assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM groups
            WHERE groups.id = assignments.group_id
            AND groups.owner_id = auth.uid()
        )
        OR 
        EXISTS ( -- Handle case where assignment is direct to student, check if student is in any of mentor's groups
             SELECT 1 FROM group_members gm
             JOIN groups g ON g.id = gm.group_id
             WHERE gm.user_id = assignments.student_id
             AND g.owner_id = auth.uid()
        )
    );

-- Students see assignments assigned to them OR their group
DROP POLICY IF EXISTS "Students read assignments" ON assignments;
CREATE POLICY "Students read assignments" ON assignments
    FOR SELECT
    USING (
        student_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = assignments.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- Update Trigger for Timestamps
DROP TRIGGER IF EXISTS update_groups_modtime ON groups;
CREATE TRIGGER update_groups_modtime BEFORE UPDATE ON groups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignments_modtime ON assignments;
CREATE TRIGGER update_assignments_modtime BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
