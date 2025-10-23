-- Stripe Connect & Transfer Tracking (Production-Grade)
-- Proper state machine: status='pending' initially, webhook confirms 'paid'
-- Outbox pattern for idempotency
-- Comprehensive tracking for clawback and disputes

-- Add Stripe Connect fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_requirements_due_date DATE,
ADD COLUMN IF NOT EXISTS stripe_connect_requirements_pending TEXT[]; -- Array of pending requirements

CREATE INDEX idx_profiles_stripe_connect ON profiles(stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;
CREATE INDEX idx_profiles_connect_incomplete ON profiles(stripe_connect_onboarding_complete) WHERE stripe_connect_onboarding_complete = false;

-- Outbox pattern for idempotent Stripe operations
-- FIX: Ensures no duplicate transfers even with network retries
CREATE TABLE payment_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(255) NOT NULL UNIQUE, -- Derived from journal_id + action
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create_transfer', 'create_payout', 'create_refund')),
  
  -- Action payload
  instructor_id UUID REFERENCES profiles(id),
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  journal_id UUID REFERENCES journals(id),
  flight_session_id UUID REFERENCES flight_sessions(id),
  
  -- Payout configuration
  is_instant_payout BOOLEAN DEFAULT false,
  instant_fee_charge_to_dsa BOOLEAN DEFAULT false,
  
  -- State machine
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  
  -- Stripe response
  stripe_object_id VARCHAR(255), -- transfer_id, payout_id, etc.
  failure_code VARCHAR(50),
  failure_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payment_outbox_pending ON payment_outbox(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_payment_outbox_journal ON payment_outbox(journal_id);
CREATE INDEX idx_payment_outbox_instructor ON payment_outbox(instructor_id);
CREATE INDEX idx_payment_outbox_failed_retryable ON payment_outbox(status, attempt_count, created_at) 
  WHERE status = 'failed' AND attempt_count < max_attempts;

-- Instructor transfers (DSA → instructor payouts)
-- FIX: Status starts as 'pending', only set to 'paid' on webhook
CREATE TABLE instructor_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  stripe_transfer_id VARCHAR(255) UNIQUE, -- May be NULL if creation failed
  stripe_connect_account_id VARCHAR(255) NOT NULL,
  
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Transfer type
  transfer_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (transfer_type IN ('standard', 'instant')),
  
  -- FIX: Actual instant fee charged (read from Stripe, not assumed 1%)
  instant_payout_fee_cents INTEGER DEFAULT 0,
  
  -- State machine (starts PENDING, webhook confirms)
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  failure_code VARCHAR(50),
  failure_message TEXT,
  
  -- Business context
  flight_session_id UUID REFERENCES flight_sessions(id),
  journal_id UUID REFERENCES journals(id),
  outbox_id UUID REFERENCES payment_outbox(id),
  
  -- Clawback tracking (T+72h policy)
  is_clawback_eligible BOOLEAN NOT NULL DEFAULT true,
  clawback_window_ends_at TIMESTAMP WITH TIME ZONE,
  clawback_reason TEXT,
  clawed_back_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_instructor_transfers_instructor ON instructor_transfers(instructor_id);
CREATE INDEX idx_instructor_transfers_status ON instructor_transfers(status, created_at);
CREATE INDEX idx_instructor_transfers_session ON instructor_transfers(flight_session_id);
CREATE INDEX idx_instructor_transfers_journal ON instructor_transfers(journal_id);
CREATE INDEX idx_instructor_transfers_outbox ON instructor_transfers(outbox_id);
CREATE INDEX idx_instructor_transfers_clawback ON instructor_transfers(is_clawback_eligible, clawback_window_ends_at) 
  WHERE is_clawback_eligible = true;
CREATE INDEX idx_instructor_transfers_pending ON instructor_transfers(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_instructor_transfers_stripe_id ON instructor_transfers(stripe_transfer_id) WHERE stripe_transfer_id IS NOT NULL;

-- RLS Policies
ALTER TABLE payment_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_transfers ENABLE ROW LEVEL SECURITY;

-- Admins can view payment outbox
CREATE POLICY "Admins can view payment outbox" ON payment_outbox
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Instructors can view their own transfers
CREATE POLICY "Instructors can view own transfers" ON instructor_transfers
  FOR SELECT USING (auth.uid() = instructor_id);

-- Admins can view all transfers
CREATE POLICY "Admins can view all transfers" ON instructor_transfers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );


