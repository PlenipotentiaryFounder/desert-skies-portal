-- ============================================================================
-- DEMO MISSION DATA FOR END-TO-END TESTING
-- ============================================================================
-- This script creates a complete demo mission workflow to demonstrate:
-- 1. Student viewing missions
-- 2. Student reviewing Plan of Action
-- 3. Student viewing debrief after completion
-- 4. Instructor managing missions
-- ============================================================================

-- Note: This script assumes:
-- - Student user exists: ecf47875-0204-4859-865f-1d310d022231
-- - Instructor user exists with email: thomas@desertskiesaviationaz.com
-- - Sporty's Part 61 syllabus has been loaded
-- - Aircraft exist in the database
-- - Maneuvers exist in the database

-- ============================================================================
-- 1. GET REQUIRED IDS
-- ============================================================================

-- Get instructor ID
DO $$
DECLARE
  v_instructor_id UUID;
  v_student_id UUID := 'ecf47875-0204-4859-865f-1d310d022231';
  v_enrollment_id UUID;
  v_syllabus_id UUID;
  v_lesson_id UUID;
  v_aircraft_id UUID;
  v_mission_id_1 UUID;
  v_mission_id_2 UUID;
  v_poa_id UUID;
  v_debrief_id UUID;
  v_event_id UUID;
  v_maneuver_id_1 UUID;
  v_maneuver_id_2 UUID;
  v_maneuver_id_3 UUID;
BEGIN
  -- Get instructor ID from email
  SELECT id INTO v_instructor_id
  FROM profiles
  WHERE email = 'thomas@desertskiesaviationaz.com'
  LIMIT 1;

  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Instructor not found with email thomas@desertskiesaviationaz.com';
  END IF;

  RAISE NOTICE 'Instructor ID: %', v_instructor_id;
  RAISE NOTICE 'Student ID: %', v_student_id;

  -- Get Sporty's Part 61 syllabus
  SELECT id INTO v_syllabus_id
  FROM syllabi
  WHERE title ILIKE '%Sporty%Part 61%'
  OR title ILIKE '%Private Pilot%'
  LIMIT 1;

  IF v_syllabus_id IS NULL THEN
    RAISE EXCEPTION 'Sporty''s Part 61 syllabus not found';
  END IF;

  RAISE NOTICE 'Syllabus ID: %', v_syllabus_id;

  -- Get first lesson from syllabus
  SELECT id INTO v_lesson_id
  FROM syllabus_lessons
  WHERE syllabus_id = v_syllabus_id
  AND lesson_type = 'Flight'
  ORDER BY order_index
  LIMIT 1;

  IF v_lesson_id IS NULL THEN
    RAISE NOTICE 'No flight lesson found, using any lesson';
    SELECT id INTO v_lesson_id
    FROM syllabus_lessons
    WHERE syllabus_id = v_syllabus_id
    ORDER BY order_index
    LIMIT 1;
  END IF;

  RAISE NOTICE 'Lesson ID: %', v_lesson_id;

  -- Get an aircraft
  SELECT id INTO v_aircraft_id
  FROM aircraft
  WHERE status = 'available'
  LIMIT 1;

  IF v_aircraft_id IS NULL THEN
    RAISE NOTICE 'No available aircraft found, using any aircraft';
    SELECT id INTO v_aircraft_id
    FROM aircraft
    LIMIT 1;
  END IF;

  RAISE NOTICE 'Aircraft ID: %', v_aircraft_id;

  -- Get some maneuvers
  SELECT id INTO v_maneuver_id_1
  FROM maneuvers
  WHERE name ILIKE '%steep turn%'
  LIMIT 1;

  SELECT id INTO v_maneuver_id_2
  FROM maneuvers
  WHERE name ILIKE '%slow flight%'
  LIMIT 1;

  SELECT id INTO v_maneuver_id_3
  FROM maneuvers
  WHERE name ILIKE '%stall%'
  LIMIT 1;

  -- If maneuvers not found, get any 3
  IF v_maneuver_id_1 IS NULL THEN
    SELECT id INTO v_maneuver_id_1 FROM maneuvers LIMIT 1 OFFSET 0;
  END IF;
  IF v_maneuver_id_2 IS NULL THEN
    SELECT id INTO v_maneuver_id_2 FROM maneuvers LIMIT 1 OFFSET 1;
  END IF;
  IF v_maneuver_id_3 IS NULL THEN
    SELECT id INTO v_maneuver_id_3 FROM maneuvers LIMIT 1 OFFSET 2;
  END IF;

  -- ============================================================================
  -- 2. CREATE OR GET ENROLLMENT
  -- ============================================================================

  -- Check if enrollment exists
  SELECT id INTO v_enrollment_id
  FROM student_enrollments
  WHERE student_id = v_student_id
  AND syllabus_id = v_syllabus_id
  AND status = 'active'
  LIMIT 1;

  -- Create enrollment if it doesn't exist
  IF v_enrollment_id IS NULL THEN
    INSERT INTO student_enrollments (
      student_id,
      syllabus_id,
      instructor_id,
      enrollment_date,
      status,
      progress_percentage
    ) VALUES (
      v_student_id,
      v_syllabus_id,
      v_instructor_id,
      CURRENT_DATE - INTERVAL '30 days',
      'active',
      15.5
    )
    RETURNING id INTO v_enrollment_id;

    RAISE NOTICE 'Created enrollment: %', v_enrollment_id;
  ELSE
    RAISE NOTICE 'Using existing enrollment: %', v_enrollment_id;
  END IF;

  -- ============================================================================
  -- 3. CREATE MISSION 1 - UPCOMING WITH PLAN OF ACTION
  -- ============================================================================

  -- Generate mission code
  v_mission_id_1 := gen_random_uuid();

  INSERT INTO missions (
    id,
    enrollment_id,
    assigned_instructor_id,
    student_id,
    mission_code,
    mission_number,
    program_code,
    mission_type,
    lesson_template_id,
    lesson_code,
    scheduled_date,
    scheduled_start_time,
    scheduled_aircraft_id,
    status,
    created_by
  ) VALUES (
    v_mission_id_1,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'DSA-PPC-F1',
    1,
    'PPC',
    'F',
    v_lesson_id,
    'PPC-L1',
    CURRENT_DATE + INTERVAL '2 days',
    '09:00:00',
    v_aircraft_id,
    'scheduled',
    v_instructor_id
  );

  RAISE NOTICE 'Created Mission 1 (Upcoming): %', v_mission_id_1;

  -- ============================================================================
  -- 4. CREATE PLAN OF ACTION FOR MISSION 1
  -- ============================================================================

  v_poa_id := gen_random_uuid();

  INSERT INTO plans_of_action (
    id,
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
    video_resources,
    faa_references,
    prep_checklist_items,
    status,
    shared_with_student_at,
    ai_generated,
    ai_model_used,
    ai_generation_time_ms
  ) VALUES (
    v_poa_id,
    v_mission_id_1,
    v_student_id,
    v_instructor_id,
    1,
    (SELECT tail_number FROM aircraft WHERE id = v_aircraft_id),
    'North',
    'KCHD',
    2.0,
    'This flight will focus on fundamental flight maneuvers and aircraft control. You will practice maintaining aircraft control during slow flight, steep turns, and approach to stall scenarios. Emphasis will be placed on proper coordination, altitude control, and recognition of aircraft performance limits.',
    ARRAY[
      'Demonstrate proper pre-flight planning and weather briefing procedures',
      'Execute steep turns to ACS standards (±100 feet, ±10 knots, ±10 degrees heading)',
      'Perform slow flight maneuvers while maintaining coordinated flight',
      'Recognize and recover from approach to stall configurations',
      'Practice proper radio communication procedures in the practice area'
    ],
    ARRAY[
      'Continue working on altitude control during maneuvers - you''ve shown improvement but let''s aim for ±50 feet',
      'Focus on coordinated flight during turns - remember to lead with rudder',
      'Review stall recognition symptoms before the flight'
    ],
    ARRAY[
      '{"title": "Steep Turns Explained", "url": "https://www.youtube.com/watch?v=example1", "duration_minutes": 12, "verified": true, "description": "Comprehensive guide to performing steep turns to ACS standards"}'::jsonb,
      '{"title": "Slow Flight Mastery", "url": "https://www.youtube.com/watch?v=example2", "duration_minutes": 15, "verified": true, "description": "Techniques for maintaining control at minimum controllable airspeed"}'::jsonb,
      '{"title": "Stall Recognition and Recovery", "url": "https://www.youtube.com/watch?v=example3", "duration_minutes": 10, "verified": true, "description": "Understanding aerodynamic stalls and proper recovery procedures"}'::jsonb
    ],
    ARRAY[
      '{"title": "14 CFR §61.107(b)(1)(iv) - Flight Training Requirements", "reference": "§61.107(b)(1)(iv)", "url": "https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-61/subpart-E/section-61.107", "description": "Flight training requirements for private pilot certification", "verified": true}'::jsonb,
      '{"title": "14 CFR §91.155 - VFR Weather Minimums", "reference": "§91.155", "url": "https://www.ecfr.gov/current/title-14/chapter-I/subchapter-F/part-91/subpart-B/subject-group-ECFRe4c59b5f5506932/section-91.155", "description": "Basic VFR weather minimums for different airspace classes", "verified": true}'::jsonb,
      '{"title": "Private Pilot ACS - Area V: Performance and Ground Reference Maneuvers", "reference": "ACS PA.V", "url": "https://www.faa.gov/training_testing/testing/acs/", "description": "Airman Certification Standards for performance maneuvers", "verified": true}'::jsonb
    ],
    ARRAY[
      'Complete weather briefing (1800wxbrief.com or ForeFlight) and review NOTAMs',
      'Review steep turn procedures and ACS standards in PHAK Chapter 5',
      'Study slow flight configuration and power settings for our aircraft',
      'Review stall warning signs and recovery procedures',
      'Prepare navigation log for practice area (headings, frequencies, landmarks)',
      'Review emergency procedures (engine failure, electrical failure)',
      'Bring current chart, kneeboard, and checklist',
      'Ensure adequate rest (8+ hours) and proper hydration'
    ],
    'shared',
    NOW() - INTERVAL '1 day',
    true,
    'gpt-4-turbo',
    2450
  );

  RAISE NOTICE 'Created Plan of Action: %', v_poa_id;

  -- Link POA to mission
  UPDATE missions
  SET plan_of_action_id = v_poa_id
  WHERE id = v_mission_id_1;

  -- ============================================================================
  -- 5. CREATE TRAINING EVENTS FOR MISSION 1
  -- ============================================================================

  -- Pre-brief event
  INSERT INTO training_events (
    mission_id,
    enrollment_id,
    instructor_id,
    student_id,
    event_type,
    event_sequence,
    billing_category,
    scheduled_duration_minutes,
    student_billing_rate_dollars,
    instructor_payout_rate_cents,
    scheduled_start_time,
    status
  ) VALUES (
    v_mission_id_1,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'prebrief',
    1,
    'ground_instruction',
    30,
    75.00,
    4500,
    (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '09:00:00',
    'scheduled'
  );

  -- Flight event
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
    student_billing_rate_dollars,
    instructor_payout_rate_cents,
    scheduled_start_time,
    status
  ) VALUES (
    v_mission_id_1,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'flight',
    2,
    'flight_instruction',
    120,
    v_aircraft_id,
    85.00,
    5100,
    (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '09:30:00',
    'scheduled'
  );

  -- Post-brief event
  INSERT INTO training_events (
    mission_id,
    enrollment_id,
    instructor_id,
    student_id,
    event_type,
    event_sequence,
    billing_category,
    scheduled_duration_minutes,
    student_billing_rate_dollars,
    instructor_payout_rate_cents,
    scheduled_start_time,
    status
  ) VALUES (
    v_mission_id_1,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'postbrief',
    3,
    'ground_instruction',
    30,
    75.00,
    4500,
    (CURRENT_DATE + INTERVAL '2 days')::timestamp + TIME '11:30:00',
    'scheduled'
  );

  RAISE NOTICE 'Created 3 training events for Mission 1';

  -- ============================================================================
  -- 6. CREATE MISSION 2 - COMPLETED WITH DEBRIEF
  -- ============================================================================

  v_mission_id_2 := gen_random_uuid();

  INSERT INTO missions (
    id,
    enrollment_id,
    assigned_instructor_id,
    student_id,
    mission_code,
    mission_number,
    program_code,
    mission_type,
    lesson_template_id,
    lesson_code,
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
    v_mission_id_2,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'DSA-PPC-F0',
    0,
    'PPC',
    'F',
    v_lesson_id,
    'PPC-L0',
    CURRENT_DATE - INTERVAL '7 days',
    '09:00:00',
    v_aircraft_id,
    v_aircraft_id,
    'completed',
    'satisfactory',
    1.8,
    1.0,
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '12:00:00',
    v_instructor_id
  );

  RAISE NOTICE 'Created Mission 2 (Completed): %', v_mission_id_2;

  -- ============================================================================
  -- 7. CREATE DEBRIEF FOR MISSION 2
  -- ============================================================================

  v_debrief_id := gen_random_uuid();

  INSERT INTO debriefs (
    id,
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
    ai_formatted,
    ai_model_used,
    ai_confidence_score,
    ai_processing_time_ms
  ) VALUES (
    v_debrief_id,
    v_mission_id_2,
    v_student_id,
    v_instructor_id,
    0,
    ARRAY[v_maneuver_id_1::text, v_maneuver_id_2::text, v_maneuver_id_3::text],
    ARRAY[
      jsonb_build_object(
        'maneuver_id', v_maneuver_id_1,
        'maneuver_name', 'Steep Turns',
        'acs_task_code', 'PA.V.B',
        'score', 3,
        'performance_level', 'proficient',
        'notes', 'Excellent coordination and altitude control. Maintained within ACS standards throughout both left and right turns. Bank angle was precise at 45 degrees.',
        'far_references', ARRAY['§61.107(b)(1)(iv)'],
        'strengths', ARRAY['Smooth bank entry', 'Good altitude control', 'Proper coordination'],
        'areas_for_improvement', ARRAY['Airspeed varied by 12 knots - aim for ±10'],
        'acs_standard_met', true
      ),
      jsonb_build_object(
        'maneuver_id', v_maneuver_id_2,
        'maneuver_name', 'Slow Flight',
        'acs_task_code', 'PA.V.A',
        'score', 2,
        'performance_level', 'progressing',
        'notes', 'Good understanding of the maneuver but struggled with altitude control. Lost approximately 150 feet during configuration changes. Need to anticipate pitch changes with power and flap adjustments.',
        'far_references', ARRAY['§61.107(b)(1)(iv)'],
        'strengths', ARRAY['Recognized approach to stall', 'Good radio communication'],
        'areas_for_improvement', ARRAY['Altitude control during configuration changes', 'Trim usage', 'Power management'],
        'acs_standard_met', false
      ),
      jsonb_build_object(
        'maneuver_id', v_maneuver_id_3,
        'maneuver_name', 'Power-Off Stalls',
        'acs_task_code', 'PA.VI.A',
        'score', 3,
        'performance_level', 'proficient',
        'notes', 'Excellent stall recognition and recovery. Properly identified the first indication of stall (buffet) and executed immediate recovery. Minimal altitude loss and maintained coordinated flight throughout.',
        'far_references', ARRAY['§61.107(b)(1)(iv)', '§61.109(a)(1)'],
        'strengths', ARRAY['Quick recognition', 'Immediate recovery', 'Coordinated flight'],
        'areas_for_improvement', ARRAY['Could add power more aggressively during recovery'],
        'acs_standard_met', true
      )
    ],
    ARRAY[
      jsonb_build_object(
        'reference', '§61.107(b)(1)(iv)',
        'description', 'Flight training requirements for private pilot certification',
        'context', 'Discussed how today''s maneuvers fulfill the required flight training for the practical test'
      ),
      jsonb_build_object(
        'reference', '§91.155',
        'description', 'Basic VFR weather minimums',
        'context', 'Reviewed weather minimums for Class E airspace during pre-flight briefing'
      )
    ],
    'Great first flight! You demonstrated excellent situational awareness and a solid understanding of aircraft control. Your steep turns were particularly impressive - you maintained altitude and coordination throughout both turns, which shows you''re developing good stick and rudder skills. Your stall recognition and recovery were textbook perfect. The slow flight maneuver needs some work, particularly with altitude control during configuration changes, but this is completely normal at this stage of training. Overall, you''re progressing well and building a strong foundation.',
    ARRAY[
      jsonb_build_object(
        'category', 'strength',
        'observation', 'Excellent coordination during steep turns',
        'evidence', 'Maintained coordinated flight throughout 360-degree turns in both directions. Ball remained centered, no adverse yaw observed.',
        'coaching', 'This is exactly what we want to see. Continue using this same technique for all turning maneuvers.',
        'priority', 'high'
      ),
      jsonb_build_object(
        'category', 'strength',
        'observation', 'Outstanding stall recognition and recovery',
        'evidence', 'Identified stall at first indication (buffet), executed immediate recovery with minimal altitude loss (approximately 50 feet).',
        'coaching', 'Your quick recognition and response show good aircraft awareness. This skill will serve you well throughout your flying career.',
        'priority', 'high'
      ),
      jsonb_build_object(
        'category', 'improvement',
        'observation', 'Altitude control during slow flight configuration changes',
        'evidence', 'Lost approximately 150 feet when adding flaps and reducing power to slow flight configuration.',
        'coaching', 'Anticipate pitch changes when adjusting power and flaps. Add back pressure as you reduce power, and be ready to increase power to maintain altitude. Practice this at a safe altitude until it becomes second nature.',
        'priority', 'high'
      ),
      jsonb_build_object(
        'category', 'improvement',
        'observation', 'Trim usage during slow flight',
        'evidence', 'Holding significant forward pressure on yoke during slow flight instead of trimming for hands-off flight.',
        'coaching', 'Remember to trim for the desired airspeed. This reduces workload and allows you to focus on other aspects of aircraft control. Trim is your friend!',
        'priority', 'medium'
      ),
      jsonb_build_object(
        'category', 'correction',
        'observation', 'Airspeed control during steep turns',
        'evidence', 'Airspeed varied between 88 and 112 knots during steep turns (ACS standard is ±10 knots).',
        'coaching', 'Focus on maintaining a consistent pitch attitude during the turn. Use small power adjustments to maintain airspeed. Practice scanning your instruments more frequently during the maneuver.',
        'priority', 'medium'
      )
    ],
    'For our next flight, we''ll continue practicing slow flight with emphasis on altitude control during configuration changes. We''ll also introduce power-on stalls and work on your trim technique. Before the next lesson, review the slow flight procedures in the POH and practice chair flying the configuration changes at home. Also, review the power-on stall recovery procedure in the ACS. Great job today - you''re building a solid foundation!',
    true,
    'gpt-4-turbo',
    0.92,
    3200
  );

  RAISE NOTICE 'Created Debrief: %', v_debrief_id;

  -- Link debrief to mission
  UPDATE missions
  SET debrief_id = v_debrief_id
  WHERE id = v_mission_id_2;

  -- ============================================================================
  -- 8. CREATE COMPLETED TRAINING EVENTS FOR MISSION 2
  -- ============================================================================

  -- Completed pre-brief
  INSERT INTO training_events (
    mission_id,
    enrollment_id,
    instructor_id,
    student_id,
    event_type,
    event_sequence,
    billing_category,
    scheduled_duration_minutes,
    actual_duration_minutes,
    billable_hours,
    student_billing_rate_dollars,
    student_charge_cents,
    instructor_payout_rate_cents,
    instructor_payout_cents,
    dsa_margin_cents,
    student_payment_status,
    instructor_payout_status,
    scheduled_start_time,
    actual_start_time,
    actual_end_time,
    status
  ) VALUES (
    v_mission_id_2,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'prebrief',
    1,
    'ground_instruction',
    30,
    35,
    0.58,
    75.00,
    4350,
    4500,
    2610,
    1740,
    'paid',
    'paid',
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '09:00:00',
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '09:00:00',
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '09:35:00',
    'completed'
  );

  -- Completed flight
  INSERT INTO training_events (
    mission_id,
    enrollment_id,
    instructor_id,
    student_id,
    event_type,
    event_sequence,
    billing_category,
    scheduled_duration_minutes,
    actual_duration_minutes,
    billable_hours,
    aircraft_id,
    hobbs_start,
    hobbs_end,
    student_billing_rate_dollars,
    student_charge_cents,
    instructor_payout_rate_cents,
    instructor_payout_cents,
    dsa_margin_cents,
    student_payment_status,
    instructor_payout_status,
    scheduled_start_time,
    actual_start_time,
    actual_end_time,
    status
  ) VALUES (
    v_mission_id_2,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'flight',
    2,
    'flight_instruction',
    120,
    108,
    1.8,
    v_aircraft_id,
    2456.3,
    2458.1,
    85.00,
    15300,
    5100,
    9180,
    6120,
    'paid',
    'paid',
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '09:35:00',
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '09:40:00',
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '11:28:00',
    'completed'
  );

  -- Completed post-brief
  INSERT INTO training_events (
    mission_id,
    enrollment_id,
    instructor_id,
    student_id,
    event_type,
    event_sequence,
    billing_category,
    scheduled_duration_minutes,
    actual_duration_minutes,
    billable_hours,
    student_billing_rate_dollars,
    student_charge_cents,
    instructor_payout_rate_cents,
    instructor_payout_cents,
    dsa_margin_cents,
    student_payment_status,
    instructor_payout_status,
    scheduled_start_time,
    actual_start_time,
    actual_end_time,
    status
  ) VALUES (
    v_mission_id_2,
    v_enrollment_id,
    v_instructor_id,
    v_student_id,
    'postbrief',
    3,
    'ground_instruction',
    30,
    25,
    0.42,
    75.00,
    3150,
    4500,
    1890,
    1260,
    'paid',
    'paid',
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '11:28:00',
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '11:30:00',
    (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '11:55:00',
    'completed'
  );

  RAISE NOTICE 'Created 3 completed training events for Mission 2';

  -- Update mission totals (should be done automatically by trigger, but doing manually to be sure)
  UPDATE missions
  SET 
    total_cost_cents = 22800,
    total_flight_hours = 1.8,
    total_ground_hours = 1.0
  WHERE id = v_mission_id_2;

  -- ============================================================================
  -- 9. CREATE MANEUVER SCORES FOR MISSION 2
  -- ============================================================================

  INSERT INTO maneuver_scores (
    student_id,
    maneuver_id,
    mission_id,
    maneuver_name,
    acs_task_code,
    performance_level,
    numeric_score,
    acs_standard_met,
    instructor_notes,
    areas_of_strength,
    areas_for_improvement_text,
    student_attempt_number
  ) VALUES
  (
    v_student_id,
    v_maneuver_id_1,
    v_mission_id_2,
    'Steep Turns',
    'PA.V.B',
    'proficient',
    3,
    true,
    'Excellent coordination and altitude control. Maintained within ACS standards throughout both left and right turns.',
    ARRAY['Smooth bank entry', 'Good altitude control', 'Proper coordination'],
    ARRAY['Airspeed varied by 12 knots - aim for ±10'],
    1
  ),
  (
    v_student_id,
    v_maneuver_id_2,
    v_mission_id_2,
    'Slow Flight',
    'PA.V.A',
    'progressing',
    2,
    false,
    'Good understanding but struggled with altitude control during configuration changes.',
    ARRAY['Recognized approach to stall', 'Good radio communication'],
    ARRAY['Altitude control during configuration changes', 'Trim usage', 'Power management'],
    1
  ),
  (
    v_student_id,
    v_maneuver_id_3,
    v_mission_id_2,
    'Power-Off Stalls',
    'PA.VI.A',
    'proficient',
    3,
    true,
    'Excellent stall recognition and recovery. Minimal altitude loss and maintained coordinated flight.',
    ARRAY['Quick recognition', 'Immediate recovery', 'Coordinated flight'],
    ARRAY['Could add power more aggressively during recovery'],
    1
  );

  RAISE NOTICE 'Created 3 maneuver scores for Mission 2';

  -- ============================================================================
  -- 10. UPDATE STUDENT MANEUVER PROGRESS
  -- ============================================================================

  -- Insert or update progress for each maneuver
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
    latest_instructor_notes,
    common_strengths,
    common_areas_for_improvement,
    first_proficient_date,
    consistently_proficient,
    checkride_ready
  ) VALUES
  (
    v_student_id,
    v_maneuver_id_1,
    1,
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE - INTERVAL '7 days',
    v_mission_id_2,
    3,
    'proficient',
    true,
    3.00,
    'insufficient_data',
    ARRAY[3],
    'Excellent coordination and altitude control',
    ARRAY['Smooth bank entry', 'Good altitude control', 'Proper coordination'],
    ARRAY['Airspeed control'],
    CURRENT_DATE - INTERVAL '7 days',
    false,
    false
  ),
  (
    v_student_id,
    v_maneuver_id_2,
    1,
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE - INTERVAL '7 days',
    v_mission_id_2,
    2,
    'progressing',
    false,
    2.00,
    'insufficient_data',
    ARRAY[2],
    'Good understanding but needs work on altitude control',
    ARRAY['Stall recognition', 'Radio communication'],
    ARRAY['Altitude control', 'Trim usage', 'Power management'],
    NULL,
    false,
    false
  ),
  (
    v_student_id,
    v_maneuver_id_3,
    1,
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE - INTERVAL '7 days',
    v_mission_id_2,
    3,
    'proficient',
    true,
    3.00,
    'insufficient_data',
    ARRAY[3],
    'Excellent stall recognition and recovery',
    ARRAY['Quick recognition', 'Immediate recovery', 'Coordinated flight'],
    ARRAY['Power application during recovery'],
    CURRENT_DATE - INTERVAL '7 days',
    false,
    false
  )
  ON CONFLICT (student_id, maneuver_id) DO UPDATE
  SET
    total_attempts = student_maneuver_progress.total_attempts + 1,
    last_attempt_date = EXCLUDED.last_attempt_date,
    latest_mission_id = EXCLUDED.latest_mission_id,
    latest_score = EXCLUDED.latest_score,
    latest_performance_level = EXCLUDED.latest_performance_level,
    acs_standard_met = EXCLUDED.acs_standard_met,
    average_score = (student_maneuver_progress.average_score * student_maneuver_progress.total_attempts + EXCLUDED.latest_score) / (student_maneuver_progress.total_attempts + 1),
    scores_history = array_append(student_maneuver_progress.scores_history, EXCLUDED.latest_score),
    latest_instructor_notes = EXCLUDED.latest_instructor_notes,
    updated_at = NOW();

  RAISE NOTICE 'Updated student maneuver progress';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'DEMO DATA CREATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Student ID: %', v_student_id;
  RAISE NOTICE 'Instructor ID: %', v_instructor_id;
  RAISE NOTICE 'Enrollment ID: %', v_enrollment_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Mission 1 (Upcoming): %', v_mission_id_1;
  RAISE NOTICE '  - Code: DSA-PPC-F1';
  RAISE NOTICE '  - Date: % at 09:00', CURRENT_DATE + INTERVAL '2 days';
  RAISE NOTICE '  - Status: scheduled';
  RAISE NOTICE '  - Plan of Action: % (shared)', v_poa_id;
  RAISE NOTICE '  - Training Events: 3 (prebrief, flight, postbrief)';
  RAISE NOTICE '';
  RAISE NOTICE 'Mission 2 (Completed): %', v_mission_id_2;
  RAISE NOTICE '  - Code: DSA-PPC-F0';
  RAISE NOTICE '  - Date: % at 09:00', CURRENT_DATE - INTERVAL '7 days';
  RAISE NOTICE '  - Status: completed';
  RAISE NOTICE '  - Assessment: satisfactory';
  RAISE NOTICE '  - Debrief: % (with 3 maneuvers)', v_debrief_id;
  RAISE NOTICE '  - Training Events: 3 (all completed)';
  RAISE NOTICE '  - Flight Hours: 1.8';
  RAISE NOTICE '  - Ground Hours: 1.0';
  RAISE NOTICE '';
  RAISE NOTICE 'Student can now:';
  RAISE NOTICE '  1. View missions at /student/missions';
  RAISE NOTICE '  2. Review POA at /student/missions/%/poa', v_mission_id_1;
  RAISE NOTICE '  3. View debrief at /student/missions/%/debrief', v_mission_id_2;
  RAISE NOTICE '';
  RAISE NOTICE 'Instructor can:';
  RAISE NOTICE '  1. View missions at /instructor/missions';
  RAISE NOTICE '  2. Pre-brief at /instructor/missions/%/pre-brief', v_mission_id_1;
  RAISE NOTICE '  3. Manage mission at /instructor/missions/%', v_mission_id_1;
  RAISE NOTICE '========================================';

END $$;

