-- Financial Controls & Reserve Monitoring (Production-Grade)
-- FIX: Reserve reconciliation (not double-counting)
-- Credit limits with escalation logic
-- Instructor adjustment tracking for flight edits

-- Student credit limits (per student, not per instructor)
CREATE TABLE student_credit_limits (
  student_id UUID PRIMARY KEY REFERENCES profiles(id),
  credit_limit_cents INTEGER NOT NULL DEFAULT -20000, -- -$200 default
  credit_warning_threshold_pct DECIMAL(5,2) NOT NULL DEFAULT 80.0,
  
  -- Auto-charge settings
  auto_charge_enabled BOOLEAN NOT NULL DEFAULT false,
  stripe_payment_method_id VARCHAR(255),
  auto_charge_trigger_balance_cents INTEGER DEFAULT -5000,
  
  -- Conditions for limit increase
  card_on_file BOOLEAN NOT NULL DEFAULT false,
  dispute_free_days INTEGER NOT NULL DEFAULT 0,
  total_prepaid_lifetime_cents INTEGER NOT NULL DEFAULT 0,
  
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_credit_limits_status ON student_credit_limits(status);

-- FIX: Reserve monitoring (reconciliation, not summation)
-- Platform reserve config tracks TARGET thresholds, not actual balance
CREATE TABLE platform_reserve_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reserve policy: P95(daily payouts last 60d) + open disputes + 20% buffer
  calculation_method VARCHAR(50) NOT NULL DEFAULT 'p95_plus_buffer',
  buffer_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.0,
  lookback_days INTEGER NOT NULL DEFAULT 60,
  
  -- Computed thresholds (updated daily by calc job)
  minimum_reserve_cents INTEGER NOT NULL,
  warning_threshold_cents INTEGER NOT NULL,
  critical_threshold_cents INTEGER NOT NULL,
  
  -- Actions
  block_transfers_when_critical BOOLEAN NOT NULL DEFAULT true,
  alert_email_addresses TEXT[],
  
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  next_calculation_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- FIX: Reserve reconciliation log (daily job compares ledger to external cash)
-- This is the KEY table that prevents double-counting
CREATE TABLE reserve_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_date DATE NOT NULL UNIQUE,
  
  -- Ledger balances (source of truth)
  platform_wallet_balance_cents INTEGER NOT NULL,
  student_wallets_total_cents INTEGER NOT NULL,
  instructor_wallets_total_cents INTEGER NOT NULL,
  liability_wallets_total_cents INTEGER NOT NULL,
  ledger_sum_cents INTEGER NOT NULL, -- Should always = 0 for double-entry
  
  -- External cash positions
  stripe_available_cents INTEGER NOT NULL,
  stripe_pending_cents INTEGER NOT NULL,
  bank_account_cents INTEGER,
  
  -- FIX: Reconciliation formula (not summation!)
  -- Assert: platform_wallet == stripe_available + bank - unsettled - pending_payouts
  expected_platform_balance_cents INTEGER NOT NULL,
  actual_platform_balance_cents INTEGER NOT NULL,
  drift_cents INTEGER NOT NULL, -- Should be 0
  
  status VARCHAR(20) NOT NULL CHECK (status IN ('balanced', 'drift_detected', 'critical_error')),
  notes TEXT,
  
  reconciled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_reserve_reconciliations_date ON reserve_reconciliations(reconciliation_date DESC);
CREATE INDEX idx_reserve_reconciliations_status ON reserve_reconciliations(status) WHERE status != 'balanced';

-- Reserve alerts (when drift detected or thresholds breached)
CREATE TABLE reserve_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('drift_detected', 'warning_threshold', 'critical_threshold', 'resolved')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  
  -- Alert details
  platform_balance_cents INTEGER NOT NULL,
  threshold_cents INTEGER,
  drift_cents INTEGER,
  message TEXT NOT NULL,
  
  -- Resolution
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_reserve_alerts_unacknowledged ON reserve_alerts(created_at DESC) WHERE acknowledged_at IS NULL;
CREATE INDEX idx_reserve_alerts_severity ON reserve_alerts(severity, created_at DESC);

-- Instructor overpayment/underpayment tracking (for flight edits)
CREATE TABLE instructor_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  
  adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('overpayment', 'underpayment', 'bonus', 'penalty', 'clawback')),
  amount_cents INTEGER NOT NULL, -- Positive for amounts owed TO instructor, negative for owed BY instructor
  
  -- Source context
  original_flight_session_id UUID REFERENCES flight_sessions(id),
  original_transfer_id UUID REFERENCES instructor_transfers(id),
  adjustment_reason TEXT NOT NULL,
  
  -- Settlement tracking
  settlement_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'settled', 'forgiven', 'written_off')),
  settlement_method VARCHAR(50), -- 'future_payout_offset', 'manual_check', 'stripe_reversal', etc.
  settled_at TIMESTAMP WITH TIME ZONE,
  settlement_journal_id UUID REFERENCES journals(id),
  
  -- Approval workflow
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  adjusted_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_instructor_adjustments_instructor ON instructor_adjustments(instructor_id);
CREATE INDEX idx_instructor_adjustments_pending ON instructor_adjustments(settlement_status, created_at) 
  WHERE settlement_status = 'pending';
CREATE INDEX idx_instructor_adjustments_session ON instructor_adjustments(original_flight_session_id);
CREATE INDEX idx_instructor_adjustments_transfer ON instructor_adjustments(original_transfer_id);

-- RLS Policies
ALTER TABLE student_credit_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_reserve_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserve_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserve_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_adjustments ENABLE ROW LEVEL SECURITY;

-- Students can view their own credit limit
CREATE POLICY "Students can view own credit limit" ON student_credit_limits
  FOR SELECT USING (auth.uid() = student_id);

-- Admins can manage all credit limits
CREATE POLICY "Admins can manage credit limits" ON student_credit_limits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Admins can view reserve config, reconciliations, and alerts
CREATE POLICY "Admins can view reserve config" ON platform_reserve_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can view reconciliations" ON reserve_reconciliations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can view reserve alerts" ON reserve_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Instructors can view their own adjustments
CREATE POLICY "Instructors can view own adjustments" ON instructor_adjustments
  FOR SELECT USING (auth.uid() = instructor_id);

-- Admins can manage all adjustments
CREATE POLICY "Admins can manage adjustments" ON instructor_adjustments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );


