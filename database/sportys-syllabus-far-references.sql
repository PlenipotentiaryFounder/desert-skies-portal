-- =====================================================================
-- SPORTY'S SYLLABUS - FAR REFERENCES
-- =====================================================================
-- This migration adds Federal Aviation Regulation references to
-- Sporty's Private Pilot lessons
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

RAISE NOTICE 'Adding FAR references to Sporty''s syllabus: %', v_syllabus_id;

-- =====================================================================
-- LESSON 1: Training Aircraft Introduction
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 1;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.103', 'required', 'Preflight action - familiarity with all available information'),
(v_lesson_id, '14 CFR 91.9', 'required', 'Civil aircraft airworthiness - aircraft certificates and documents'),
(v_lesson_id, '14 CFR 91.203', 'required', 'Required documents (AROW) - Certificate, Registration, Operating Handbook, Weight & Balance');

-- =====================================================================
-- LESSON 3: Airport Operations
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 3;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.113', 'required', 'Right-of-way rules'),
(v_lesson_id, '14 CFR 91.125', 'required', 'ATC light signals'),
(v_lesson_id, '14 CFR 91.126', 'required', 'Operations at non-towered airports'),
(v_lesson_id, '14 CFR 91.127', 'required', 'Operations at towered airports within Class D airspace'),
(v_lesson_id, '14 CFR 91.129', 'required', 'Operations in Class D airspace'),
(v_lesson_id, 'AIM Chapter 2', 'supplemental', 'Aeronautical lighting and airport visual aids'),
(v_lesson_id, 'AIM Chapter 4', 'supplemental', 'Air traffic control procedures');

-- =====================================================================
-- LESSON 8: Aircraft Performance
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 8;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.103', 'required', 'Preflight action - performance information'),
(v_lesson_id, '14 CFR 91.9', 'required', 'Operating within aircraft limitations (AFM/POH)');

-- =====================================================================
-- LESSON 10, 12, 14: Weather
-- =====================================================================
-- Lesson 10
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 10;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.103', 'required', 'Preflight action - weather reports and forecasts'),
(v_lesson_id, 'AIM Chapter 7', 'supplemental', 'Safety of flight - weather hazards');

-- Lesson 12
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 12;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.103', 'required', 'Preflight action - obtaining weather briefings'),
(v_lesson_id, 'AIM Chapter 7', 'supplemental', 'Aviation weather services');

-- Lesson 14
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 14;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.103', 'required', 'Preflight action - NOTAMs and hazardous weather'),
(v_lesson_id, 'AIM Chapter 5-1', 'supplemental', 'NOTAMs');

-- =====================================================================
-- LESSON 16: Emergency Procedures
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 16;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.3', 'required', 'Pilot in command authority and responsibility in emergencies'),
(v_lesson_id, '14 CFR 91.7', 'required', 'Determining airworthiness before flight'),
(v_lesson_id, '14 CFR 91.9', 'required', 'Aircraft operating limitations and emergency procedures'),
(v_lesson_id, 'AIM Chapter 6', 'supplemental', 'Emergency procedures');

-- =====================================================================
-- LESSON 18: FARs, NTSB, and Logbooks
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 18;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR Part 1', 'required', 'Definitions and abbreviations'),
(v_lesson_id, '14 CFR 61.3', 'required', 'Requirement for certificates, ratings, and authorizations'),
(v_lesson_id, '14 CFR 61.23', 'required', 'Medical certificates: requirement and duration'),
(v_lesson_id, '14 CFR 61.51', 'required', 'Pilot logbooks - what to log and how'),
(v_lesson_id, '14 CFR 61.56', 'required', 'Flight review requirements'),
(v_lesson_id, '14 CFR 61.57', 'required', 'Recent flight experience - passenger carrying'),
(v_lesson_id, '14 CFR 61.87', 'required', 'Solo requirements for student pilots'),
(v_lesson_id, '14 CFR 61.89', 'required', 'Student pilot limitations'),
(v_lesson_id, '14 CFR 61.93', 'required', 'Solo cross-country flight requirements'),
(v_lesson_id, '14 CFR 61.113', 'required', 'Private pilot privileges and limitations'),
(v_lesson_id, '14 CFR 91.3', 'required', 'Pilot in command responsibility and authority'),
(v_lesson_id, '14 CFR 91.13', 'required', 'Careless or reckless operation'),
(v_lesson_id, '14 CFR 91.15', 'required', 'Dropping objects from aircraft'),
(v_lesson_id, '14 CFR 91.17', 'required', 'Alcohol and drugs - 8 hours bottle to throttle'),
(v_lesson_id, 'NTSB 830', 'required', 'Aircraft accident and incident reporting');

-- =====================================================================
-- LESSON 20: Aircraft Systems  
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 20;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.9', 'required', 'Aircraft operating limitations from AFM/POH'),
(v_lesson_id, '14 CFR 91.205', 'required', 'Required VFR daytime equipment');

-- =====================================================================
-- LESSON 22: Additional Aircraft Systems
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 22;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.205', 'required', 'Required VFR equipment - day and night'),
(v_lesson_id, '14 CFR 91.213', 'required', 'Inoperative instruments and equipment'),
(v_lesson_id, '14 CFR 91.409', 'required', 'Annual and 100-hour inspections'),
(v_lesson_id, '14 CFR 91.417', 'required', 'Maintenance records requirements'),
(v_lesson_id, '14 CFR 43', 'supplemental', 'Maintenance, preventive maintenance, alterations');

-- =====================================================================
-- LESSON 24: Aircraft Instruments and Maintenance
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 24;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.205', 'required', 'Required instruments and equipment'),
(v_lesson_id, '14 CFR 91.207', 'required', 'Emergency locator transmitter (ELT) requirements'),
(v_lesson_id, '14 CFR 91.209', 'required', 'Aircraft lighting requirements'),
(v_lesson_id, '14 CFR 91.211', 'required', 'Supplemental oxygen requirements'),
(v_lesson_id, '14 CFR 91.213', 'required', 'Inoperative instruments and equipment'),
(v_lesson_id, '14 CFR 91.403', 'required', 'Owner/operator responsibility for maintenance'),
(v_lesson_id, '14 CFR 91.407', 'required', 'Return to service after maintenance'),
(v_lesson_id, '14 CFR 91.409', 'required', 'Inspections required'),
(v_lesson_id, '14 CFR 91.411', 'required', 'Altimeter system and altitude reporting equipment tests'),
(v_lesson_id, '14 CFR 91.413', 'required', 'ATC transponder tests and inspections'),
(v_lesson_id, '14 CFR 91.417', 'required', 'Maintenance records');

-- =====================================================================
-- LESSON 26: Airspace Classification
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 26;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 71', 'required', 'Designation of airspace classes'),
(v_lesson_id, '14 CFR 91.126', 'required', 'Operations in Class G airspace at non-towered airports'),
(v_lesson_id, '14 CFR 91.127', 'required', 'Operations in Class E surface areas'),
(v_lesson_id, '14 CFR 91.129', 'required', 'Operations in Class D airspace'),
(v_lesson_id, '14 CFR 91.130', 'required', 'Operations in Class C airspace'),
(v_lesson_id, '14 CFR 91.131', 'required', 'Operations in Class B airspace'),
(v_lesson_id, '14 CFR 91.135', 'required', 'Operations in Class A airspace'),
(v_lesson_id, '14 CFR 91.155', 'required', 'VFR weather minimums for all airspace classes'),
(v_lesson_id, '14 CFR 91.157', 'required', 'Special VFR weather minimums'),
(v_lesson_id, '14 CFR 73', 'supplemental', 'Special use airspace - prohibited, restricted, warning areas'),
(v_lesson_id, 'AIM Chapter 3', 'supplemental', 'Airspace structure and classification');

-- =====================================================================
-- LESSON 30: Aeromedical Factors
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 30;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 61.23', 'required', 'Medical certificates: requirements and duration'),
(v_lesson_id, '14 CFR 61.53', 'required', 'Prohibition on operations during medical deficiency'),
(v_lesson_id, '14 CFR 67', 'required', 'Medical standards and certification'),
(v_lesson_id, '14 CFR 91.17', 'required', 'Alcohol and drugs - 8 hours bottle to throttle, 0.04% limit'),
(v_lesson_id, 'AIM Chapter 8', 'supplemental', 'Medical facts for pilots');

-- =====================================================================
-- LESSON 32: First Solo Flight
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 32;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 61.87', 'required', 'Solo requirements for student pilots - endorsements'),
(v_lesson_id, '14 CFR 61.89', 'required', 'General limitations on student pilots'),
(v_lesson_id, '14 CFR 61.93', 'required', 'Solo cross-country flight requirements');

-- =====================================================================
-- LESSON 37: Cross-Country Flight Planning
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 37;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 61.93', 'required', 'Solo cross-country flight requirements and endorsements'),
(v_lesson_id, '14 CFR 91.103', 'required', 'Preflight action for cross-country flights'),
(v_lesson_id, '14 CFR 91.151', 'required', 'VFR fuel requirements - day operations'),
(v_lesson_id, '14 CFR 91.159', 'required', 'VFR cruising altitude or flight level'),
(v_lesson_id, 'AIM Chapter 5-1', 'supplemental', 'Preflight planning - NOTAMs, weather, navigation');

-- =====================================================================
-- LESSON 43: Airspace and Communications
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 43;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.123', 'required', 'Compliance with ATC clearances and instructions'),
(v_lesson_id, '14 CFR 91.125', 'required', 'ATC light gun signals'),
(v_lesson_id, '14 CFR 91.127', 'required', 'Operations at airports in Class E airspace'),
(v_lesson_id, '14 CFR 91.129', 'required', 'Operations in Class D airspace'),
(v_lesson_id, '14 CFR 91.130', 'required', 'Operations in Class C airspace'),
(v_lesson_id, '14 CFR 91.131', 'required', 'Operations in Class B airspace'),
(v_lesson_id, '14 CFR 91.215', 'required', 'ATC transponder and altitude reporting requirements'),
(v_lesson_id, '14 CFR 91.225', 'required', 'ADS-B Out equipment and use'),
(v_lesson_id, 'AIM Chapter 4', 'supplemental', 'Air traffic control communications and procedures');

-- =====================================================================
-- LESSON 45: Electronic Navigation
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 45;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 91.171', 'required', 'VOR equipment check for IFR operations (awareness)'),
(v_lesson_id, '14 CFR 91.205', 'required', 'Required navigation equipment for VFR'),
(v_lesson_id, 'AIM Chapter 1', 'supplemental', 'Navigation aids - VOR, GPS, NDB');

-- =====================================================================
-- LESSON 52: Solo Long Cross-Country
-- =====================================================================
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 52;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 61.93', 'required', 'Solo cross-country requirements and endorsements'),
(v_lesson_id, '14 CFR 61.109', 'required', 'Aeronautical experience - 150nm cross-country requirement'),
(v_lesson_id, '14 CFR 91.103', 'required', 'Preflight action for cross-country'),
(v_lesson_id, '14 CFR 91.151', 'required', 'VFR fuel requirements');

-- =====================================================================
-- LESSON 53-55: Night Flying
-- =====================================================================
-- Lesson 53 (Ground)
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 53;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 61.57', 'required', 'Night currency requirements (3 takeoffs/landings to full stop)'),
(v_lesson_id, '14 CFR 91.205', 'required', 'Required equipment for VFR night operations'),
(v_lesson_id, '14 CFR 91.209', 'required', 'Aircraft lighting requirements for night flight'),
(v_lesson_id, 'AIM Chapter 8', 'supplemental', 'Night flying considerations and physiology');

-- Lesson 54-55
SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 54;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 61.109', 'required', 'Night flight requirements (3 hours, 10 takeoffs/landings)'),
(v_lesson_id, '14 CFR 91.151', 'required', 'VFR fuel requirements'),
(v_lesson_id, '14 CFR 91.209', 'required', 'Aircraft lighting'),
(v_lesson_id, '14 CFR 91.205', 'required', 'Required night equipment');

SELECT id INTO v_lesson_id FROM syllabus_lessons 
WHERE syllabus_id = v_syllabus_id AND order_index = 55;

INSERT INTO lesson_far_references (lesson_id, far_reference, reference_type, description) VALUES
(v_lesson_id, '14 CFR 61.109', 'required', 'Night cross-country requirement (100nm+)'),
(v_lesson_id, '14 CFR 91.103', 'required', 'Preflight action for night cross-country'),
(v_lesson_id, '14 CFR 91.151', 'required', 'VFR fuel requirements - night operations'),
(v_lesson_id, '14 CFR 91.155', 'required', 'VFR weather minimums at night'),
(v_lesson_id, '14 CFR 91.205', 'required', 'Required night equipment');

RAISE NOTICE 'Successfully added FAR references to Sporty''s syllabus lessons!';

END $$;

-- =====================================================================
-- VERIFICATION
-- =====================================================================

-- Count FAR references by lesson
SELECT 
  l.order_index,
  l.title,
  COUNT(lfr.id) as far_reference_count
FROM syllabus_lessons l
LEFT JOIN lesson_far_references lfr ON l.id = lfr.lesson_id
WHERE l.syllabus_id = (
  SELECT id FROM syllabi 
  WHERE title = 'Sporty''s Private Pilot Course - Part 61'
  ORDER BY created_at DESC LIMIT 1
)
GROUP BY l.order_index, l.title
HAVING COUNT(lfr.id) > 0
ORDER BY l.order_index;

-- Total FAR references created
SELECT COUNT(*) as total_far_references
FROM lesson_far_references
WHERE lesson_id IN (
  SELECT id FROM syllabus_lessons
  WHERE syllabus_id = (
    SELECT id FROM syllabi 
    WHERE title = 'Sporty''s Private Pilot Course - Part 61'
    ORDER BY created_at DESC LIMIT 1
  )
);
