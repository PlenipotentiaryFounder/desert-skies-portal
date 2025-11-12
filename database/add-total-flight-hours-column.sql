-- Add total_flight_hours column to training_events table
-- This allows instructors to enter flight time directly instead of using hobbs start/stop

ALTER TABLE training_events 
ADD COLUMN IF NOT EXISTS total_flight_hours NUMERIC(5,2);

COMMENT ON COLUMN training_events.total_flight_hours IS 'Direct entry for total flight hours (alternative to hobbs_start/hobbs_end calculation)';

-- Update the RLS policies are already permissive, no changes needed











