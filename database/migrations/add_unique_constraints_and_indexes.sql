-- Migration: Add Unique Constraints and Indexes
-- Purpose: Prevent duplicate data and improve query performance
-- Date: 2025-11-14

-- =====================================================
-- UNIQUE CONSTRAINTS
-- =====================================================

-- Prevent duplicate onboarding records (one per user)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_onboarding_user_id_unique'
    ) THEN
        ALTER TABLE student_onboarding
        ADD CONSTRAINT student_onboarding_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint: student_onboarding_user_id_unique';
    ELSE
        RAISE NOTICE 'Unique constraint student_onboarding_user_id_unique already exists';
    END IF;
END $$;

-- Prevent duplicate active enrollments
-- Note: This allows the same student to be enrolled in different programs or with different instructors,
-- but prevents exact duplicates in pending_approval or active status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_enrollments_unique_active'
    ) THEN
        -- Drop the constraint if it exists with wrong definition
        EXECUTE 'ALTER TABLE student_enrollments 
                 DROP CONSTRAINT IF EXISTS student_enrollments_unique_active';
        
        -- Create index instead of constraint to allow more flexibility
        -- This prevents same student + syllabus + instructor + status combination
        CREATE UNIQUE INDEX IF NOT EXISTS idx_student_enrollments_unique_active 
        ON student_enrollments(student_id, syllabus_id, instructor_id, status)
        WHERE status IN ('pending_approval', 'active');
        
        RAISE NOTICE 'Added unique index: idx_student_enrollments_unique_active';
    ELSE
        RAISE NOTICE 'Unique constraint/index for student_enrollments already exists';
    END IF;
END $$;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Index on student_onboarding.user_id (for fast lookups)
CREATE INDEX IF NOT EXISTS idx_student_onboarding_user_id 
ON student_onboarding(user_id);

-- Index on student_onboarding.completed_at (for filtering completed vs incomplete)
CREATE INDEX IF NOT EXISTS idx_student_onboarding_completed_at 
ON student_onboarding(completed_at) WHERE completed_at IS NOT NULL;

-- Index on student_enrollments.status (for filtering by status)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_status 
ON student_enrollments(status);

-- Index on student_enrollments.student_id (for student lookups)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id 
ON student_enrollments(student_id);

-- Index on student_enrollments.instructor_id (for instructor lookups)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_instructor_id 
ON student_enrollments(instructor_id);

-- Index on student_enrollments.syllabus_id (for syllabus lookups)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_syllabus_id 
ON student_enrollments(syllabus_id);

-- Composite index for pending approvals query (commonly used)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_pending 
ON student_enrollments(status, created_at DESC) 
WHERE status = 'pending_approval';

-- Index on profiles.email (for fast email lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Index on profiles.status (for filtering active/inactive users)
CREATE INDEX IF NOT EXISTS idx_profiles_status 
ON profiles(status);

-- Index on user_roles.user_id (for role lookups)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON user_roles(user_id);

-- Index on user_roles.role_id (for reverse lookups)
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id 
ON user_roles(role_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify constraints and indexes
DO $$
DECLARE
    constraint_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count unique constraints
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint
    WHERE conname IN ('student_onboarding_user_id_unique');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN ('student_onboarding', 'student_enrollments', 'profiles', 'user_roles');
    
    RAISE NOTICE 'Migration complete!';
    RAISE NOTICE 'Unique constraints added: %', constraint_count;
    RAISE NOTICE 'Performance indexes added: %', index_count;
END $$;

-- =====================================================
-- CLEANUP (Optional - only run if needed)
-- =====================================================

-- To remove duplicate enrollments before adding constraint (if any exist):
-- DELETE FROM student_enrollments a
-- USING student_enrollments b
-- WHERE a.id < b.id
-- AND a.student_id = b.student_id
-- AND a.syllabus_id = b.syllabus_id
-- AND a.instructor_id = b.instructor_id
-- AND a.status = b.status
-- AND a.status IN ('pending_approval', 'active');

-- To remove duplicate onboarding records (if any exist):
-- DELETE FROM student_onboarding a
-- USING student_onboarding b
-- WHERE a.id < b.id
-- AND a.user_id = b.user_id;

