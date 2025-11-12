-- =====================================================================
-- SPORTY'S SYLLABUS - ACS STANDARDS INTEGRATION
-- =====================================================================
-- This migration links Sporty's Private Pilot lessons to specific
-- ACS (Airman Certification Standards) tasks
--
-- Run this AFTER create-sportys-part61-syllabus.sql
-- =====================================================================

DO $$
DECLARE
  v_syllabus_id UUID;
  v_lesson_id UUID;
BEGIN

-- Get the Sporty's syllabus ID
SELECT id INTO v_syllabus_id
FROM syllabi
WHERE title = 'Sporty''s Private Pilot Course - Part 61'
ORDER BY created_at DESC
LIMIT 1;

IF v_syllabus_id IS NULL THEN
  RAISE EXCEPTION 'Sporty''s syllabus not found. Please run create-sportys-part61-syllabus.sql first.';
END IF;

RAISE NOTICE 'Linking ACS standards to Sporty''s syllabus: %', v_syllabus_id;

-- =====================================================================
-- LESSON 2: Introduction Flight - Normal Takeoffs and Landings
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 2;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  2, -- Introduction level
  'Introduction to normal takeoff and landing. Student observing and beginning to understand the sequence.'
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('K', 'M') -- Normal/Crosswind Takeoff and Landing
  AND a.code = 'IV'; -- Takeoffs, Landings, Go-Arounds

-- =====================================================================
-- LESSON 5: Slow Flight and Imminent Stalls
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 5;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  2,
  CASE t.code
    WHEN 'A' THEN 'Introduction to slow flight. Developing feel for aircraft at low airspeeds.'
    WHEN 'B' THEN 'Imminent power-off stalls (landing configuration). Recognition and recovery.'
    WHEN 'C' THEN 'Imminent power-on stalls (takeoff configuration). Recognition and recovery.'
  END
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('A', 'B', 'C') -- Slow Flight, Power-Off Stalls, Power-On Stalls
  AND a.code = 'VI'; -- Slow Flight and Stalls

-- =====================================================================
-- LESSON 9: Full Stalls and Steep Turns
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 9;

-- Link Stalls
INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  CASE t.code
    WHEN 'B' THEN 'Full power-off stalls with and without flaps. Recovery at full break.'
    WHEN 'C' THEN 'Full power-on stalls without flaps. Recovery at full break.'
  END
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('B', 'C')
  AND a.code = 'VI';

-- Link Steep Turns
INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  2,
  'Introduction to steep turns (45° bank). Maintaining altitude and heading.'
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code = 'B' -- Steep Turns
  AND a.code = 'V'; -- Performance and Ground Reference Maneuvers

-- =====================================================================
-- LESSON 13: Ground Reference Maneuvers
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 13;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  CASE t.code
    WHEN 'C' THEN 'Rectangular course. Maintaining constant radius turns around rectangular pattern.'
    WHEN 'D' THEN 'S-turns across a road. Equal radii, constant altitude.'
    WHEN 'E' THEN 'Turns around a point. Maintaining constant radius around reference point.'
  END
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('C', 'D', 'E')
  AND a.code = 'V';

-- =====================================================================
-- LESSON 17: Rejected Takeoffs and Go-Arounds
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 17;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  CASE t.code
    WHEN 'N' THEN 'Go-around / rejected landing procedures. Prompt recognition and execution.'
    WHEN 'P' THEN 'Simulated emergency approach and landing. Decision making and procedures.'
  END
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('N', 'P')
  AND a.code = 'IV';

-- =====================================================================
-- LESSON 19: Crosswind Operations and Slips
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 19;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  CASE t.code
    WHEN 'K' THEN 'Crosswind takeoff and climb. Maintaining centerline, coordinated inputs.'
    WHEN 'M' THEN 'Crosswind approach and landing. Crab or wing-low method.'
    WHEN 'L' THEN 'Forward slip to landing. Airspeed control, landing without flaps if needed.'
  END
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('K', 'M', 'L')
  AND a.code = 'IV';

-- =====================================================================
-- LESSON 27: STAGE I CHECK
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 27;

-- Link ALL Stage I ACS tasks for comprehensive evaluation
INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3, -- Must meet standards for solo authorization
  'Stage I Check: Comprehensive evaluation of all pre-solo skills.'
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE 
  -- Preflight and Taxi
  (a.code = 'I' AND t.code IN ('A', 'B', 'C', 'F')) OR
  -- Traffic Patterns
  (a.code = 'III' AND t.code = 'B') OR
  -- Takeoffs and Landings
  (a.code = 'IV' AND t.code IN ('K', 'M', 'N', 'P')) OR
  -- Ground Reference
  (a.code = 'V' AND t.code IN ('C', 'D', 'E')) OR
  -- Slow Flight and Stalls
  (a.code = 'VI' AND t.code IN ('A', 'B', 'C'));

