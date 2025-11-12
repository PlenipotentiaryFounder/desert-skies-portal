-- ============================================================================
-- CHECK AND CREATE MISSIONS SYSTEM
-- ============================================================================
-- This script checks if missions table exists and creates it if needed
-- Then verifies RLS policies and data
-- ============================================================================

-- Check if missions table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'missions'
  ) THEN
    RAISE NOTICE '❌ MISSIONS TABLE DOES NOT EXIST';
    RAISE NOTICE 'You need to run: database/mission-workflow-schema.sql first';
  ELSE
    RAISE NOTICE '✅ Missions table exists';
  END IF;
END $$;

-- Check RLS policies on missions
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ RLS policies exist on missions table'
    ELSE '❌ NO RLS policies on missions table'
  END as rls_status,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'missions';

-- List all policies
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_status
FROM pg_policies 
WHERE tablename = 'missions'
ORDER BY policyname;

-- Check if demo data exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::text || ' missions exist in database'
    ELSE '❌ NO missions in database - run demo-mission-data.sql'
  END as data_status,
  COUNT(*) as mission_count
FROM missions;

-- Show missions for test student
SELECT 
  mission_code,
  status,
  scheduled_date,
  mission_type,
  CASE 
    WHEN plan_of_action_id IS NOT NULL THEN '✅ Has POA'
    ELSE '❌ No POA'
  END as poa_status,
  CASE 
    WHEN debrief_id IS NOT NULL THEN '✅ Has Debrief'
    ELSE '❌ No Debrief'  
  END as debrief_status
FROM missions
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231'
ORDER BY scheduled_date DESC;

-- Check plans_of_action
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::text || ' Plans of Action exist'
    ELSE '❌ NO Plans of Action'
  END as poa_status
FROM plans_of_action
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';

-- Check debriefs
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::text || ' Debriefs exist'
    ELSE '❌ NO Debriefs'
  END as debrief_status
FROM debriefs
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';

-- Check training_events
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::text || ' Training Events exist'
    ELSE '❌ NO Training Events'
  END as events_status
FROM training_events
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';

-- Verify the student exists and has correct role
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  ARRAY_AGG(r.name) as roles
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE p.id = 'ecf47875-0204-4859-865f-1d310d022231'
GROUP BY p.id, p.email, p.first_name, p.last_name;

-- Check enrollments
SELECT 
  se.id as enrollment_id,
  se.status,
  s.title as syllabus,
  se.instructor_id,
  se.enrollment_date
FROM student_enrollments se
LEFT JOIN syllabi s ON s.id = se.syllabus_id
WHERE se.student_id = 'ecf47875-0204-4859-865f-1d310d022231';

