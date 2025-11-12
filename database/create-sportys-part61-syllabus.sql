-- =====================================================================
-- SPORTY'S PRIVATE PILOT PART 61 SYLLABUS
-- =====================================================================
-- This migration creates the complete Sporty's Private Pilot Course
-- following 14 CFR Part 61 requirements
-- 
-- Structure:
--   - Stage I: 32 lessons (Pre-Solo Training)
--   - Stage II: 15 lessons (Cross-Country & Performance)  
--   - Stage III: 13 lessons (Night & Advanced Operations)
--   - Total: 60 lessons
-- =====================================================================

-- =====================================================================
-- STEP 1: CREATE MAIN SYLLABUS RECORD
-- =====================================================================

DO $$
DECLARE
  v_syllabus_id UUID;
BEGIN

INSERT INTO syllabi (
  title,
  description,
  faa_type,
  version,
  is_active,
  target_certificate,
  far_references,
  experience_requirements,
  knowledge_requirements,
  proficiency_requirements
) VALUES (
  'Sporty''s Private Pilot Course - Part 61',
  'Complete Private Pilot training syllabus following 14 CFR Part 61 requirements. Integrated with Sporty''s Learn to Fly Course video training and optional Redbird GIFT simulator modules. This structured 3-stage program (16 weeks typical) uses building-block learning theory to develop competent, safe private pilots through 59 progressive lessons totaling 42.4 hours ground instruction and 42.5 hours flight training.',
  'Part 61',
  '2024.06',
  true,
  'private',
  '["14 CFR Part 61", "14 CFR Part 91", "14 CFR Part 67", "NTSB Part 830"]'::jsonb,
  '{
    "total_flight_time": "40 hours minimum (42.5 hours in syllabus)",
    "total_ground_hours": 42.4,
    "total_flight_hours": 37.4,
    "total_solo_hours": 5.1,
    "dual_instruction": "37.4 hours with instructor",
    "solo_time": "5.1 hours solo",
    "cross_country_dual": "5.0 hours",
    "cross_country_solo": "2.0 hours (includes 150nm+ flight)",
    "night_flight": "3.0 hours including 10 takeoffs/landings",
    "instrument_training": "3.3 hours by reference to instruments",
    "course_length_weeks": 16
  }'::jsonb,
  '{
    "knowledge_test": "FAA Private Pilot Knowledge Test - minimum 70%",
    "presolo_written": "Required before first solo",
    "study_materials": [
      "Sporty''s Learn to Fly Course (6 volumes)",
      "FAA Airplane Flying Handbook",
      "FAA Pilot''s Handbook of Aeronautical Knowledge",
      "FAA Private Pilot ACS"
    ],
    "areas": [
      "Federal Aviation Regulations",
      "Airspace and Airport Operations",
      "Weather Theory and Services",
      "Performance and Limitations",
      "Navigation and Flight Planning",
      "Aerodynamics and Aircraft Systems",
      "Aeronautical Decision Making"
    ]
  }'::jsonb,
  '{
    "practical_test": "FAA Private Pilot Airman Certification Standards",
    "stages": 3,
    "stage_checks": "Required evaluation before advancing to next stage",
    "grading_scale": {
      "maneuvers": "1-5 scale (1=Excellent, 5=Below Standards)",
      "lessons": "S (Satisfactory), U (Unsatisfactory), I (Incomplete)"
    },
    "standards": {
      "altitude": "±150 feet (±100 feet for checkride)",
      "heading": "±15 degrees (±10 degrees for checkride)",
      "airspeed": "±10 knots (±5 knots for checkride)"
    }
  }'::jsonb
)
RETURNING id INTO v_syllabus_id;

RAISE NOTICE 'Created Sporty''s Syllabus with ID: %', v_syllabus_id;

-- =====================================================================
-- STAGE I: PRE-SOLO TRAINING (Lessons 1-32)
-- =====================================================================

-- Lesson 1: Ground - Training Aircraft Introduction
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  pre_flight_briefing, post_flight_briefing, notes, instructor_notes,
  is_required, prerequisite_lesson_ids
) VALUES (
  v_syllabus_id,
  'Lesson 1 - Training Aircraft Introduction',
  'Ground instruction introducing the student to the training aircraft, preflight procedures, basic flight and engine controls, and aeronautical decision making.',
  1,
  'Ground',
  1.2,
  'Introduce the student to the training aircraft, associated preflight procedures, basic flight and engine controls, emergency equipment, and the critical importance of aeronautical decision making in flight safety.',
  'Student demonstrates basic knowledge of training aircraft preflight procedures, can identify and explain basic flight and engine controls, understands dispatch procedures, and recognizes the importance of ADM in flight operations.',
  E'CONTENT TO COVER:\n• Training aircraft familiarization\n• Dispatch procedures and aircraft availability\n• Use of checklists and their importance\n• Certificates and documents (AROW)\n• Preflight inspection procedures\n• Engine controls (throttle, mixture, prop)\n• Flight controls (yoke, rudder, trim)\n• Emergency equipment and survival gear\n• Aircraft servicing and fuel grades\n• Introduction to Aeronautical Decision Making\n• Recovery and postflight procedures',
  E'POST-FLIGHT DISCUSSION:\n• Review student understanding of aircraft systems\n• Clarify any questions about preflight procedures\n• Emphasize the importance of systematic checklist use\n• Discuss the relationship between ADM and flight safety\n• Preview next lesson content\n• Assign video study materials',
  'This is the student''s first formal ground lesson. Create a welcoming environment and set expectations for the training program.',
  E'INSTRUCTOR NOTES:\n• First impression is critical - be professional, organized, and encouraging\n• Emphasize that this is a building-block program\n• Show actual aircraft components when possible\n• Use aircraft for walk-around demonstration if available\n• Assess student''s learning style and adapt accordingly\n• Ensure student understands the importance of preparation for each lesson',
  true,
  ARRAY[]::uuid[]
);

