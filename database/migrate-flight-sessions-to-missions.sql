-- =====================================================
-- DATA MIGRATION: flight_sessions → missions + training_events
-- =====================================================
-- Version: 1.0
-- Created: 2025-01-24
-- Description: Migrates existing flight_sessions data to new mission workflow system
-- 
-- IMPORTANT: Run this AFTER mission-workflow-system-schema.sql
-- IMPORTANT: This is a one-way migration. Backup data before running.
-- =====================================================

-- Create migration log table
CREATE TABLE IF NOT EXISTS migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  status TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Begin migration transaction
DO $$
DECLARE
  v_session RECORD;
  v_mission_id UUID;
  v_flight_event_id UUID;
  v_student_profile_id UUID;
  v_mission_number INTEGER := 1;
  v_records_processed INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
  v_migration_id UUID;
BEGIN
  -- Log migration start
  INSERT INTO migration_log (migration_name, status)
  VALUES ('flight_sessions_to_missions', 'in_progress')
  RETURNING id INTO v_migration_id;
  
  RAISE NOTICE 'Starting migration of flight_sessions to missions...';
  
  -- Loop through all completed flight sessions
  FOR v_session IN 
    SELECT 
      fs.*,
      se.student_id,
      se.syllabus_id,
      p.first_name,
      p.last_name
    FROM flight_sessions fs
    LEFT JOIN student_enrollments se ON fs.enrollment_id = se.id
    LEFT JOIN profiles p ON se.student_id = p.id
    WHERE fs.status IN ('completed', 'scheduled')
    ORDER BY fs.date, fs.start_time
  LOOP
    BEGIN
      -- Get student profile ID
      SELECT id INTO v_student_profile_id
      FROM student_enrollments
      WHERE id = v_session.enrollment_id
      LIMIT 1;
      
      IF v_student_profile_id IS NULL THEN
        v_errors := v_errors || jsonb_build_object(
          'session_id', v_session.id,
          'error', 'No student profile found'
        );
        CONTINUE;
      END IF;
      
      -- Create mission wrapper
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
        created_at,
        completed_at,
        created_by
      )
      VALUES (
        v_session.enrollment_id,
        v_session.instructor_id,
        v_session.student_id,
        'DSA-MIGRATED-' || SUBSTRING(v_session.id::TEXT, 1, 8),
        v_mission_number,
        'MIGRATED',
        CASE 
          WHEN v_session.session_type = 'ground' THEN 'G'
          ELSE 'F'
        END,
        v_session.date,
        v_session.start_time::TIME,
        v_session.aircraft_id,
        v_session.aircraft_id,
        CASE 
          WHEN v_session.status = 'completed' THEN 'completed'
          WHEN v_session.status = 'scheduled' THEN 'scheduled'
          WHEN v_session.status = 'canceled' THEN 'cancelled'
          ELSE 'cancelled'
        END,
        CASE 
          WHEN v_session.status = 'completed' THEN 'satisfactory'
          ELSE NULL
        END,
        v_session.created_at,
        CASE WHEN v_session.status = 'completed' THEN v_session.updated_at ELSE NULL END,
        v_session.instructor_id
      )
      RETURNING id INTO v_mission_id;
      
      -- Create flight training event
      INSERT INTO training_events (
        mission_id,
        enrollment_id,
        instructor_id,
        student_id,
        event_type,
        event_sequence,
        billing_category,
        actual_duration_minutes,
        billable_hours,
        aircraft_id,
        hobbs_start,
        hobbs_end,
        scheduled_start_time,
        actual_start_time,
        actual_end_time,
        notes,
        weather_conditions,
        status,
        created_at,
        updated_at
      )
      VALUES (
        v_mission_id,
        v_session.enrollment_id,
        v_session.instructor_id,
        v_session.student_id,
        CASE WHEN v_session.session_type = 'ground' THEN 'ground' ELSE 'flight' END,
        1,
        CASE WHEN v_session.session_type = 'ground' THEN 'ground_instruction' ELSE 'flight_instruction' END,
        CASE 
          WHEN v_session.hobbs_end IS NOT NULL AND v_session.hobbs_start IS NOT NULL 
          THEN ((v_session.hobbs_end - v_session.hobbs_start) * 60)::INTEGER
          ELSE NULL
        END,
        CASE 
          WHEN v_session.hobbs_end IS NOT NULL AND v_session.hobbs_start IS NOT NULL 
          THEN (v_session.hobbs_end - v_session.hobbs_start)::DECIMAL(4,2)
          ELSE 0
        END,
        v_session.aircraft_id,
        v_session.hobbs_start,
        v_session.hobbs_end,
        (v_session.date || ' ' || COALESCE(v_session.start_time, '00:00:00'))::TIMESTAMP,
        CASE WHEN v_session.status = 'completed' THEN (v_session.date || ' ' || COALESCE(v_session.start_time, '00:00:00'))::TIMESTAMP ELSE NULL END,
        CASE WHEN v_session.status = 'completed' THEN (v_session.date || ' ' || COALESCE(v_session.end_time, '00:00:00'))::TIMESTAMP ELSE NULL END,
        v_session.notes,
        v_session.weather_conditions,
        CASE 
          WHEN v_session.status = 'completed' THEN 'completed'
          WHEN v_session.status = 'scheduled' THEN 'scheduled'
          ELSE 'cancelled'
        END,
        v_session.created_at,
        v_session.updated_at
      )
      RETURNING id INTO v_flight_event_id;
      
      -- Migrate maneuver scores if they exist
      IF EXISTS (SELECT 1 FROM maneuver_scores WHERE flight_session_id = v_session.id) THEN
        -- Update old maneuver scores to link to new structure
        UPDATE maneuver_scores
        SET 
          mission_id = v_mission_id,
          training_event_id = v_flight_event_id
        WHERE flight_session_id = v_session.id;
      END IF;
      
      -- Update mission totals
      UPDATE missions
      SET 
        total_flight_hours = COALESCE((v_session.hobbs_end - v_session.hobbs_start), 0),
        total_ground_hours = COALESCE(v_session.prebrief_minutes + v_session.postbrief_minutes, 0) / 60.0
      WHERE id = v_mission_id;
      
      v_records_processed := v_records_processed + 1;
      v_mission_number := v_mission_number + 1;
      
      IF v_records_processed % 100 = 0 THEN
        RAISE NOTICE 'Processed % records...', v_records_processed;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'session_id', v_session.id,
        'error', SQLERRM
      );
      RAISE WARNING 'Error migrating session %: %', v_session.id, SQLERRM;
    END;
  END LOOP;
  
  -- Update migration log
  UPDATE migration_log
  SET 
    status = 'completed',
    records_processed = v_records_processed,
    errors = v_errors,
    completed_at = NOW()
  WHERE id = v_migration_id;
  
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Total records processed: %', v_records_processed;
  RAISE NOTICE 'Errors encountered: %', jsonb_array_length(v_errors);
  
  IF jsonb_array_length(v_errors) > 0 THEN
    RAISE NOTICE 'Check migration_log table for error details';
  END IF;
END $$;

-- Archive old flight_sessions table (rename, don't drop)
ALTER TABLE IF EXISTS flight_sessions RENAME TO flight_sessions_archived;

-- Add migration note
COMMENT ON TABLE flight_sessions_archived IS 'Archived flight_sessions table - migrated to missions + training_events system on 2025-01-24';

-- Create view for backward compatibility (read-only)
CREATE OR REPLACE VIEW flight_sessions_legacy AS
SELECT 
  te.id,
  te.enrollment_id,
  m.lesson_template_id as lesson_id,
  NULL::UUID as custom_lesson_id,
  te.instructor_id,
  te.aircraft_id,
  m.scheduled_date as date,
  te.scheduled_start_time::TIME as start_time,
  te.actual_end_time::TIME as end_time,
  te.hobbs_start,
  te.hobbs_end,
  te.status,
  te.notes,
  te.weather_conditions,
  CASE WHEN te.event_type = 'flight' THEN 'mission'
       WHEN te.event_type = 'ground' THEN 'ground'
       ELSE 'mission' END as session_type,
  0 as prebrief_minutes,
  0 as postbrief_minutes,
  NULL::UUID as location_id,
  NULL::TEXT as recurrence_rule,
  NULL::UUID as requested_by,
  'approved' as request_status,
  te.created_at,
  te.updated_at
FROM training_events te
JOIN missions m ON te.mission_id = m.id
WHERE te.event_type IN ('flight', 'ground');

COMMENT ON VIEW flight_sessions_legacy IS 'Read-only compatibility view mapping new training_events to old flight_sessions structure';

-- Summary report
DO $$
DECLARE
  v_total_missions INTEGER;
  v_total_events INTEGER;
  v_total_scores INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_missions FROM missions;
  SELECT COUNT(*) INTO v_total_events FROM training_events;
  SELECT COUNT(*) INTO v_total_scores FROM maneuver_scores WHERE mission_id IS NOT NULL;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total missions created: %', v_total_missions;
  RAISE NOTICE 'Total training events created: %', v_total_events;
  RAISE NOTICE 'Total maneuver scores migrated: %', v_total_scores;
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Old flight_sessions table archived as: flight_sessions_archived';
  RAISE NOTICE 'Compatibility view created: flight_sessions_legacy';
  RAISE NOTICE '==============================================';
END $$;