-- =====================================================================
-- LESSON 34: Short and Soft Field Operations
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 34;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  2,
  CASE t.code
    WHEN 'H' THEN 'Introduction to short-field takeoff. Maximum performance, obstacle clearance.'
    WHEN 'I' THEN 'Introduction to soft-field takeoff. Keeping weight off nosewheel.'
    WHEN 'O' THEN 'Short-field approach and landing. Precise airspeed and touchdown point control.'
    WHEN 'P' THEN 'Soft-field approach and landing. Smooth touchdown, weight off nosewheel.'
  END
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('H', 'I', 'O', 'P')
  AND a.code = 'IV';

-- =====================================================================
-- LESSON 40: Dual Cross-Country - Pilotage
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 40;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  CASE t.code
    WHEN 'A' THEN 'Cross-country flight planning. Use of charts, navigation log, performance planning.'
    WHEN 'B' THEN 'Navigation systems and radar services. VOR use, flight following.'
    WHEN 'D' THEN 'Pilotage and dead reckoning. Visual navigation techniques.'
  END
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('A', 'B', 'D')
  AND a.code = 'VII'; -- Navigation

-- =====================================================================
-- LESSON 42: Dual Cross-Country with Diversion
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 42;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  CASE t.code
    WHEN 'E' THEN 'Diversion procedures. Selecting alternate, calculating heading/time/fuel.'
    WHEN 'F' THEN 'Lost procedures. Orienting to landmarks, obtaining assistance.'
  END
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('E', 'F')
  AND a.code = 'VII';

-- =====================================================================
-- LESSON 50-51: Instrument Flight
-- =====================================================================
-- Lesson 50
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 50;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  'Basic attitude instrument flight. Straight and level, turns, climbs, descents by reference to instruments.'
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('A', 'B', 'C', 'D') -- Straight and level, turns, climbs, descents
  AND a.code = 'VIII'; -- Basic Instrument Maneuvers

-- Lesson 51
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 51;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  CASE t.code
    WHEN 'A' THEN 'Attitude instrument flying continued.'
    WHEN 'E' THEN 'Recovery from unusual flight attitudes. Nose high and nose low recoveries.'
  END
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('A', 'E')
  AND a.code = 'VIII';

-- =====================================================================
-- LESSON 54-55: Night Operations
-- =====================================================================
-- Lesson 54
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 54;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  'Night flight operations. 5 takeoffs and landings at night. Use of aircraft lighting.'
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE t.code IN ('K', 'M') -- Normal takeoff/landing
  AND a.code = 'IV';

-- Lesson 55
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 55;

INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  3,
  'Night cross-country flight. 100nm+ with night navigation and operations.'
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE 
  (a.code = 'VII' AND t.code IN ('A', 'B', 'D')) OR -- Navigation tasks
  (a.code = 'IV' AND t.code IN ('K', 'M')); -- Night takeoffs/landings

-- =====================================================================
-- LESSON 59: STAGE III CHECK (Final Checkride Prep)
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 59;

-- Link ALL applicable Private Pilot ACS tasks
INSERT INTO lesson_acs_standards (lesson_id, acs_task_id, is_primary_focus, proficiency_target, instructor_notes)
SELECT 
  v_lesson_id,
  t.id,
  true,
  4, -- Must meet checkride standards
  'Stage III Check: Comprehensive evaluation to Private Pilot ACS standards.'
FROM acs_tasks t
JOIN acs_areas a ON t.acs_area_id = a.id
WHERE a.code IN ('I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X');

RAISE NOTICE 'Successfully linked ACS standards to Sporty''s syllabus lessons!';

END $$;

-- =====================================================================
-- VERIFICATION
-- =====================================================================

-- Count ACS links by lesson
SELECT 
  l.order_index,
  l.title,
  COUNT(las.id) as acs_task_count
FROM syllabus_lessons l
LEFT JOIN lesson_acs_standards las ON l.id = las.lesson_id
WHERE l.syllabus_id = (
  SELECT id FROM syllabi 
  WHERE title = 'Sporty''s Private Pilot Course - Part 61'
  ORDER BY created_at DESC LIMIT 1
)
GROUP BY l.order_index, l.title
HAVING COUNT(las.id) > 0
ORDER BY l.order_index;

-- Total ACS links created
SELECT COUNT(*) as total_acs_links
FROM lesson_acs_standards
WHERE lesson_id IN (
  SELECT id FROM syllabus_lessons
  WHERE syllabus_id = (
    SELECT id FROM syllabi 
    WHERE title = 'Sporty''s Private Pilot Course - Part 61'
    ORDER BY created_at DESC LIMIT 1
  )
);