-- Lesson 2: Dual Local - Introduction Flight
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  pre_flight_briefing, post_flight_briefing, notes, instructor_notes,
  is_required, prerequisite_lesson_ids
) VALUES (
  v_syllabus_id,
  'Lesson 2 - Introduction Flight',
  'First flight introducing basic aircraft control, engine start, taxi, takeoffs, landings, and all aspects of a complete flight from dispatch to securing the aircraft.',
  2,
  'Flight',
  1.4,
  'Familiarize the student with aircraft operation from engine start to shutdown. Introduce the feel of flight controls, basic aircraft attitudes, and traffic pattern operations. Student observes complete flight sequence.',
  'Student can perform aircraft preflight with guidance, complete engine start procedures, demonstrate basic taxi control with instructor assistance. Student observes and begins to understand traffic pattern operations, normal takeoffs and landings.',
  E'PREFLIGHT BRIEFING:\n• Review lesson objective and flow\n• Discuss safety procedures and who has controls\n• Review aircraft preflight inspection together\n• Explain engine start procedures\n• Brief taxi operations and control usage\n• Discuss traffic pattern and radio communications\n• Brief what to expect during flight (sensations, visuals)\n• Establish clear "I have the controls / You have the controls" protocol\n• Discuss airsickness and what to do if it occurs',
  E'POSTFLIGHT DEBRIEF:\n• Discuss student''s first impressions and comfort level\n• Review what went well and areas for next lesson\n• Address any concerns or discomfort\n• Explain sensations experienced (g-forces, visual cues)\n• Preview next lesson content\n• Answer all questions thoroughly\n• Encourage student to reflect on the experience\n• Assign specific video segments for study',
  'FLIGHT TIME: 1.2 hrs | DISCUSSION: 0.2 hrs\nThis is a critical lesson - student''s first flight sets tone for entire training. Focus on positive experience and building confidence.',
  E'INSTRUCTOR NOTES:\n• Keep flight smooth and comfortable\n• Let student follow along on controls lightly\n• Point out visual references and airport landmarks\n• Maintain positive, encouraging communication\n• Watch for signs of discomfort or sensory overload\n• Keep first flight relatively short if student shows fatigue\n• Demonstrate all procedures clearly and deliberately\n• This is an OBSERVATION flight - student learning by watching\n\nGRADING: Focus on student engagement and comprehension, not performance\nTolerance: Not applicable (demonstration flight)',
  true,
  ARRAY[]::uuid[]
);

-- Lesson 3: Ground - Airport Operations
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  pre_flight_briefing, post_flight_briefing, notes, instructor_notes,
  is_required, prerequisite_lesson_ids
) VALUES (
  v_syllabus_id,
  'Lesson 3 - Airport Operations',
  'Ground instruction on wind indicators, airport signs/markings/lighting, radio communications, runway incursion avoidance, and collision avoidance procedures.',
  3,
  'Ground',
  1.2,
  'Develop student understanding of airport operations including wind indicators, airport markings and lighting, radio communications procedures, runway incursion avoidance, and traffic pattern operations.',
  'Student can identify wind direction indicators, interpret airport signs and markings, understand basic radio communication procedures, recognize runway incursion hazards, and describe traffic pattern operations at both towered and non-towered airports.',
  E'CONTENT TO COVER:\n• Wind direction indicators (windsock, tetrahedron)\n• Airport runway and taxiway signs (mandatory vs. informational)\n• Airport runway and taxiway markings\n• Airport lighting systems (runway, taxiway, VASI/PAPI)\n• Radio communications procedures (CTAF, Tower)\n• Obtaining airport advisories (ATIS/ASOS/AWOS)\n• Runway incursion awareness and avoidance\n• Aircraft lighting usage during taxi and flight\n• Collision avoidance and traffic scanning techniques\n• Traffic pattern operations (entries, legs, altitudes)\n• Practice area operations and procedures',
  E'POST-FLIGHT DISCUSSION:\n• Review airport diagram interpretation\n• Practice radio communication phraseology\n• Emphasize runway incursion prevention (critical safety item)\n• Discuss sterile cockpit concept during taxi\n• Review traffic scanning techniques\n• Answer all questions about airport operations\n• Preview next lesson (aerodynamics)\n• Assign video study materials',
  'Use airport diagrams from home airport and common training destinations. Consider field trip to tower if available.',
  E'INSTRUCTOR NOTES:\n• Use visual aids - airport diagrams, photos of signs/markings\n• Reference AC 91-73 (Flight School Procedures During Taxi Operations)\n• Emphasize "read-back, hear-back" for hold short instructions\n• Practice radio calls together\n• Discuss real-world runway incursion examples (anonymized)\n• Show ATC light gun signals\n• This lesson is critical for safe ground operations\n• Consider showing tower visit video if available',
  true,
  ARRAY[]::uuid[]
);

