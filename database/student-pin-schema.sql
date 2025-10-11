-- Student PIN System for Digital Signatures
-- Enables FAA-compliant digital signatures for flight sessions and logbook entries

CREATE TABLE student_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL, -- bcrypt hashed 4-digit PIN
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id)
);

-- PIN usage tracking for audit purposes
CREATE TABLE pin_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'flight_session_sign', 'logbook_sign', 'billing_confirm'
  reference_id UUID, -- ID of the item being signed
  reference_type VARCHAR(50), -- 'flight_session', 'logbook_entry', 'invoice'
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_student_pins_student_id ON student_pins(student_id);
CREATE INDEX idx_pin_usage_log_student_id ON pin_usage_log(student_id);
CREATE INDEX idx_pin_usage_log_created_at ON pin_usage_log(created_at);

-- RLS Policies
ALTER TABLE student_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_usage_log ENABLE ROW LEVEL SECURITY;

-- Students can manage their own PIN
CREATE POLICY "Students can manage their own PIN" ON student_pins
  FOR ALL USING (auth.uid() = student_id);

-- Students can view their own PIN usage logs
CREATE POLICY "Students can view their own PIN usage" ON pin_usage_log
  FOR SELECT USING (auth.uid() = student_id);

-- Instructors and admins can view PIN usage logs for oversight
CREATE POLICY "Instructors and admins can view PIN usage logs" ON pin_usage_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN user_roles ur ON p.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE p.id = auth.uid() AND r.name IN ('instructor', 'admin')
    )
  );

-- Function to log PIN usage
CREATE OR REPLACE FUNCTION log_pin_usage(
  p_student_id UUID,
  p_action VARCHAR(50),
  p_reference_id UUID DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL,
  p_success BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
BEGIN
  INSERT INTO pin_usage_log (
    student_id,
    action,
    reference_id,
    reference_type,
    success
  ) VALUES (
    p_student_id,
    p_action,
    p_reference_id,
    p_reference_type,
    p_success
  ) RETURNING id INTO usage_id;

  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify PIN for digital signatures
CREATE OR REPLACE FUNCTION verify_student_pin(
  p_student_id UUID,
  p_pin TEXT,
  p_action VARCHAR(50),
  p_reference_id UUID DEFAULT NULL,
  p_reference_type VARCHAR(50) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
  is_valid BOOLEAN := false;
BEGIN
  -- Get stored PIN hash
  SELECT pin_hash INTO stored_hash
  FROM student_pins
  WHERE student_id = p_student_id AND is_active = true;

  -- If no PIN found, log failure
  IF stored_hash IS NULL THEN
    PERFORM log_pin_usage(p_student_id, p_action, p_reference_id, p_reference_type, false);
    RETURN false;
  END IF;

  -- Verify PIN
  is_valid := crypt(p_pin, stored_hash) = stored_hash;

  -- Log the attempt
  PERFORM log_pin_usage(p_student_id, p_action, p_reference_id, p_reference_type, is_valid);

  RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
