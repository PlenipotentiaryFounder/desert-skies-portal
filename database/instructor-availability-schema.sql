-- ============================================================================
-- INSTRUCTOR AVAILABILITY & TIME-OFF SYSTEM
-- ============================================================================
-- This schema enables instructors to set their availability and request time off
-- Similar to the student availability system but tailored for instructor needs

-- ============================================================================
-- INSTRUCTOR AVAILABILITY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS instructor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'not_available', 'tentative')),
  start_time TIME,  -- NULL = all day
  end_time TIME,    -- NULL = all day
  time_slot TEXT CHECK (time_slot IN ('all_day', 'morning', 'afternoon', 'evening', 'night')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_instructor_availability UNIQUE(instructor_id, date, start_time)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_instructor_availability_instructor 
  ON instructor_availability(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_availability_date 
  ON instructor_availability(date);
CREATE INDEX IF NOT EXISTS idx_instructor_availability_status 
  ON instructor_availability(status);
CREATE INDEX IF NOT EXISTS idx_instructor_availability_date_range 
  ON instructor_availability(instructor_id, date);

-- RLS Policies
ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own availability
CREATE POLICY "Instructors can manage own availability"
  ON instructor_availability
  FOR ALL
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'owner')
    )
  );

-- Anyone authenticated can view instructor availability (for scheduling)
CREATE POLICY "Authenticated users can view instructor availability"
  ON instructor_availability
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE instructor_availability IS 'Instructor availability calendar - allows instructors to set when they can teach';
COMMENT ON COLUMN instructor_availability.time_slot IS 'all_day, morning (6-11), afternoon (12-15), evening (15-19), night (20-24)';

-- ============================================================================
-- TIME-OFF REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('vacation', 'sick', 'personal', 'professional_development', 'family', 'other')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_off_requests_instructor 
  ON time_off_requests(instructor_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status 
  ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_dates 
  ON time_off_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_created 
  ON time_off_requests(created_at DESC);

-- RLS Policies
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own requests
CREATE POLICY "Instructors can manage own time-off requests"
  ON time_off_requests
  FOR ALL
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'owner')
    )
  );

-- Admins can view all requests
CREATE POLICY "Admins can view all time-off requests"
  ON time_off_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'owner')
    )
  );

COMMENT ON TABLE time_off_requests IS 'Instructor time-off requests with approval workflow';
COMMENT ON COLUMN time_off_requests.status IS 'pending (awaiting review), approved, denied, cancelled (by instructor)';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to auto-block availability when time-off is approved
CREATE OR REPLACE FUNCTION block_availability_for_approved_time_off()
RETURNS TRIGGER AS $$
DECLARE
  current_date DATE;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Loop through each date in the range
    current_date := NEW.start_date;
    WHILE current_date <= NEW.end_date LOOP
      -- Insert or update availability to 'not_available'
      INSERT INTO instructor_availability (
        instructor_id,
        date,
        status,
        notes,
        time_slot
      ) VALUES (
        NEW.instructor_id,
        current_date,
        'not_available',
        'Time off approved: ' || NEW.reason,
        'all_day'
      )
      ON CONFLICT (instructor_id, date, start_time)
      DO UPDATE SET
        status = 'not_available',
        notes = 'Time off approved: ' || NEW.reason,
        time_slot = 'all_day',
        updated_at = NOW();
      
      current_date := current_date + INTERVAL '1 day';
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically block availability
CREATE TRIGGER trigger_block_availability_on_time_off_approval
  AFTER INSERT OR UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION block_availability_for_approved_time_off();

COMMENT ON FUNCTION block_availability_for_approved_time_off IS 'Automatically blocks instructor availability when time-off is approved';

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for instructors to see their upcoming time off
CREATE OR REPLACE VIEW instructor_upcoming_time_off AS
SELECT 
  tor.*,
  i.first_name || ' ' || i.last_name as instructor_name,
  i.email as instructor_email,
  r.first_name || ' ' || r.last_name as reviewed_by_name
FROM time_off_requests tor
JOIN profiles i ON tor.instructor_id = i.id
LEFT JOIN profiles r ON tor.reviewed_by = r.id
WHERE tor.end_date >= CURRENT_DATE
ORDER BY tor.start_date ASC;

COMMENT ON VIEW instructor_upcoming_time_off IS 'Upcoming time-off requests for all instructors';

-- View for checking instructor availability conflicts
CREATE OR REPLACE VIEW instructor_availability_summary AS
SELECT 
  ia.instructor_id,
  p.first_name || ' ' || p.last_name as instructor_name,
  ia.date,
  ia.status,
  ia.time_slot,
  ia.start_time,
  ia.end_time,
  ia.notes,
  CASE 
    WHEN ia.status = 'available' THEN 1
    WHEN ia.status = 'tentative' THEN 2
    WHEN ia.status = 'not_available' THEN 3
  END as status_priority
FROM instructor_availability ia
JOIN profiles p ON ia.instructor_id = p.id
ORDER BY ia.date ASC, status_priority ASC;

COMMENT ON VIEW instructor_availability_summary IS 'Summary view of instructor availability for scheduling';

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
-- Sample availability (replace with actual instructor ID)
INSERT INTO instructor_availability (instructor_id, date, status, time_slot, notes)
VALUES 
  ('YOUR_INSTRUCTOR_ID', CURRENT_DATE + 1, 'available', 'all_day', 'Available all day'),
  ('YOUR_INSTRUCTOR_ID', CURRENT_DATE + 2, 'available', 'morning', 'Morning flights only'),
  ('YOUR_INSTRUCTOR_ID', CURRENT_DATE + 3, 'not_available', 'all_day', 'Personal appointment');

-- Sample time-off request
INSERT INTO time_off_requests (instructor_id, start_date, end_date, reason, notes)
VALUES (
  'YOUR_INSTRUCTOR_ID',
  CURRENT_DATE + 7,
  CURRENT_DATE + 10,
  'vacation',
  'Family vacation in Colorado'
);
*/