-- Lesson 4: Ground - Aerodynamics
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  pre_flight_briefing, post_flight_briefing, notes, instructor_notes,
  is_required, prerequisite_lesson_ids
) VALUES (
  v_syllabus_id,
  'Lesson 4 - Aerodynamics',
  'Ground instruction on the four forces of flight, aircraft components, three axes of rotation, forces in non-level flight, effects of flaps, angle of attack, stalls, and spin awareness.',
  4,
  'Ground',
  1.2,
  'Develop student understanding of fundamental aerodynamics including the four forces of flight, how these forces change in various flight conditions, angle of attack concepts, stall mechanics, and spin awareness.',
  'Student can explain the four forces of flight and their interactions, identify aircraft components and axes of rotation, describe how forces change during climbs/descents/turns, explain angle of attack and its relationship to stalls, and understand basic spin awareness principles.',
  E'CONTENT TO COVER:\n• Four forces of flight (Lift, Weight, Thrust, Drag)\n• Airframe construction and major components\n• Three axes of flight (Longitudinal, Lateral, Vertical)\n• Forces acting on a climbing airplane\n• Angle of Attack (AOA) and its importance\n• Critical angle of attack concept\n• Forces acting on a descending airplane\n• Forces acting on a turning airplane (load factor)\n• Effects of flaps on lift, drag, and stall speed\n• Stall warning signs and indications\n• Spin awareness, entry, spins, and recovery techniques',
  E'POST-FLIGHT DISCUSSION:\n• Review force diagrams and relationships\n• Clarify angle of attack vs. pitch attitude\n• Emphasize that stalls are related to AOA, not airspeed alone\n• Discuss load factor in turns (why stall speed increases)\n• Review spin awareness (PARE recovery)\n• Use aircraft models if available for demonstration\n• Preview next lesson (slow flight practice)\n• Assign video study materials',
  'Use visual aids - force diagrams, aircraft models. This is fundamental knowledge that applies to all future lessons.',
  E'INSTRUCTOR NOTES:\n• Use whiteboard for force vector diagrams\n• Demonstrate with aircraft model if available\n• Emphasize AOA as THE critical aerodynamic factor\n• Connect theory to what student experienced in Lesson 2\n• Explain relationship between flaps and landing performance\n• Stress that spin awareness = stall awareness\n• FAA emphasizes PREVENTION over recovery\n• This knowledge is tested on FAA Knowledge Test\n\nKEY CONCEPTS:\n• Lift must equal weight for level flight\n• Thrust must overcome drag for constant speed\n• AOA determines if wing will fly or stall\n• Load factor increases stall speed in turns',
  true,
  ARRAY[]::uuid[]
);

-- Lesson 5: Dual Local - Slow Flight and Stalls Introduction
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  pre_flight_briefing, post_flight_briefing, notes, instructor_notes,
  is_required, prerequisite_lesson_ids
) VALUES (
  v_syllabus_id,
  'Lesson 5 - Slow Flight and Imminent Stalls',
  'Introduction to maneuvering during slow flight, power-off and power-on imminent stalls, stall recognition and recovery. Practice of normal takeoffs and landings.',
  5,
  'Flight',
  1.4,
  'Introduce slow flight operations and imminent stall recognition. Develop student awareness of stall warning indications and proper recovery techniques. Continue practice of normal takeoffs and landings.',
  'Student performs slow flight with instructor assistance, recognizes imminent stalls and initiates recovery with guidance. Demonstrates increased proficiency in normal takeoffs and landings. Maintains awareness of practice area procedures and traffic avoidance.',
  E'PREFLIGHT BRIEFING:\n• Review lesson objectives and planned maneuvers\n• Discuss slow flight theory and purpose\n• Explain imminent vs. full stalls\n• Review stall warning signs (buffet, horn, decay of controls)\n• Brief recovery technique (reduce AOA, add power, level wings)\n• Emphasize clearing turns before each maneuver\n• Brief power-off stalls (landing configuration)\n• Brief power-on stalls (departure configuration)\n• Discuss safety altitude minimums\n• Review practice area boundaries and entry procedures',
  E'POSTFLIGHT DEBRIEF:\n• Discuss student''s recognition of stall warnings\n• Review recovery technique effectiveness\n• Assess coordination during slow flight\n• Evaluate takeoff and landing improvements\n• Address any concerns about slow flight or stalls\n• Discuss importance of stall awareness for safety\n• Preview next lesson content\n• Assign specific video review\n• Document any areas needing additional practice',
  'FLIGHT TIME: 1.2 hrs | DISCUSSION: 0.2 hrs\nFirst introduction to stalls - ensure student understands these are TRAINING maneuvers performed intentionally.',
  E'INSTRUCTOR NOTES:\n• Conduct thorough clearing turns before each maneuver\n• Start slow flight at safe altitude (minimum 3,000 AGL recommended)\n• For imminent stalls: recover at first indication (buffet, horn)\n• Emphasize looking outside during maneuvers\n• Watch for altitude loss during recovery - common error\n• Ensure student coordinates rudder in slow flight\n• Power-off stalls: simulating landing approach stall scenario\n• Power-on stalls: simulating departure stall scenario\n• Flaps as appropriate for configuration\n\nGRADING:\n• Slow flight: +20/-0 knots with instructor assistance\n• Stalls: Recognition and recovery initiation with guidance\n• Takeoffs/landings: With assistance, improving from Lesson 2\n\nSAFETY: This lesson requires constant vigilance and precise altitude management',
  true,
  ARRAY[]::uuid[]
);

