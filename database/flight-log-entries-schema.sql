-- =====================================================
-- FLIGHT LOG ENTRIES SCHEMA
-- =====================================================
-- Version: 1.0
-- Created: 2025-01-26
-- Description: Complete schema for flight logbook entries with digital signatures
-- =====================================================

-- Flight log entries table (student and instructor logbooks)
CREATE TABLE IF NOT EXISTS flight_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core References
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  aircraft_id UUID NOT NULL REFERENCES aircraft(id) ON DELETE RESTRICT,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL, -- Link to mission workflow
  flight_session_id UUID, -- Legacy reference (deprecated, use mission_id)
  
  -- Flight Details
  date DATE NOT NULL,
  departure_airport TEXT,
  arrival_airport TEXT,
  route TEXT,
  
  -- Flight Times (in hours, decimal format)
  total_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  pic_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  sic_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  solo_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  cross_country_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  night_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  instrument_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  simulator_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  dual_received DECIMAL(5,2) NOT NULL DEFAULT 0,
  dual_given DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Landings
  landings_day INTEGER NOT NULL DEFAULT 0,
  landings_night INTEGER NOT NULL DEFAULT 0,
  
  -- Aircraft Category Times
  complex_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  high_performance_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  tailwheel_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  multi_engine_time DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Additional Information
  remarks TEXT,
  
  -- ForeFlight Import Metadata (optional)
  ff_import_metadata JSONB,
  hobbs_start DECIMAL(5,2),
  hobbs_end DECIMAL(5,2),
  day_takeoffs INTEGER DEFAULT 0,
  night_takeoffs INTEGER DEFAULT 0,
  all_landings INTEGER DEFAULT 0,
  
  -- Status Management
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'voided')),
  voided_by UUID REFERENCES profiles(id),
  voided_at TIMESTAMP WITH TIME ZONE,
  void_reason TEXT,
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_times CHECK (
    total_time >= 0 AND
    pic_time >= 0 AND
    sic_time >= 0 AND
    solo_time >= 0 AND
    cross_country_time >= 0 AND
    night_time >= 0 AND
    instrument_time >= 0 AND
    simulator_time >= 0 AND
    dual_received >= 0 AND
    dual_given >= 0 AND
    complex_time >= 0 AND
    high_performance_time >= 0 AND
    tailwheel_time >= 0 AND
    multi_engine_time >= 0
  ),
  CONSTRAINT positive_landings CHECK (
    landings_day >= 0 AND
    landings_night >= 0
  )
);

-- Digital signatures for logbook entries (PIN-based)
CREATE TABLE IF NOT EXISTS flight_log_entry_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES flight_log_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor')),
  pin_hash TEXT NOT NULL, -- bcrypt hash of PIN
  signature_data JSONB, -- Optional: digital signature metadata
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_current_signature UNIQUE (entry_id, role, is_current) DEFERRABLE INITIALLY DEFERRED
);

-- Audit log for logbook changes
CREATE TABLE IF NOT EXISTS flight_log_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES flight_log_entries(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'sign', 'void', 'restore')),
  performed_by UUID NOT NULL REFERENCES profiles(id),
  changes JSONB, -- What changed
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flight_log_student ON flight_log_entries(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_flight_log_instructor ON flight_log_entries(instructor_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_flight_log_aircraft ON flight_log_entries(aircraft_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_flight_log_mission ON flight_log_entries(mission_id);
CREATE INDEX IF NOT EXISTS idx_flight_log_date ON flight_log_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_flight_log_status ON flight_log_entries(status);

CREATE INDEX IF NOT EXISTS idx_flight_log_sig_entry ON flight_log_entry_signatures(entry_id);
CREATE INDEX IF NOT EXISTS idx_flight_log_sig_user ON flight_log_entry_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_flight_log_sig_current ON flight_log_entry_signatures(entry_id, is_current);

CREATE INDEX IF NOT EXISTS idx_flight_log_audit_entry ON flight_log_audit(entry_id, created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_flight_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flight_log_updated_at
  BEFORE UPDATE ON flight_log_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_flight_log_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE flight_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_log_entry_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_log_audit ENABLE ROW LEVEL SECURITY;

-- Flight Log Entries Policies

-- Students can view their own entries
CREATE POLICY "Students can view own logbook entries"
  ON flight_log_entries FOR SELECT
  USING (
    student_id = auth.uid()
  );

-- Instructors can view entries where they are the instructor
CREATE POLICY "Instructors can view their student entries"
  ON flight_log_entries FOR SELECT
  USING (
    instructor_id = auth.uid()
  );

-- Students can create their own entries
CREATE POLICY "Students can create own logbook entries"
  ON flight_log_entries FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
  );

-- Students can update their own draft entries
CREATE POLICY "Students can update own draft entries"
  ON flight_log_entries FOR UPDATE
  USING (
    student_id = auth.uid() AND
    status = 'draft'
  );

-- Instructors can update entries where they are the instructor (draft only)
CREATE POLICY "Instructors can update student draft entries"
  ON flight_log_entries FOR UPDATE
  USING (
    instructor_id = auth.uid() AND
    status = 'draft'
  );

-- Admins can view all entries
CREATE POLICY "Admins can view all logbook entries"
  ON flight_log_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update any entry
CREATE POLICY "Admins can update any logbook entry"
  ON flight_log_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Signature Policies

-- Users can view signatures on entries they have access to
CREATE POLICY "Users can view signatures on accessible entries"
  ON flight_log_entry_signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flight_log_entries
      WHERE id = entry_id
      AND (student_id = auth.uid() OR instructor_id = auth.uid())
    )
  );

-- Users can create signatures for entries they have access to
CREATE POLICY "Users can sign accessible entries"
  ON flight_log_entry_signatures FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM flight_log_entries
      WHERE id = entry_id
      AND (student_id = auth.uid() OR instructor_id = auth.uid())
    )
  );

-- Audit Log Policies

-- Users can view audit logs for entries they have access to
CREATE POLICY "Users can view audit logs for accessible entries"
  ON flight_log_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flight_log_entries
      WHERE id = entry_id
      AND (student_id = auth.uid() OR instructor_id = auth.uid())
    )
  );

-- System can insert audit logs
CREATE POLICY "System can create audit logs"
  ON flight_log_audit FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE flight_log_entries IS 'Flight logbook entries for students and instructors (FAA-compliant)';
COMMENT ON COLUMN flight_log_entries.mission_id IS 'Link to mission workflow system (replaces flight_session_id)';
COMMENT ON COLUMN flight_log_entries.total_time IS 'Total flight time in hours (decimal)';
COMMENT ON COLUMN flight_log_entries.pic_time IS 'Pilot-in-Command time';
COMMENT ON COLUMN flight_log_entries.dual_received IS 'Dual instruction received (student perspective)';
COMMENT ON COLUMN flight_log_entries.dual_given IS 'Dual instruction given (instructor perspective)';
COMMENT ON COLUMN flight_log_entries.status IS 'Entry status: draft (editable), final (signed), voided (invalid)';

COMMENT ON TABLE flight_log_entry_signatures IS 'Digital signatures for logbook entries (PIN-based authentication)';
COMMENT ON COLUMN flight_log_entry_signatures.is_current IS 'Only one current signature per role per entry';

COMMENT ON TABLE flight_log_audit IS 'Audit trail for all logbook entry changes';


