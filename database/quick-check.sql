-- Quick Check: Do missions exist?

-- Check 1: Does missions table exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'missions'
    ) 
    THEN '✅ YES - Missions table exists'
    ELSE '❌ NO - Missions table does NOT exist (run mission-workflow-schema.sql)'
  END as missions_table_status;

-- Check 2: How many missions exist for test student?
SELECT 
  COUNT(*) as mission_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ YES - Missions exist'
    ELSE '❌ NO - No missions (run demo-mission-data.sql)'
  END as missions_data_status
FROM missions
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';

-- Check 3: Show missions if they exist
SELECT 
  mission_code,
  mission_type,
  status,
  scheduled_date,
  CASE WHEN plan_of_action_id IS NOT NULL THEN '✅ Has POA' ELSE '❌ No POA' END as poa,
  CASE WHEN debrief_id IS NOT NULL THEN '✅ Has Debrief' ELSE '❌ No Debrief' END as debrief
FROM missions
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231'
ORDER BY scheduled_date DESC;