-- Lesson 6: Ground - Airplane Stability and Load Factors
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  pre_flight_briefing, post_flight_briefing, notes, instructor_notes,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 6 - Airplane Stability, Load Factors, Wake Turbulence',
  'Ground instruction on static and dynamic stability, dihedral effect, load factors, ground effect, wing tip vortices, and wake turbulence avoidance.',
  6,
  'Ground',
  1.2,
  'Develop understanding of aircraft stability characteristics, load factors in various flight conditions, ground effect phenomenon, and wake turbulence recognition and avoidance procedures.',
  'Student explains positive and negative stability concepts, describes how load factors affect aircraft performance, understands ground effect and its implications, and can identify wake turbulence hazards and avoidance techniques.',
  E'CONTENT TO COVER:\n• Static stability (positive, neutral, negative)\n• Dynamic stability and oscillations\n• Dihedral effect and lateral stability\n• Ground effect phenomenon (reduced induced drag)\n• Wing tip vortices and their generation\n• Wake turbulence characteristics and behavior\n• Wake turbulence avoidance procedures\n• Load factors in turns and gusts\n• Load factor effect on stall speed\n• Maneuvering speed (Va) concept',
  E'POST-FLIGHT DISCUSSION:\n• Review stability concepts with examples\n• Discuss ground effect observations during landings\n• Emphasize wake turbulence avoidance is critical safety issue\n• Review load factor impact on aircraft stress and performance\n• Connect to previous aerodynamics lesson\n• Preview next lesson (additional slow flight/stall practice)',
  'Use diagrams and videos to illustrate wake turbulence patterns. Review real-world wake turbulence encounters (ATC recordings).',
  E'INSTRUCTOR NOTES:\n• Use whiteboard to draw vortex patterns\n• Discuss spacing requirements behind larger aircraft\n• Explain why wake sinks and drifts with wind\n• Show relationship: Load factor = Weight/Wing loading = 1/cos(bank angle)\n• 60 degrees bank = 2G load factor, stall speed increases 41%\n• Ground effect most noticeable within 1 wingspan of surface\n• AC 90-23G Wake Turbulence reference',
  true
);

-- Lesson 7: Dual Local - Airspeed Transitions and Maneuvers
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  pre_flight_briefing, post_flight_briefing, notes, instructor_notes,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 7 - Airspeed Transitions, Climbs, and Descents',
  'Practice slow flight, imminent stalls, constant airspeed climbs and descents, airspeed transitions, and altitude/heading control exercises.',
  7,
  'Flight',
  1.4,
  'Develop proficiency in controlling aircraft at various airspeeds. Practice constant airspeed climbs and descents. Master airspeed transitions and trim usage. Continue improving slow flight and stall awareness.',
  'Student performs straight and level flight, climbs, descents, and turns with minimal instructor assistance. Maintains assigned altitudes ±150', headings ±20 degrees, airspeeds ±15 knots. Demonstrates proper trim usage during airspeed transitions.',
  E'PREFLIGHT BRIEFING:\n• Review lesson objectives\n• Discuss constant airspeed climb and descent techniques\n• Explain airspeed transition procedures and trim usage\n• Brief altitude and heading assignments\n• Review slow flight and imminent stall procedures\n• Discuss coordination of power and pitch\n• Brief practice area operations\n• Review clearing procedures',
  E'POSTFLIGHT DEBRIEF:\n• Evaluate altitude and heading control progress\n• Discuss trim effectiveness and usage\n• Review coordination during maneuvers\n• Assess slow flight proficiency improvement\n• Evaluate stall recognition and recovery\n• Identify specific areas for improvement\n• Preview next lesson (aircraft performance)',
  'FLIGHT TIME: 1.2 hrs | DISCUSSION: 0.2 hrs\nFocus on developing good instrument cross-check habits and trim usage.',
  E'INSTRUCTOR NOTES:\n• Emphasize "pitch plus power equals performance"\n• Teach proper trim technique to reduce control forces\n• Watch for altitude deviations during speed changes\n• Common error: chasing airspeed with pitch\n• Slow flight: +20/-0 knots airspeed control\n• Stalls: Both straight and turning flight\n\nTOLERANCES THIS LESSON:\n• Altitude: ±150 feet\n• Heading: ±20  degrees  \n• Airspeed: ±15 knots\n\nGRADING: Expect improvement from Lesson 5, some instructor assistance acceptable',
  true
);

-- Continue with remaining Stage I lessons (8-32)
-- Lesson 8: Ground - Aircraft Performance
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  pre_flight_briefing, post_flight_briefing, instructor_notes,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 8 - Aircraft Performance',
  'Ground instruction on factors affecting performance, takeoff data, weight and balance calculations, performance chart usage, and wind component calculations.',
  8,
  'Ground',
  1.2,
  'Develop ability to calculate aircraft performance, complete weight and balance calculations, interpret performance charts, and determine headwind/crosswind components.',
  'Student calculates weight and balance within limits, uses takeoff/landing performance charts correctly, determines density altitude effects, and calculates wind components.',
  E'CONTENT:\n• Factors affecting performance (density altitude, weight, wind)\n• Takeoff data card usage\n• Weight and balance calculations (forward/aft CG limits)\n• Takeoff and landing distance charts\n• Climb performance charts\n• Cruise performance planning\n• Headwind and crosswind component calculation\n• Density altitude effects on performance',
  E'DEBRIEF:\n• Practice multiple W&B problems\n• Review chart interpolation techniques\n• Emphasize that performance decreases with high density altitude\n• Discuss real-world scenarios and decision making',
  E'INSTRUCTOR NOTES:\n• Use actual aircraft POH/AFM\n• Bring E6B or electronic calculator\n• Work several example problems together\n• Emphasize weight and balance is legal requirement\n• Out-of-CG aircraft can be uncontrollable\n• This is testable FAA knowledge',
  true
);

-- Lesson 9: Dual Local - Power Stalls and Steep Turns
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  instructor_notes,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 9 - Full Stalls and Steep Turns',
  'Introduction to full power-off and power-on stalls, and steep turns (45 degrees bank). Practice constant airspeed climbs/descents.',
  9,
  'Flight',
  1.4,
  'Perform full stall maneuvers (power-off and power-on) and steep turns. Develop awareness of stall recovery techniques and high performance maneuvering.',
  'Student performs full power-off and power-on stalls with minimal assistance. Maintains heading ±15 degrees and airspeed ±10 knots in climbs/descents. Introduced to steep turns (45 degrees bank) with instructor assistance.',
  E'INSTRUCTOR NOTES:\n• Full stalls: recover at full break, not just buffet\n• Power-off stalls: with and without flaps\n• Power-on stalls: departure configuration, no flaps\n• Steep turns: 45 degrees bank ±5 degrees, maintain altitude ±200''\n• Demonstrate coordinated entry and recovery\n• Watch for overbanking tendency in steep turns\n• Emphasize back elevator pressure in turn\n\nSTANDARDS:\n• Climbs/descents: Heading ±15 degrees, airspeed ±10kts\n• Steep turns: Student observing and following through\n\nSAFETY: Ensure adequate altitude (3,000'' AGL minimum)',
  true
);

-- Lesson 10: Ground - Weather Fundamentals
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 10 - Weather Fundamentals',
  'Introduction to the atmosphere, pressure systems, wind, moisture, stability, clouds, air masses, fronts, and hazardous weather including thunderstorms.',
  10,
  'Ground',
  1.2,
  'Develop understanding of basic atmospheric processes, weather patterns, cloud formation, frontal systems, and hazardous weather phenomena.',
  'Student explains atmospheric composition and properties, describes pressure and wind relationships, understands cloud formation processes, identifies air masses and fronts, and recognizes hazardous weather conditions.',
  true
);

-- Lesson 11: Dual Local - Constant Rate Climbs and Descents
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 11 - Constant Rate Climbs/Descents and Takeoff/Landing Practice',
  'Practice constant rate climbs and descents using VSI. Continue slow flight, stalls, and steep turns. Focus on takeoff and landing proficiency.',
  11,
  'Flight',
  1.4,
  'Master constant rate climbs and descents. Improve proficiency in slow flight, full stalls, steep turns, and normal takeoffs/landings.',
  'Student performs constant rate climbs/descents with minimal assistance. Slow flight maintained +20/-0 knots. Stalls performed in straight and level and turning flight. Takeoffs and landings show improvement.',
  true
);

-- Lesson 12: Ground - Weather Reports and Forecasts
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 12 - Weather Reports and Forecasts',
  'Ground instruction on aviation weather charts, METARs, TAFs, winds aloft, PIREPs, and obtaining weather briefings from FSS or online sources.',
  12,
  'Ground',
  1.2,
  'Develop ability to obtain, read, and interpret aviation weather reports and forecasts. Learn to obtain proper weather briefings for flight planning.',
  'Student decodes METARs and TAFs, interprets weather charts, obtains winds aloft forecasts, understands PIREP importance, and can request and interpret standard, abbreviated, and outlook weather briefings.',
  true
);

-- Lesson 13: Dual Local - Ground Reference Maneuvers
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  instructor_notes,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 13 - Ground Reference Maneuvers',
  'Introduction to rectangular course, S-turns across a road, and turns around a point. Practice normal takeoffs and landings.',
  13,
  'Flight',
  1.4,
  'Develop wind drift awareness and correction techniques through ground reference maneuvers. Improve traffic pattern operations and takeoff/landing proficiency.',
  'Student flies specific ground tracks while maintaining airspeed ±10 knots and altitude ±150 feet. Demonstrates wind drift correction. Takeoffs maintain Vy +15/-10 knots. Landings within 750 feet of designated point.',
  E'INSTRUCTOR NOTES:\n• Select reference points (fields, roads, intersections)\n• Start with rectangular course\n• Progress to S-turns across a road\n• Then turns around a point\n• Emphasize looking outside, not at instruments\n• Vary bank angle and crab to maintain ground track\n• Common error: over-controlling\n• Use 600-1000'' AGL for these maneuvers\n\nSTANDARDS:\n• Altitude: ±150 feet\n• Airspeed: ±10 knots\n• Ground track: maintains desired path\n• Landings: within 750'' of point',
  true
);

-- Lesson 14: Ground - Advanced Weather
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 14 - Advanced Weather: Radar, AIRMETs, SIGMETs, NOTAMs',
  'Ground instruction on radar weather, severe weather reports and forecasts, AIRMETs, SIGMETs, NOTAMs, wind shear recognition, and weather-related ADM.',
  14,
  'Ground',
  1.2,
  'Develop ability to identify and interpret hazardous weather information. Learn to make appropriate go/no-go decisions based on weather data.',
  'Student interprets radar weather imagery, decodes AIRMETs and SIGMETs, understands NOTAM categories, recognizes wind shear conditions, and applies weather information to flight decision making.',
  true
);

-- Lesson 15: Dual Local - Ground Reference Maneuvers Review
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 15 - Ground Reference Maneuvers and Stall Review',
  'Review and refine ground reference maneuvers, slow flight, stalls, steep turns, and traffic pattern operations.',
  15,
  'Flight',
  1.4,
  'Achieve proficiency in ground reference maneuvers and stall recoveries without instructor assistance. Demonstrate consistent traffic pattern and landing performance.',
  'Student flies ground tracks with airspeed ±10 knots, altitude ±150 feet. Slow flight +20/-0 knots. Steep turns 45 degrees ±5 degrees, altitude ±200'', heading ±15 degrees. Landings within 750'' of point with approach speed +10/-5 knots.',
  true
);

