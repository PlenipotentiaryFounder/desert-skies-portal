-- =====================================================================
-- Fix: Syllabus Lessons RLS Policies (v2 - Works with current schema)
-- Issue: syllabus_lessons table has no RLS policies, causing silent update failures
-- Note: This version works with tables that don't have is_active column
-- =====================================================================

-- First, check if RLS is enabled (if not, enable it)
ALTER TABLE syllabus_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- DROP EXISTING POLICIES (if any) to start fresh
-- =====================================================================

DROP POLICY IF EXISTS "Anyone can view active lessons" ON syllabus_lessons;
DROP POLICY IF EXISTS "Anyone can view lessons" ON syllabus_lessons;
DROP POLICY IF EXISTS "Admins can manage all lessons" ON syllabus_lessons;
DROP POLICY IF EXISTS "Instructors can manage all lessons" ON syllabus_lessons;
DROP POLICY IF EXISTS "Admins can manage syllabi" ON syllabi;
DROP POLICY IF EXISTS "Instructors can view syllabi" ON syllabi;
DROP POLICY IF EXISTS "Anyone can view active syllabi" ON syllabi;
DROP POLICY IF EXISTS "Admins can manage all syllabi" ON syllabi;
DROP POLICY IF EXISTS "Instructors can view all syllabi" ON syllabi;

-- =====================================================================
-- SYLLABUS_LESSONS TABLE POLICIES
-- =====================================================================

-- Policy 1: Everyone can view all lessons (simplified - no is_active column check)
CREATE POLICY "Anyone can view lessons" ON syllabus_lessons
  FOR SELECT
  USING (true);

-- Policy 2: Admins can do everything with lessons
CREATE POLICY "Admins can manage all lessons" ON syllabus_lessons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Policy 3: Instructors can manage all lessons
CREATE POLICY "Instructors can manage all lessons" ON syllabus_lessons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('instructor', 'admin')
    )
  );

-- =====================================================================
-- SYLLABI TABLE POLICIES
-- =====================================================================

-- Policy 1: Everyone can view syllabi (with is_active check since syllabi has this column)
CREATE POLICY "Anyone can view active syllabi" ON syllabi
  FOR SELECT
  USING (is_active = true OR is_active IS NULL);

-- Policy 2: Admins can manage all syllabi
CREATE POLICY "Admins can manage all syllabi" ON syllabi
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Policy 3: Instructors can view all syllabi
CREATE POLICY "Instructors can view all syllabi" ON syllabi
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('instructor', 'admin')
    )
  );

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- Verify policies are in place
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('syllabus_lessons', 'syllabi')
ORDER BY tablename, policyname;

-- Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('syllabus_lessons', 'syllabi');

-- Show result summary
SELECT 
  'RLS Policies Created Successfully!' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('syllabus_lessons', 'syllabi');

