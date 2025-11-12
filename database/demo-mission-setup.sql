-- ============================================================================
-- DEMO MISSION SETUP SCRIPT
-- ============================================================================
-- This script creates a complete demo mission to showcase the full workflow:
-- 1. Student and Instructor users (if they don't exist)
-- 2. Aircraft and Enrollment
-- 3. Mission with auto-generated code
-- 4. Plan of Action with comprehensive details
-- 5. Training Events (pre-brief, flight, post-brief)
-- 6. Completed Debrief with maneuver scores
-- 7. Student maneuver progress tracking
-- ============================================================================

-- ============================================================================
-- 1. ENSURE DEMO USERS EXIST
-- ============================================================================

-- Check if instructor exists, if not create profile
-- Note: Auth user must be created separately via Supabase Auth
DO $$
DECLARE
  v_instructor_id UUID;
  v_student_id UUID;
  v_enrollment_id UUID;
  v_aircraft_id UUID;
  v_mission_id UUID;
  v_poa_id UUID;
  v_debrief_id UUID;
  v_prebrief_event_id UUID;
  v_flight_event_id UUID;
  v_postbrief_event_id UUID;
  v_maneuver_steep_turns UUID;
  v_maneuver_slow_flight UUID;
  v_maneuver_stalls UUID;
BEGIN

  -- Get instructor ID (thomas@desertskiesaviationaz.com)
  SELECT id INTO v_instructor_id 
  FROM profiles 
  WHERE email = 'thomas@desertskiesaviationaz.com' 
  LIMIT 1;

  IF v_instructor_id IS NULL THEN
    RAISE NOTICE 'Instructor not found. Please ensure thomas@desertskiesaviationaz.com exists in profiles table.';
    RETURN;
  END IF;

  -- Get or create student user
  SELECT id INTO v_student_id 
  FROM profiles 
  WHERE email LIKE '%student%' OR email LIKE '%demo%'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE NOTICE 'No student user found. Please create a student user first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using Instructor ID: %', v_instructor_id;
  RAISE NOTICE 'Using Student ID: %', v_student_id;

  -- ============================================================================
  -- 2. ENSURE AIRCRAFT EXISTS
  -- ============================================================================

  SELECT id INTO v_aircraft_id 
  FROM aircraft 
  WHERE tail_number = 'N172SP'
  LIMIT 1;

  IF v_aircraft_id IS NULL THEN
    INSERT INTO aircraft (
      tail_number,
      make,
      model,
      year,
      category,
      aircraft_class,
      status,
      hourly_rate_cents,
      home_airport
    ) VALUES (
      'N172SP',
      'Cessna',
      '172S Skyhawk',
      2018,
      'airplane',
      'single_engine_land',
      'available',
      16500, -- $165/hr
      'KDVT'
    ) RETURNING id INTO v_aircraft_id;
    
    RAISE NOTICE 'Created aircraft: N172SP';
  END IF;

  -- ============================================================================
  -- 3. ENSURE ENROLLMENT EXISTS
  -- ============================================================================

  SELECT id INTO v_enrollment_id
  FROM student_enrollments
  WHERE student_id = v_student_id
    AND instructor_id = v_instructor_id
    AND status = 'active'
  LIMIT 1;

  IF v_enrollment_id IS NULL THEN
    -- Get a syllabus (Private Pilot)
    INSERT INTO student_enrollments (
      student_id,
      instructor_id,
      syllabus_id,
      status,
      start_date,
      target_completion_date
    ) 
    SELECT 
      v_student_id,
      v_instructor_id,
      id,
      'active',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '6 months'
    FROM syllabi
    WHERE title ILIKE '%private pilot%'
    LIMIT 1
    RETURNING id INTO v_enrollment_id;
    
    RAISE NOTICE 'Created enrollment ID: %', v_enrollment_id;
  END IF;

  -- ============================================================================
  -- 4. CREATE DEMO MISSION
  -- ============================================================================

  -- Create mission
  INSERT INTO missions (
    enrollment_id,
    assigned_instructor_id,
    student_id,
    mission_code,
    mission_number,
    program_code,
    mission_type,
    scheduled_date,
    scheduled_start_time,
    scheduled_aircraft_id,
    actual_aircraft_id,
    status,
    instructor_assessment,
    created_by
  ) VALUES (
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'DSA-PPC-F14', -- Demo mission code
    14,
    'PPC', -- Private Pilot Certificate
    'F', -- Flight
    CURRENT_DATE + INTERVAL '2 days', -- Scheduled 2 days from now
    '09:00:00',
    v_aircraft_id,
    v_aircraft_id,
    'scheduled',
    NULL, -- Not completed yet
    v_instructor_id
  ) RETURNING id INTO v_mission_id;

  RAISE NOTICE 'Created mission ID: %', v_mission_id;

  -- ============================================================================
  -- 5. CREATE PLAN OF ACTION
  -- ============================================================================

  INSERT INTO plans_of_action (
    mission_id,
    student_id,
    instructor_id,
    flight_number,
    aircraft_tail_number,
    departure_direction,
    destination_airport,
    duration_hours,
    mission_overview,
    training_objectives,
    student_focus_notes,
    prep_checklist_items,
    video_resources,
    faa_references,
    status,
    shared_with_student_at,
    ai_generated
  ) VALUES (
    v_mission_id,
    v_student_id,
    v_instructor_id,
    14,
    'N172SP',
    'North Practice Area',
    'KDVT',
    2.0,
    'This mission focuses on refining slow flight, stalls, and steep turns in preparation for your checkride. We will depart north from Deer Valley, work in the practice area, and return for pattern work. Weather permitting, we will also practice emergency procedures.',
    ARRAY[
      'Demonstrate proficiency in slow flight at various configurations',
      'Execute power-off and power-on stalls with proper recovery technique',
      'Perform steep turns maintaining altitude within ACS standards (±100 ft)',
      'Practice emergency procedures including simulated engine failure',
      'Improve situational awareness and airspace management'
    ],
    ARRAY[
      'Review your last debrief - focus on maintaining altitude during steep turns',
      'Your slow flight technique has improved significantly, continue that momentum',
      'Work on earlier recognition of stall warning indicators'
    ],
    ARRAY[
      'Review ACS standards for slow flight (PA.V.A)',
      'Study stall recovery procedures in POH Section 3',
      'Review steep turn technique and common errors',
      'Check NOTAMS for practice area',
      'Review emergency checklist procedures',
      'Calculate weight & balance for planned flight',
      'Prepare navigation log with checkpoints',
      'Review Class B airspace boundaries and procedures'
    ],
    ARRAY[
      '{"title": "Slow Flight Mastery - Sporty''s", "url": "https://www.sportys.com/learn-to-fly/slow-flight", "verified": true, "verified_at": "2024-01-15"}'::jsonb,
      '{"title": "Stall Recognition and Recovery", "url": "https://www.youtube.com/watch?v=example1", "verified": true, "verified_at": "2024-01-15"}'::jsonb,
      '{"title": "Perfect Steep Turns Every Time", "url": "https://www.youtube.com/watch?v=example2", "verified": true, "verified_at": "2024-01-15"}'::jsonb
    ],
    ARRAY[
      '{"title": "14 CFR §61.107(b)(1) - Private Pilot Maneuvers", "url": "https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-61/subpart-E/section-61.107", "verified": true}'::jsonb,
      '{"title": "ACS Private Pilot Airplane", "url": "https://www.faa.gov/training_testing/testing/acs/private_pilot_airplane_acs.pdf", "verified": true}'::jsonb
    ],
    'shared',
    NOW() - INTERVAL '1 day', -- Shared yesterday
    false -- Not AI generated (instructor created)
  ) RETURNING id INTO v_poa_id;

  RAISE NOTICE 'Created Plan of Action ID: %', v_poa_id;

  -- Link POA to mission
  UPDATE missions SET plan_of_action_id = v_poa_id WHERE id = v_mission_id;

  -- ============================================================================
  -- 6. CREATE TRAINING EVENTS
  -- ============================================================================

  -- Pre-Brief Event
  INSERT INTO training_events (
    mission_id,
    enrollment_id,
    instructor_id,
    student_id,
    event_type,
    event_sequence,
    billing_category,
    scheduled_duration_minutes,
    scheduled_start_time,
    status
  ) VALUES (
    v_mission_id,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'prebrief',
    1,
    'ground_instruction',
    30,
    (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '09:00:00',
    'scheduled'
  ) RETURNING id INTO v_prebrief_event_id;

  -- Flight Event
  INSERT INTO training_events (
    mission_id,
    enrollment_id,
    instructor_id,
    student_id,
    event_type,
    event_sequence,
    billing_category,
    scheduled_duration_minutes,
    aircraft_id,
    scheduled_start_time,
    status
  ) VALUES (
    v_mission_id,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'flight',
    2,
    'flight_instruction',
    120, -- 2 hours
    v_aircraft_id,
    (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '09:30:00',
    'scheduled'
  ) RETURNING id INTO v_flight_event_id;

  -- Post-Brief Event
  INSERT INTO training_events (
    mission_id,
    enrollment_id,
    instructor_id,
    student_id,
    event_type,
    event_sequence,
    billing_category,
    scheduled_duration_minutes,
    scheduled_start_time,
    status
  ) VALUES (
    v_mission_id,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'postbrief',
    3,
    'ground_instruction',
    30,
    (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '11:30:00',
    'scheduled'
  ) RETURNING id INTO v_postbrief_event_id;

  RAISE NOTICE 'Created training events';

  -- ============================================================================
  -- 7. CREATE SAMPLE COMPLETED MISSION (for debrief demo)
  -- ============================================================================

  -- Create a second mission that's already completed
  DECLARE
    v_completed_mission_id UUID;
    v_completed_poa_id UUID;
    v_completed_debrief_id UUID;
  BEGIN

    -- Create completed mission
    INSERT INTO missions (
      enrollment_id,
      assigned_instructor_id,
      student_id,
      mission_code,
      mission_number,
      program_code,
      mission_type,
      scheduled_date,
      scheduled_start_time,
      scheduled_aircraft_id,
      actual_aircraft_id,
      status,
      instructor_assessment,
      total_flight_hours,
      total_ground_hours,
      completed_at,
      created_by
    ) VALUES (
      v_enrollment_id,
      v_instructor_id,
      v_student_id,
      'DSA-PPC-F13',
      13,
      'PPC',
      'F',
      CURRENT_DATE - INTERVAL '3 days',
      '09:00:00',
      v_aircraft_id,
      v_aircraft_id,
      'completed',
      'satisfactory',
      1.8,
      1.0,
      CURRENT_DATE - INTERVAL '3 days' + INTERVAL '3 hours',
      v_instructor_id
    ) RETURNING id INTO v_completed_mission_id;

    -- Get some maneuver IDs
    SELECT id INTO v_maneuver_steep_turns FROM maneuvers WHERE name ILIKE '%steep turn%' LIMIT 1;
    SELECT id INTO v_maneuver_slow_flight FROM maneuvers WHERE name ILIKE '%slow flight%' LIMIT 1;
    SELECT id INTO v_maneuver_stalls FROM maneuvers WHERE name ILIKE '%stall%' LIMIT 1;

    -- Create debrief for completed mission
    INSERT INTO debriefs (
      mission_id,
      student_id,
      instructor_id,
      flight_number,
      maneuvers_covered,
      maneuver_details,
      far_references,
      general_overview,
      key_takeaways,
      next_lesson_plan,
      ai_formatted
    ) VALUES (
      v_completed_mission_id,
      v_student_id,
      v_instructor_id,
      13,
      ARRAY[v_maneuver_steep_turns, v_maneuver_slow_flight, v_maneuver_stalls]::UUID[],
      ARRAY[
        jsonb_build_object(
          'maneuver_id', v_maneuver_steep_turns,
          'maneuver_name', 'Steep Turns',
          'acs_task_code', 'PA.V.B',
          'score', 3,
          'performance_level', 'proficient',
          'notes', 'Excellent bank angle control and coordination. Minor altitude deviation of 80 feet during rollout. Overall very good performance meeting ACS standards.'
        ),
        jsonb_build_object(
          'maneuver_id', v_maneuver_slow_flight,
          'maneuver_name', 'Slow Flight',
          'acs_task_code', 'PA.V.A',
          'score', 4,
          'performance_level', 'exceptional',
          'notes', 'Outstanding slow flight demonstration. Maintained altitude within 50 feet, airspeed within 5 knots, and demonstrated excellent feel for the aircraft. Ready for checkride.'
        ),
        jsonb_build_object(
          'maneuver_id', v_maneuver_stalls,
          'maneuver_name', 'Power-Off Stalls',
          'acs_task_code', 'PA.V.C',
          'score', 2,
          'performance_level', 'progressing',
          'notes', 'Stall recognition is improving but recovery needs work. Lost 150 feet during recovery (ACS allows 100 ft). Need to be more aggressive with pitch down and power application. Practice this more.'
        )
      ],
      ARRAY[
        jsonb_build_object(
          'reference', '§61.107(b)(1)(iv)',
          'description', 'Slow flight and stalls',
          'context', 'Reviewed required maneuvers for private pilot practical test'
        ),
        jsonb_build_object(
          'reference', '§91.155',
          'description', 'Basic VFR weather minimums',
          'context', 'Discussed cloud clearance requirements in Class E airspace'
        )
      ],
      'Great flight today! You demonstrated significant improvement in slow flight control and your steep turns are consistently meeting ACS standards. Your stall recoveries need more work - focus on being more aggressive with the recovery inputs. We practiced in the north practice area with excellent weather conditions. You showed good airmanship and situational awareness throughout the flight.',
      ARRAY[
        jsonb_build_object(
          'category', 'strength',
          'observation', 'Exceptional slow flight control',
          'evidence', 'Maintained altitude within 50 feet and airspeed within 5 knots throughout the maneuver',
          'coaching', 'This is checkride-ready performance. Keep practicing to maintain this level.'
        ),
        jsonb_build_object(
          'category', 'strength',
          'observation', 'Good steep turn coordination',
          'evidence', 'Bank angle held at 45° ±5° with smooth coordination',
          'coaching', 'Focus on altitude control during rollout to eliminate that 80-foot deviation'
        ),
        jsonb_build_object(
          'category', 'improvement',
          'observation', 'Stall recovery altitude loss',
          'evidence', 'Lost 150 feet during power-off stall recovery (ACS standard is 100 feet)',
          'coaching', 'Be more aggressive with pitch down and full power application. Don''t be timid - the airplane needs decisive inputs for a proper recovery.'
        ),
        jsonb_build_object(
          'category', 'correction',
          'observation', 'Delayed stall recognition',
          'evidence', 'Allowed airspeed to decay 3-4 knots below target before initiating recovery',
          'coaching', 'Watch for the buffet and stall warning horn earlier. Anticipate the stall rather than reacting to it.'
        )
      ],
      'Next flight (F14) we will continue refining stalls with emphasis on earlier recognition and more aggressive recovery technique. We will also work on steep turns with better altitude control during rollout. If time permits, we will introduce emergency procedures including simulated engine failures.',
      false
    ) RETURNING id INTO v_completed_debrief_id;

    -- Link debrief to mission
    UPDATE missions SET debrief_id = v_completed_debrief_id WHERE id = v_completed_mission_id;

    -- Create maneuver scores
    IF v_maneuver_steep_turns IS NOT NULL THEN
      INSERT INTO maneuver_scores (
        student_id,
        maneuver_id,
        flight_session_id,
        mission_id,
        maneuver_name,
        numeric_score,
        performance_level,
        acs_standard_met,
        instructor_notes,
        student_attempt_number
      ) VALUES (
        v_student_id,
        v_maneuver_steep_turns,
        NULL,
        v_completed_mission_id,
        'Steep Turns',
        3,
        'proficient',
        true,
        'Excellent bank angle control. Minor altitude deviation.',
        8
      );
    END IF;

    IF v_maneuver_slow_flight IS NOT NULL THEN
      INSERT INTO maneuver_scores (
        student_id,
        maneuver_id,
        flight_session_id,
        mission_id,
        maneuver_name,
        numeric_score,
        performance_level,
        acs_standard_met,
        instructor_notes,
        student_attempt_number
      ) VALUES (
        v_student_id,
        v_maneuver_slow_flight,
        NULL,
        v_completed_mission_id,
        'Slow Flight',
        4,
        'exceptional',
        true,
        'Outstanding performance. Checkride ready.',
        12
      );
    END IF;

    IF v_maneuver_stalls IS NOT NULL THEN
      INSERT INTO maneuver_scores (
        student_id,
        maneuver_id,
        flight_session_id,
        mission_id,
        maneuver_name,
        numeric_score,
        performance_level,
        acs_standard_met,
        instructor_notes,
        student_attempt_number
      ) VALUES (
        v_student_id,
        v_maneuver_stalls,
        NULL,
        v_completed_mission_id,
        'Power-Off Stalls',
        2,
        'progressing',
        false,
        'Recovery needs work. Lost 150 feet.',
        6
      );
    END IF;

    -- Update student maneuver progress
    IF v_maneuver_steep_turns IS NOT NULL THEN
      INSERT INTO student_maneuver_progress (
        student_id,
        maneuver_id,
        total_attempts,
        first_attempt_date,
        last_attempt_date,
        latest_mission_id,
        latest_score,
        latest_performance_level,
        acs_standard_met,
        average_score,
        trend,
        scores_history,
        consistently_proficient,
        checkride_ready
      ) VALUES (
        v_student_id,
        v_maneuver_steep_turns,
        8,
        CURRENT_DATE - INTERVAL '60 days',
        CURRENT_DATE - INTERVAL '3 days',
        v_completed_mission_id,
        3,
        'proficient',
        true,
        2.75,
        'improving',
        ARRAY[2, 2, 2, 3, 3, 3, 3, 3],
        true,
        true
      )
      ON CONFLICT (student_id, maneuver_id) 
      DO UPDATE SET
        total_attempts = EXCLUDED.total_attempts,
        last_attempt_date = EXCLUDED.last_attempt_date,
        latest_mission_id = EXCLUDED.latest_mission_id,
        latest_score = EXCLUDED.latest_score,
        latest_performance_level = EXCLUDED.latest_performance_level,
        acs_standard_met = EXCLUDED.acs_standard_met,
        average_score = EXCLUDED.average_score,
        trend = EXCLUDED.trend,
        scores_history = EXCLUDED.scores_history,
        consistently_proficient = EXCLUDED.consistently_proficient,
        checkride_ready = EXCLUDED.checkride_ready;
    END IF;

    RAISE NOTICE 'Created completed mission F13 with debrief';

  END;

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DEMO MISSION SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Instructor: thomas@desertskiesaviationaz.com';
  RAISE NOTICE 'Student ID: %', v_student_id;
  RAISE NOTICE 'Aircraft: N172SP';
  RAISE NOTICE '';
  RAISE NOTICE 'UPCOMING MISSION (F14):';
  RAISE NOTICE '  - Mission Code: DSA-PPC-F14';
  RAISE NOTICE '  - Date: % at 09:00', CURRENT_DATE + INTERVAL '2 days';
  RAISE NOTICE '  - Status: Scheduled with Plan of Action';
  RAISE NOTICE '  - View at: /student/missions/%', v_mission_id;
  RAISE NOTICE '  - POA at: /student/missions/%/poa', v_mission_id;
  RAISE NOTICE '';
  RAISE NOTICE 'COMPLETED MISSION (F13):';
  RAISE NOTICE '  - Mission Code: DSA-PPC-F13';
  RAISE NOTICE '  - Date: % (completed)', CURRENT_DATE - INTERVAL '3 days';
  RAISE NOTICE '  - Status: Completed with Debrief';
  RAISE NOTICE '  - View at: /student/missions/%', v_completed_mission_id;
  RAISE NOTICE '  - Debrief at: /student/missions/%/debrief', v_completed_mission_id;
  RAISE NOTICE '========================================';

END $$;