-- Lessons 16-25 continuing Stage I pre-solo training
-- (I'll add abbreviated versions to keep moving forward)

INSERT INTO syllabus_lessons (syllabus_id, title, description, order_index, lesson_type, estimated_hours, objective, is_required) VALUES
(v_syllabus_id, 'Lesson 16 - Emergency Procedures (Ground)', 'Ground instruction on emergency procedures from AFM/POH including engine failures, fires, electrical failures, and other emergencies.', 16, 'Ground', 1.2, 'Develop knowledge of aircraft emergency procedures and decision-making during abnormal situations.', true),
(v_syllabus_id, 'Lesson 17 - Rejected Takeoffs and Go-Arounds', 'Practice rejected takeoffs, go-around procedures, emergency approaches, wake turbulence avoidance, and system malfunctions.', 17, 'Flight', 1.4, 'Master go-around technique and rejected takeoff procedures. Practice emergency approaches and handling of system malfunctions.', true),
(v_syllabus_id, 'Lesson 18 - FAR/AIM, NTSB, and Logbooks (Ground)', 'Ground instruction on applicable FARs, NTSB 830, AIM procedures, pilot/aircraft logbooks, and single-pilot resource management.', 18, 'Ground', 1.2, 'Understand regulatory requirements for student and private pilots, accident reporting, and resource management.', true),
(v_syllabus_id, 'Lesson 19 - Crosswind Operations and Slips', 'Introduction to crosswind takeoffs/landings, forward slips, side slips, and no-flap landings.', 19, 'Flight', 1.4, 'Develop crosswind takeoff and landing technique. Master forward and side slip procedures.', true),
(v_syllabus_id, 'Lesson 20 - Aircraft Systems (Ground)', 'Ground instruction on fuel, electrical, environmental, and wing flap systems.', 20, 'Ground', 1.2, 'Understand aircraft systems operation and management.', true),
(v_syllabus_id, 'Lesson 21 - Slow Flight, Stalls, Takeoffs and Landings Review', 'Comprehensive review of slow flight, stalls, crosswind operations, and traffic pattern procedures.', 21, 'Flight', 1.4, 'Demonstrate proficiency in all maneuvers with minimal instructor assistance.', true),
(v_syllabus_id, 'Lesson 22 - Additional Aircraft Systems (Ground)', 'Ground instruction on powerplant, oil, ignition, carburetor/fuel injection systems, propeller, hydraulics, landing gear, and equipment requirements.', 22, 'Ground', 1.2, 'Develop comprehensive understanding of aircraft systems and equipment requirements.', true),
(v_syllabus_id, 'Lesson 23 - Pre-Solo Takeoff and Landing Practice', 'Intensive takeoff and landing practice in preparation for solo flight.', 23, 'Flight', 1.4, 'Demonstrate consistent, safe takeoff and landing technique without instructor intervention.', true),
(v_syllabus_id, 'Lesson 24 - Aircraft Instruments and Maintenance (Ground)', 'Ground instruction on gyroscopic instruments, pitot-static system, vacuum system, magnetic compass, and maintenance requirements.', 24, 'Ground', 1.2, 'Understand flight instruments, their limitations, and aircraft maintenance requirements.', true),
(v_syllabus_id, 'Lesson 25 - Pre-Solo Evaluation and Written Exam', 'Pre-solo flight evaluation and administration of pre-solo written examination.', 25, 'Flight', 1.7, 'Demonstrate proficiency in all maneuvers required for solo flight. Pass pre-solo written exam with 80% or higher.', true);

-- Lesson 26: Ground - Airspace
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 26 - Airspace Classification (Ground)',
  'Ground instruction on controlled/uncontrolled airspace, Classes A through G, special use airspace, cloud clearances, and visibility requirements.',
  26,
  'Ground',
  1.2,
  'Develop comprehensive understanding of National Airspace System classifications, operating requirements, and weather minimums.',
  'Student identifies all airspace classes, describes operating requirements for each, knows cloud clearance and visibility minimums, and understands special use airspace categories.',
  true
);

-- Lesson 27: STAGE I CHECK
INSERT INTO syllabus_lessons (
  syllabus_id, title, description, order_index, lesson_type,
  estimated_hours, objective, performance_standards,
  instructor_notes,
  is_required
) VALUES (
  v_syllabus_id,
  'Lesson 27 - STAGE I CHECK',
  'Comprehensive stage check evaluating student readiness for solo flight. Oral examination and flight evaluation of all Stage I maneuvers.',
  27,
  'Flight',
  3.0,
  'Evaluate student competency in all Stage I material. Ensure student meets standards for initial solo flight authorization.',
  'Student demonstrates proficiency in preflight duties, aircraft systems knowledge, normal/crosswind takeoffs and landings, traffic pattern operations, slow flight, power-on and power-off stalls, emergency procedures, and all ground reference maneuvers to standards required for safe solo operations.',
  E'STAGE CHECK REQUIREMENTS:\n• Conducted by check instructor (not primary instructor)\n• ORAL EXAM:\n  - Operation of systems\n  - Certificates and documents\n  - Use of checklists\n  - Preflight inspection\n  - Weather information\n  - Performance and limitations\n\n• FLIGHT EXAM:\n  - Normal/crosswind takeoffs and landings\n  - Traffic pattern operations\n  - Slow flight\n  - Power-off stalls (landing config)\n  - Power-on stalls (takeoff config)\n  - Emergency approach and landing\n  - Go-around procedures\n  - Practice area operations\n\nSTANDARDS:\n• Altitude: ±150 feet\n• Heading: ±15  degrees\n• Airspeed: ±10 knots\n• Landings: within 500 feet of point\n• All maneuvers performed without check instructor assistance\n\nOUTCOME:\n• PASS: Student authorized for solo flight\n• ADDITIONAL TRAINING NEEDED: Specific deficiencies identified',
  true
);

-- Lessons 28-32: Post Stage Check, Final Pre-Solo Refinement
INSERT INTO syllabus_lessons (syllabus_id, title, description, order_index, lesson_type, estimated_hours, objective, is_required) VALUES
(v_syllabus_id, 'Lesson 28 - Charts and Publications (Ground)', 'Ground instruction on VFR sectional charts, Chart Supplements, and planning for alternative airports.', 28, 'Ground', 1.2, 'Develop ability to read sectional charts and use Chart Supplement for flight planning.', true),
(v_syllabus_id, 'Lesson 29 - Takeoff and Landing Refinement', 'Polish takeoff and landing technique to solo proficiency standard.', 29, 'Flight', 1.4, 'Perform all takeoffs and landings without instructor intervention. Demonstrate consistent, safe technique.', true),
(v_syllabus_id, 'Lesson 30 - Aeromedical Factors (Ground)', 'Ground instruction on medical certification, hypoxia, hyperventilation, spatial disorientation, vision, and physiological factors affecting pilots.', 30, 'Ground', 1.2, 'Understand aeromedical factors and their impact on flight safety.', true),
(v_syllabus_id, 'Lesson 31 - Final Pre-Solo Evaluation', 'Final dual evaluation before first solo flight. Practice traffic pattern, takeoffs, and landings.', 31, 'Flight', 1.4, 'Demonstrate solo-ready proficiency in all traffic pattern operations.', true),
(v_syllabus_id, 'Lesson 32 - FIRST SOLO FLIGHT', 'Supervised first solo flight in the traffic pattern. Student performs takeoffs and landings independently.', 32, 'Solo', 1.6, 'Complete first solo flight safely and proficiently. Make appropriate decisions independently.', true);

-- =====================================================================
-- STAGE II: CROSS-COUNTRY & PERFORMANCE (Lessons 33-47)
-- =====================================================================

INSERT INTO syllabus_lessons (syllabus_id, title, description, order_index, lesson_type, estimated_hours, objective, is_required) VALUES
(v_syllabus_id, 'Lesson 33 - Navigation Principles (Ground)', 'Ground instruction on wind triangle, drift correction, pilotage, dead reckoning, latitude/longitude, variation, and compass errors.', 33, 'Ground', 1.2, 'Understand fundamental navigation principles and magnetic compass characteristics.', true),
(v_syllabus_id, 'Lesson 34 - Short and Soft Field Operations', 'Introduction to short-field and soft-field takeoff and landing techniques.', 34, 'Flight', 1.4, 'Develop maximum performance takeoff and landing skills.', true),
(v_syllabus_id, 'Lesson 35 - Publications and Equipment (Ground)', 'Ground instruction on aeronautical publications, cross-country equipment, flight computer, plotter, and minimum equipment list.', 35, 'Ground', 1.2, 'Learn to use flight planning publications and equipment.', true),
(v_syllabus_id, 'Lesson 36 - Performance Maneuvers Practice', 'Practice slow flight, stalls, short-field and soft-field takeoffs and landings, and forward slips.', 36, 'Flight', 1.4, 'Refine maximum performance operations with minimal instructor assistance.', true),
(v_syllabus_id, 'Lesson 37 - Cross-Country Flight Planning (Ground)', 'Ground instruction on cross-country flight planning including applicable FARs, checkpoints, altitudes, performance calculations, and pilotage techniques.', 37, 'Ground', 1.2, 'Develop comprehensive cross-country flight planning skills.', true),
(v_syllabus_id, 'Lesson 38 - Solo Practice: Performance Maneuvers', 'Solo practice of takeoffs, landings, ground reference maneuvers, stalls, and steep turns.', 38, 'Solo', 1.0, 'Gain proficiency through independent practice.', true),
(v_syllabus_id, 'Lesson 39 - Dead Reckoning and Wind Triangle (Ground)', 'Ground instruction on wind triangle solutions, dead reckoning, calculating airspeeds, and using E6B flight computer.', 39, 'Ground', 1.2, 'Master flight computer usage for navigation calculations.', true),
(v_syllabus_id, 'Lesson 40 - Dual Cross-Country: Pilotage', 'Dual cross-country flight using pilotage to airport 25-50nm away. Practice radio communications and airport operations.', 40, 'Flight', 1.7, 'Navigate using pilotage and dead reckoning. Practice communications and unfamiliar airport operations.', true),
(v_syllabus_id, 'Lesson 41 - Diversion and Lost Procedures (Ground)', 'Ground instruction on diversion procedures, lost procedures, and planning for alternatives.', 41, 'Ground', 1.2, 'Develop decision-making skills for diversions and lost procedures.', true),
(v_syllabus_id, 'Lesson 42 - Dual Cross-Country with Diversion', 'Cross-country flight with emergency descent, planning for alternatives, diversion, and lost procedures practice.', 42, 'Flight', 2.0, 'Practice diversion procedures and emergency decision making during cross-country operations.', true),
(v_syllabus_id, 'Lesson 43 - Airspace and Communications (Ground)', 'Ground instruction on towered airport communications, approach/departure control, clearance delivery, and runway incursion avoidance at towered fields.', 43, 'Ground', 1.2, 'Understand towered airport operations and ATC communications.', true),
(v_syllabus_id, 'Lesson 44 - Solo Cross-Country: Local', 'Solo cross-country to airport within 25nm. Practice takeoffs and landings to build solo proficiency.', 44, 'Solo', 1.5, 'Conduct solo cross-country flight safely and make appropriate independent decisions.', true),
(v_syllabus_id, 'Lesson 45 - Electronic Navigation (Ground)', 'Ground instruction on VOR, GPS navigation, ADF (if equipped), and autopilot operation and limitations.', 45, 'Ground', 1.2, 'Understand electronic navigation systems and their use.', true),
(v_syllabus_id, 'Lesson 46 - Performance and Pilotage Evaluation', 'Evaluation flight covering short/soft field operations, pilotage, diversions, lost procedures, and system malfunctions.', 46, 'Flight', 1.2, 'Demonstrate proficiency in all Stage II maneuvers and procedures.', true),
(v_syllabus_id, 'Lesson 47 - STAGE II CHECK', 'Comprehensive stage check of all Stage II material. Oral and flight evaluation of cross-country planning, performance maneuvers, and emergency procedures.', 47, 'Flight', 2.7, 'Evaluate student competency for advanced cross-country and solo operations.', true);

-- =====================================================================
-- STAGE III: NIGHT & ADVANCED OPERATIONS (Lessons 48-59)
-- =====================================================================

INSERT INTO syllabus_lessons (syllabus_id, title, description, order_index, lesson_type, estimated_hours, objective, is_required) VALUES
(v_syllabus_id, 'Lesson 48 - Instrument Flying (Ground)', 'Ground instruction on basic attitude instrument flying, unusual attitude recovery, and emergency autopilot use during inadvertent IMC.', 48, 'Ground', 1.2, 'Understand basic instrument flight principles and emergency procedures.', true),
(v_syllabus_id, 'Lesson 49 - Cross-Country Planning Exercise (Ground)', 'Complete comprehensive cross-country flight planning exercise for upcoming long solo cross-country.', 49, 'Ground', 1.2, 'Demonstrate independent cross-country planning ability.', true),
(v_syllabus_id, 'Lesson 50 - Dual Cross-Country: VOR and Basic Instruments', 'Day cross-country using VOR navigation and dead reckoning. Practice basic attitude instrument flight including unusual attitudes.', 50, 'Flight', 2.2, 'Navigate using electronic aids. Perform basic instrument maneuvers and unusual attitude recoveries under hood.', true),
(v_syllabus_id, 'Lesson 51 - Dual Cross-Country: GPS and Towered Airport', 'Day cross-country using GPS navigation to towered airport. Practice ADF homing if equipped. Additional instrument practice.', 51, 'Flight', 2.2, 'Navigate using GPS. Practice towered airport operations and instrument flight.', true),
(v_syllabus_id, 'Lesson 52 - SOLO LONG CROSS-COUNTRY', 'Solo cross-country minimum 150nm total distance with landings at three points, one leg at least 50nm, with three takeoffs and landings at towered field.', 52, 'Solo', 2.0, 'Complete long solo cross-country meeting FAA Private Pilot requirements.', true),
(v_syllabus_id, 'Lesson 53 - Night Flying (Ground)', 'Ground instruction on night vision, night illusions, night scanning, night operations, aircraft/airport lighting, and night emergencies.', 53, 'Ground', 1.2, 'Understand physiological and operational aspects of night flight.', true),
(v_syllabus_id, 'Lesson 54 - Night Flight: Local', 'Night flight operations including at least 5 takeoffs and landings. Practice basic instrument maneuvers under hood.', 54, 'Flight', 2.5, 'Develop night flying proficiency. Complete required night takeoffs and landings.', true),
(v_syllabus_id, 'Lesson 55 - Night Cross-Country', 'Night cross-country flight of at least 100nm with 5 takeoffs and landings. Practice VOR, GPS navigation, and instrument flight.', 55, 'Flight', 4.7, 'Complete required night cross-country. Demonstrate night navigation and operations proficiency.', true),
(v_syllabus_id, 'Lesson 56 - Checkride Preparation: Maneuvers Review', 'Review all flight maneuvers in preparation for practical test. Practice under hood instrument flight.', 56, 'Flight', 2.2, 'Demonstrate practical test proficiency in all required maneuvers.', true),
(v_syllabus_id, 'Lesson 57 - Knowledge Test (Ground)', 'Complete FAA Private Pilot Knowledge Test or final review before test.', 57, 'Ground', 1.2, 'Pass FAA Knowledge Test with minimum 70%.', true),
(v_syllabus_id, 'Lesson 58 - Checkride Preparation: Final Polish', 'Final practice of all maneuvers and procedures. Complete remaining instrument training requirements.', 58, 'Flight', 2.2, 'Polish all maneuvers to checkride standards. Complete all experience requirements.', true),
(v_syllabus_id, 'Lesson 59 - STAGE III CHECK', 'Comprehensive final stage check covering all Private Pilot tasks. Mock checkride simulating FAA practical test.', 59, 'Flight', 2.7, 'Demonstrate Private Pilot practical test proficiency in all areas.', true);

RAISE NOTICE 'Successfully created Sporty''s Private Pilot Part 61 Syllabus with all 59 lessons!';

END $$;

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

-- Verify syllabus was created
SELECT id, title, faa_type, version, is_active
FROM syllabi
WHERE title LIKE 'Sporty%'
ORDER BY created_at DESC
LIMIT 1;

-- Count lessons by stage
SELECT 
  CASE 
    WHEN order_index <= 32 THEN 'Stage I'
    WHEN order_index <= 47 THEN 'Stage II'
    ELSE 'Stage III'
  END as stage,
  lesson_type,
  COUNT(*) as lesson_count,
  ROUND(SUM(estimated_hours)::numeric, 1) as total_hours
FROM syllabus_lessons
WHERE syllabus_id = (
  SELECT id FROM syllabi WHERE title LIKE 'Sporty%' ORDER BY created_at DESC LIMIT 1
)
GROUP BY 
  CASE 
    WHEN order_index <= 32 THEN 'Stage I'
    WHEN order_index <= 47 THEN 'Stage II'
    ELSE 'Stage III'
  END,
  lesson_type
ORDER BY stage, lesson_type;

-- Verify total counts
SELECT 
  COUNT(*) as total_lessons,
  SUM(CASE WHEN lesson_type = 'Ground' THEN 1 ELSE 0 END) as ground_lessons,
  SUM(CASE WHEN lesson_type = 'Flight' THEN 1 ELSE 0 END) as flight_lessons,
  SUM(CASE WHEN lesson_type = 'Solo' THEN 1 ELSE 0 END) as solo_lessons,
  ROUND(SUM(estimated_hours)::numeric, 1) as total_hours
FROM syllabus_lessons
WHERE syllabus_id = (
  SELECT id FROM syllabi WHERE title LIKE 'Sporty%' ORDER BY created_at DESC LIMIT 1
);

