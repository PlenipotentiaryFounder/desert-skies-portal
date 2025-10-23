-- Instructor Payout Rate System (Production-Grade)
-- Stores compensation rates separate from student billing rates
-- All amounts in INTEGER CENTS for precision

-- Instructor compensation rates (what instructors RECEIVE)
CREATE TABLE instructor_payout_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- What instructor RECEIVES per hour (INTEGER CENTS for precision)
  flight_instruction_payout_cents INTEGER NOT NULL,
  ground_instruction_payout_cents INTEGER NOT NULL,
  
  -- Payout model
  payout_model VARCHAR(20) NOT NULL DEFAULT 'hourly' 
    CHECK (payout_model IN ('hourly', 'percentage', 'tiered')),
  
  -- If percentage-based (future flexibility)
  flight_percentage DECIMAL(5,2),
  ground_percentage DECIMAL(5,2),
  
  -- Instant payout policy (configurable per instructor)
  instant_payout_enabled BOOLEAN NOT NULL DEFAULT true,
  instant_payout_fee_covered_by_dsa BOOLEAN NOT NULL DEFAULT false,
  
  effective_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  
  -- Audit trail
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(instructor_id, effective_date)
);

CREATE INDEX idx_instructor_payout_rates_instructor ON instructor_payout_rates(instructor_id);
CREATE INDEX idx_instructor_payout_rates_active ON instructor_payout_rates(is_active, effective_date) WHERE is_active = true;

-- Audit log for ALL rate changes (who, when, why)
CREATE TABLE instructor_payout_rate_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_id UUID NOT NULL REFERENCES instructor_payout_rates(id),
  changed_by UUID NOT NULL REFERENCES profiles(id),
  change_reason TEXT NOT NULL,
  approval_status VARCHAR(20) CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  old_flight_cents INTEGER,
  new_flight_cents INTEGER,
  old_ground_cents INTEGER,
  new_ground_cents INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_instructor_payout_rate_changes_rate ON instructor_payout_rate_changes(rate_id);
CREATE INDEX idx_instructor_payout_rate_changes_changed_by ON instructor_payout_rate_changes(changed_by);

-- RLS Policies
ALTER TABLE instructor_payout_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_payout_rate_changes ENABLE ROW LEVEL SECURITY;

-- Admins can view/manage all payout rates
CREATE POLICY "Admins can manage payout rates" ON instructor_payout_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Instructors can view their own payout rates (read-only)
CREATE POLICY "Instructors can view own payout rates" ON instructor_payout_rates
  FOR SELECT USING (auth.uid() = instructor_id);

-- Admins can view all rate change history
CREATE POLICY "Admins can view rate changes" ON instructor_payout_rate_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );


