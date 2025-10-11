-- Complete Billing System Migration
-- Run this script to set up all billing-related tables and functions

-- Apply the PIN system schema first
\i database/student-pin-schema.sql

-- Apply the instructor billing schema
\i database/instructor-billing-schema.sql

-- Additional indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flight_sessions_student_instructor ON flight_sessions(student_id, instructor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flight_sessions_status_date ON flight_sessions(status, date);

-- Function to migrate existing flight sessions to billing records
-- This will create billing records for existing completed sessions
CREATE OR REPLACE FUNCTION migrate_existing_sessions_to_billing()
RETURNS INTEGER AS $$
DECLARE
  session_record RECORD;
  billing_count INTEGER := 0;
BEGIN
  -- Loop through completed flight sessions that don't have billing records
  FOR session_record IN
    SELECT fs.*, sia.account_type
    FROM flight_sessions fs
    JOIN student_instructor_accounts sia ON fs.student_id = sia.student_id AND fs.instructor_id = sia.instructor_id
    WHERE fs.status = 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM flight_session_billing fsb
      WHERE fsb.flight_session_id = fs.id
    )
  LOOP
    -- Insert billing record
    INSERT INTO flight_session_billing (
      flight_session_id,
      student_id,
      instructor_id,
      flight_hours,
      prebrief_hours,
      postbrief_hours,
      flight_instruction_rate,
      ground_instruction_rate,
      flight_cost,
      ground_cost,
      total_cost,
      billing_status
    ) VALUES (
      session_record.id,
      session_record.student_id,
      session_record.instructor_id,
      session_record.flight_hours,
      session_record.prebrief_minutes / 60.0,
      session_record.postbrief_minutes / 60.0,
      CASE WHEN session_record.account_type = 'flexible' THEN 75.00 ELSE 75.00 END, -- Default rates
      CASE WHEN session_record.account_type = 'flexible' THEN 75.00 ELSE 75.00 END,
      session_record.flight_hours * 75.00,
      (session_record.prebrief_minutes + session_record.postbrief_minutes) / 60.0 * 75.00,
      (session_record.flight_hours * 75.00) + ((session_record.prebrief_minutes + session_record.postbrief_minutes) / 60.0 * 75.00),
      'pending'
    );

    billing_count := billing_count + 1;
  END LOOP;

  RETURN billing_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create default instructor rates for existing student-instructor pairs
CREATE OR REPLACE FUNCTION create_default_instructor_rates()
RETURNS INTEGER AS $$
DECLARE
  account_record RECORD;
  rate_count INTEGER := 0;
BEGIN
  -- Loop through student-instructor accounts that don't have rates
  FOR account_record IN
    SELECT sia.*
    FROM student_instructor_accounts sia
    WHERE NOT EXISTS (
      SELECT 1 FROM student_instructor_rates sir
      WHERE sir.student_id = sia.student_id
      AND sir.instructor_id = sia.instructor_id
      AND sir.is_active = true
    )
  LOOP
    -- Create default rates (75/hour for both flight and ground)
    INSERT INTO student_instructor_rates (
      student_id,
      instructor_id,
      flight_instruction_rate,
      ground_instruction_rate,
      effective_date,
      is_active
    ) VALUES (
      account_record.student_id,
      account_record.instructor_id,
      75.00,
      75.00,
      CURRENT_DATE,
      true
    );

    rate_count := rate_count + 1;
  END LOOP;

  RETURN rate_count;
END;
$$ LANGUAGE plpgsql;

-- Run the migration functions
SELECT 'Creating default instructor rates for existing accounts...' as status;
SELECT create_default_instructor_rates() as rates_created;

SELECT 'Migrating existing flight sessions to billing records...' as status;
SELECT migrate_existing_sessions_to_billing() as sessions_migrated;

-- Set up default account type for existing accounts
UPDATE student_instructor_accounts
SET account_type = 'flexible'
WHERE account_type IS NULL OR account_type = '';

-- Update available hours for flexible accounts
UPDATE student_instructor_accounts
SET available_hours = account_balance / 75.00
WHERE account_type = 'flexible';

-- Create a summary view for admin dashboard
CREATE OR REPLACE VIEW billing_summary AS
SELECT
  sia.student_id,
  sia.instructor_id,
  sia.account_balance,
  sia.available_hours,
  sia.account_type,
  sia.status as account_status,
  COUNT(DISTINCT fsb.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN fsb.billing_status = 'paid' THEN fsb.id END) as paid_sessions,
  COUNT(DISTINCT CASE WHEN fsb.billing_status = 'pending' THEN fsb.id END) as pending_sessions,
  COALESCE(SUM(CASE WHEN fsb.billing_status = 'paid' THEN fsb.total_cost END), 0) as total_paid,
  COALESCE(SUM(CASE WHEN fsb.billing_status = 'pending' THEN fsb.total_cost END), 0) as total_pending,
  s.first_name || ' ' || s.last_name as student_name,
  i.first_name || ' ' || i.last_name as instructor_name
FROM student_instructor_accounts sia
LEFT JOIN flight_session_billing fsb ON sia.student_id = fsb.student_id AND sia.instructor_id = fsb.instructor_id
LEFT JOIN profiles s ON sia.student_id = s.id
LEFT JOIN profiles i ON sia.instructor_id = i.id
GROUP BY sia.student_id, sia.instructor_id, sia.account_balance, sia.available_hours,
         sia.account_type, sia.status, s.first_name, s.last_name, i.first_name, i.last_name;

-- Grant appropriate permissions
GRANT SELECT ON billing_summary TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Billing system migration completed successfully!';
  RAISE NOTICE 'Created % instructor rate records', (SELECT COUNT(*) FROM student_instructor_rates);
  RAISE NOTICE 'Migrated % flight sessions to billing', (SELECT COUNT(*) FROM flight_session_billing);
  RAISE NOTICE 'Total accounts configured: %', (SELECT COUNT(*) FROM student_instructor_accounts);
END $$;
