-- ============================================================================
-- DEMO MISSION DATA - FIXED VERSION
-- ============================================================================
-- Creates 2 demo missions for testing the student experience
-- ============================================================================

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
  v_maneuver_id_1 UUID;
  v_maneuver_id_2 UUID;
  v_maneuver_id_3 UUID;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Creating Demo Mission Data';
  RAISE NOTICE '============================================';

  -- Get instructor
  SELECT id INTO v_instructor_id
  FROM profiles
  WHERE email = 'thomas@desertskiesaviationaz.com'
  LIMIT 1;

  IF v_instructor_id IS NULL THEN
    RAISE EXCEPTION 'Instructor not found';
  END IF;
  RAISE NOTICE 'Instructor ID: %', v_instructor_id;

  -- Get syllabus
  SELECT id INTO v_syllabus_id
  FROM syllabi
  WHERE title ILIKE '%private pilot%' OR title ILIKE '%sporty%'
  LIMIT 1;

  IF v_syllabus_id IS NULL THEN
    RAISE EXCEPTION 'Syllabus not found';
  END IF;
  RAISE NOTICE 'Syllabus ID: %', v_syllabus_id;

  -- Get first lesson
  SELECT id INTO v_lesson_id
  FROM syllabus_lessons
  WHERE syllabus_id = v_syllabus_id
  ORDER BY order_index
  LIMIT 1;

  RAISE NOTICE 'Lesson ID: %', v_lesson_id;

  -- Get any aircraft (removed status filter)
  SELECT id INTO v_aircraft_id
  FROM aircraft
  LIMIT 1;

  IF v_aircraft_id IS NULL THEN
    RAISE NOTICE 'No aircraft found - missions will be created without aircraft';
  ELSE
    RAISE NOTICE 'Aircraft ID: %', v_aircraft_id;
  END IF;

  -- Get maneuvers
  SELECT id INTO v_maneuver_id_1 FROM maneuvers WHERE name ILIKE '%steep turn%' LIMIT 1;
  SELECT id INTO v_maneuver_id_2 FROM maneuvers WHERE name ILIKE '%slow flight%' LIMIT 1;
  SELECT id INTO v_maneuver_id_3 FROM maneuvers WHERE name ILIKE '%stall%' LIMIT 1;

  IF v_maneuver_id_1 IS NULL THEN SELECT id INTO v_maneuver_id_1 FROM maneuvers LIMIT 1 OFFSET 0; END IF;
  IF v_maneuver_id_2 IS NULL THEN SELECT id INTO v_maneuver_id_2 FROM maneuvers LIMIT 1 OFFSET 1; END IF;
  IF v_maneuver_id_3 IS NULL THEN SELECT id INTO v_maneuver_id_3 FROM maneuvers LIMIT 1 OFFSET 2; END IF;

  -- Get or create enrollment
  SELECT id INTO v_enrollment_id
  FROM student_enrollments
  WHERE student_id = v_student_id
  AND syllabus_id = v_syllabus_id
  LIMIT 1;

  IF v_enrollment_id IS NULL THEN
    INSERT INTO student_enrollments (
      student_id, syllabus_id, instructor_id, enrollment_date, status, progress_percentage
    ) VALUES (
      v_student_id, v_syllabus_id, v_instructor_id, CURRENT_DATE - INTERVAL '30 days', 'active', 15.5
    ) RETURNING id INTO v_enrollment_id;
    RAISE NOTICE 'Created enrollment: %', v_enrollment_id;
  ELSE
    RAISE NOTICE 'Using existing enrollment: %', v_enrollment_id;
  END IF;

  -- Create Mission 1 - Upcoming
  v_mission_id_1 := gen_random_uuid();
  INSERT INTO missions (
    id, enrollment_id, assigned_instructor_id, student_id,
    mission_code, mission_number, program_code, mission_type,
    lesson_template_id, lesson_code, scheduled_date, scheduled_start_time,
    scheduled_aircraft_id, status, created_by
  ) VALUES (
    v_mission_id_1, v_enrollment_id, v_instructor_id, v_student_id,
    'DSA-PPC-F1', 1, 'PPC', 'F', v_lesson_id, 'PPC-L1',
    CURRENT_DATE + INTERVAL '2 days', '09:00:00',
    v_aircraft_id, 'scheduled', v_instructor_id
  );
  RAISE NOTICE '✅ Created Mission 1: DSA-PPC-F1 (Upcoming)';

  -- Create POA
  v_poa_id := gen_random_uuid();
  INSERT INTO plans_of_action (
    id, mission_id, student_id, instructor_id, flight_number,
    aircraft_tail_number, departure_direction, destination_airport, duration_hours,
    mission_overview, training_objectives, student_focus_notes,
    video_resources, faa_references, prep_checklist_items,
    status, shared_with_student_at, ai_generated, ai_model_used, ai_generation_time_ms
  ) VALUES (
    v_poa_id, v_mission_id_1, v_student_id, v_instructor_id, 1,
    (SELECT tail_number FROM aircraft WHERE id = v_aircraft_id), 'North', 'KCHD', 2.0,
    'This flight will focus on fundamental flight maneuvers and aircraft control.',
    ARRAY['Demonstrate proper pre-flight planning', 'Execute steep turns to ACS standards', 'Perform slow flight maneuvers'],
    ARRAY['Continue working on altitude control', 'Focus on coordinated flight'],
    ARRAY['{"title": "Steep Turns", "url": "https://youtube.com", "duration_minutes": 12, "verified": true}'::jsonb],
    ARRAY['{"title": "14 CFR §61.107", "reference": "§61.107", "verified": true}'::jsonb],
    ARRAY['Complete weather briefing', 'Review steep turn procedures', 'Study slow flight configuration'],
    'shared', NOW() - INTERVAL '1 day', true, 'gpt-4-turbo', 2450
  );
  UPDATE missions SET plan_of_action_id = v_poa_id WHERE id = v_mission_id_1;
  RAISE NOTICE '✅ Created Plan of Action';

  -- Create Mission 2 - Completed
  v_mission_id_2 := gen_random_uuid();
  INSERT INTO missions (
    id, enrollment_id, assigned_instructor_id, student_id,
    mission_code, mission_number, program_code, mission_type,
    lesson_template_id, lesson_code, scheduled_date, scheduled_start_time,
    scheduled_aircraft_id, actual_aircraft_id, status, instructor_assessment,
    total_flight_hours, total_ground_hours, completed_at, created_by
  ) VALUES (
    v_mission_id_2, v_enrollment_id, v_instructor_id, v_student_id,
    'DSA-PPC-F0', 0, 'PPC', 'F', v_lesson_id, 'PPC-L0',
    CURRENT_DATE - INTERVAL '7 days', '09:00:00',
    v_aircraft_id, v_aircraft_id, 'completed', 'satisfactory',
    1.8, 1.0, (CURRENT_DATE - INTERVAL '7 days')::timestamp + TIME '12:00:00', v_instructor_id
  );
  RAISE NOTICE '✅ Created Mission 2: DSA-PPC-F0 (Completed)';

  -- Create Debrief
  v_debrief_id := gen_random_uuid();
  INSERT INTO debriefs (
    id, mission_id, student_id, instructor_id, flight_number,
    maneuvers_covered, maneuver_details, far_references,
    general_overview, key_takeaways, next_lesson_plan,
    ai_formatted, ai_model_used, ai_confidence_score, ai_processing_time_ms
  ) VALUES (
    v_debrief_id, v_mission_id_2, v_student_id, v_instructor_id, 0,
    ARRAY[v_maneuver_id_1::text, v_maneuver_id_2::text, v_maneuver_id_3::text],
    ARRAY[
      jsonb_build_object('maneuver_id', v_maneuver_id_1, 'maneuver_name', 'Steep Turns', 'score', 3, 'performance_level', 'proficient', 'notes', 'Excellent coordination'),
      jsonb_build_object('maneuver_id', v_maneuver_id_2, 'maneuver_name', 'Slow Flight', 'score', 2, 'performance_level', 'progressing', 'notes', 'Good understanding but altitude control needs work'),
      jsonb_build_object('maneuver_id', v_maneuver_id_3, 'maneuver_name', 'Power-Off Stalls', 'score', 3, 'performance_level', 'proficient', 'notes', 'Excellent stall recognition')
    ],
    ARRAY[jsonb_build_object('reference', '§61.107', 'description', 'Flight training requirements', 'context', 'Discussed maneuvers')],
    'Great first flight! You demonstrated excellent situational awareness.',
    ARRAY[
      jsonb_build_object('category', 'strength', 'observation', 'Excellent coordination', 'evidence', 'Maintained coordinated flight', 'coaching', 'Keep it up', 'priority', 'high'),
      jsonb_build_object('category', 'improvement', 'observation', 'Altitude control', 'evidence', 'Lost 150 feet', 'coaching', 'Anticipate pitch changes', 'priority', 'high')
    ],
    'Next flight we will practice slow flight with emphasis on altitude control.',
    true, 'gpt-4-turbo', 0.92, 3200
  );
  UPDATE missions SET debrief_id = v_debrief_id WHERE id = v_mission_id_2;
  RAISE NOTICE '✅ Created Debrief';

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DEMO DATA CREATED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Mission 1: DSA-PPC-F1 (Upcoming, scheduled %)', CURRENT_DATE + INTERVAL '2 days';
  RAISE NOTICE '  - Has Plan of Action';
  RAISE NOTICE 'Mission 2: DSA-PPC-F0 (Completed, %)', CURRENT_DATE - INTERVAL '7 days';
  RAISE NOTICE '  - Has Debrief';
  RAISE NOTICE '';
  RAISE NOTICE 'View at: http://localhost:3000/student/schedule';
  RAISE NOTICE 'Student ID: %', v_student_id;
  RAISE NOTICE '============================================';

END $$;

