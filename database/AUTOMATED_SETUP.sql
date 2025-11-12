-- ============================================================================
-- AUTOMATED MISSION SYSTEM SETUP & VERIFICATION
-- ============================================================================
-- Copy this ENTIRE script and paste into Supabase SQL Editor, then click RUN
-- This will:
-- 1. Check if tables exist
-- 2. Create schema if needed
-- 3. Seed demo data
-- 4. Verify everything works
-- ============================================================================

DO $$
DECLARE
  v_missions_exists BOOLEAN;
  v_student_id UUID := 'ecf47875-0204-4859-865f-1d310d022231';
  v_instructor_id UUID;
  v_mission_count INTEGER;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MISSION SYSTEM SETUP - STARTING';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 1: CHECK IF TABLES EXIST
  -- ============================================================================
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'missions'
  ) INTO v_missions_exists;

  IF v_missions_exists THEN
    RAISE NOTICE '✅ Missions table already exists';
  ELSE
    RAISE NOTICE '❌ Missions table does NOT exist';
    RAISE NOTICE '⚠️  You need to run: database/mission-workflow-schema.sql first';
    RAISE NOTICE '⚠️  Cannot continue without missions table';
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SETUP INCOMPLETE - CREATE SCHEMA FIRST';
    RAISE NOTICE '============================================';
    RETURN;
  END IF;

  -- ============================================================================
  -- STEP 2: CHECK RLS POLICIES
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'Checking RLS policies...';
  
  SELECT COUNT(*) INTO v_mission_count
  FROM pg_policies 
  WHERE tablename = 'missions';
  
  IF v_mission_count >= 5 THEN
    RAISE NOTICE '✅ RLS policies exist: % policies found', v_mission_count;
  ELSE
    RAISE NOTICE '⚠️  Only % RLS policies found (expected 5+)', v_mission_count;
  END IF;

  -- ============================================================================
  -- STEP 3: VERIFY STUDENT EXISTS
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'Checking student profile...';
  
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_student_id) THEN
    RAISE NOTICE '✅ Student exists: %', v_student_id;
  ELSE
    RAISE NOTICE '❌ Student NOT found: %', v_student_id;
    RAISE NOTICE '⚠️  Cannot create demo data without student';
    RETURN;
  END IF;

  -- ============================================================================
  -- STEP 4: VERIFY INSTRUCTOR EXISTS
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'Checking instructor profile...';
  
  SELECT id INTO v_instructor_id
  FROM profiles
  WHERE email = 'thomas@desertskiesaviationaz.com'
  LIMIT 1;

  IF v_instructor_id IS NOT NULL THEN
    RAISE NOTICE '✅ Instructor exists: % (thomas@desertskiesaviationaz.com)', v_instructor_id;
  ELSE
    RAISE NOTICE '❌ Instructor NOT found with email: thomas@desertskiesaviationaz.com';
    RAISE NOTICE '⚠️  Checking for any instructor...';
    
    -- Try to find ANY instructor
    SELECT p.id INTO v_instructor_id
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'instructor'
    LIMIT 1;
    
    IF v_instructor_id IS NOT NULL THEN
      RAISE NOTICE '✅ Found an instructor: %', v_instructor_id;
    ELSE
      RAISE NOTICE '❌ No instructors found in database';
      RAISE NOTICE '⚠️  Cannot create demo data without instructor';
      RETURN;
    END IF;
  END IF;

  -- ============================================================================
  -- STEP 5: CHECK FOR EXISTING DEMO DATA
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE 'Checking for existing demo data...';
  
  SELECT COUNT(*) INTO v_mission_count
  FROM missions
  WHERE student_id = v_student_id;
  
  IF v_mission_count > 0 THEN
    RAISE NOTICE '✅ Found % existing missions for student', v_mission_count;
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DEMO DATA ALREADY EXISTS';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Existing missions:';
    
    -- Show existing missions
    FOR v_mission_count IN 
      SELECT 
        mission_code,
        mission_type,
        status,
        scheduled_date,
        CASE WHEN plan_of_action_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_poa,
        CASE WHEN debrief_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_debrief
      FROM missions
      WHERE student_id = v_student_id
      ORDER BY scheduled_date DESC
    LOOP
      RAISE NOTICE '  - % (Type: %, Status: %, Date: %, POA: %, Debrief: %)', 
        v_mission_count.mission_code,
        CASE v_mission_count.mission_type 
          WHEN 'F' THEN 'Flight'
          WHEN 'G' THEN 'Ground'
          WHEN 'S' THEN 'Sim'
          ELSE v_mission_count.mission_type
        END,
        v_mission_count.status,
        v_mission_count.scheduled_date,
        v_mission_count.has_poa,
        v_mission_count.has_debrief;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'To view missions, go to: /student/schedule';
    RAISE NOTICE 'Student ID: %', v_student_id;
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SETUP COMPLETE - MISSIONS EXIST';
    RAISE NOTICE '============================================';
    
  ELSE
    RAISE NOTICE '❌ No missions found for student';
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'READY TO CREATE DEMO DATA';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run database/demo-mission-data.sql';
    RAISE NOTICE 'Or manually create missions in the UI';
  END IF;

END $$;

-- ============================================================================
-- VERIFICATION QUERY - Run this separately to double-check
-- ============================================================================

SELECT 
  '✅ Check Complete' as status,
  'Run the above script to see detailed results' as message;

-- To see missions for the test student:
-- SELECT * FROM missions WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';

