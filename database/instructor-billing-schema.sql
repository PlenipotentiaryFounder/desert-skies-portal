-- Instructor Billing System Schema
-- Complete financial management system for flight instruction billing

-- Student-Instructor Account Management
CREATE TABLE student_instructor_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Flexible account balance that can be used for any instruction type
  account_balance DECIMAL(10,2) DEFAULT 0.00,

  -- Legacy fields for backward compatibility (will be deprecated)
  prepaid_flight_hours DECIMAL(8,2) DEFAULT 0.0,
  prepaid_ground_hours DECIMAL(8,2) DEFAULT 0.0,

  -- New flexible system: total hours available (calculated from balance)
  available_hours DECIMAL(8,2) DEFAULT 0.0,

  -- Account preferences and settings
  account_type VARCHAR(20) DEFAULT 'flexible' CHECK (account_type IN ('flexible', 'hours_only', 'legacy')),
  auto_charge_enabled BOOLEAN DEFAULT false,
  low_balance_threshold DECIMAL(10,2) DEFAULT 50.00,

  -- Status and lifecycle
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(student_id, instructor_id)
);

-- Student-Instructor Rate Management
CREATE TABLE student_instructor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  flight_instruction_rate DECIMAL(10,2) NOT NULL,
  ground_instruction_rate DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL,

  is_active BOOLEAN DEFAULT true,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(student_id, instructor_id, effective_date)
);

-- Flight Session Billing Records
CREATE TABLE flight_session_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_session_id UUID NOT NULL REFERENCES flight_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Time tracking
  flight_hours DECIMAL(6,2) NOT NULL,
  prebrief_hours DECIMAL(6,2) DEFAULT 0,
  postbrief_hours DECIMAL(6,2) DEFAULT 0,

  -- Rate information (snapshot at time of billing)
  flight_instruction_rate DECIMAL(10,2) NOT NULL,
  ground_instruction_rate DECIMAL(10,2) NOT NULL,

  -- Cost calculations
  flight_cost DECIMAL(10,2) NOT NULL,
  ground_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,

  -- Billing workflow
  billing_status VARCHAR(20) DEFAULT 'pending' CHECK (billing_status IN ('pending', 'billed', 'paid', 'cancelled')),
  instructor_approved BOOLEAN DEFAULT false,
  instructor_approved_at TIMESTAMP WITH TIME ZONE,
  student_acknowledged BOOLEAN DEFAULT false,
  student_acknowledged_at TIMESTAMP WITH TIME ZONE,

  -- Invoice relationship
  invoice_id UUID REFERENCES instructor_invoices(id),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Instructor Invoices
CREATE TABLE instructor_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,

  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Invoice details
  flight_hours DECIMAL(8,2) NOT NULL,
  ground_hours DECIMAL(8,2) NOT NULL,
  flight_rate DECIMAL(10,2) NOT NULL,
  ground_rate DECIMAL(10,2) NOT NULL,
  flight_amount DECIMAL(10,2) NOT NULL,
  ground_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,

  -- Invoice lifecycle
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method VARCHAR(50),

  -- Stripe integration
  stripe_payment_intent_id VARCHAR(255),

  -- Additional information
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoice Line Items (detailed breakdown)
CREATE TABLE instructor_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES instructor_invoices(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('flight_instruction', 'ground_instruction', 'prebrief', 'postbrief')),

  hours DECIMAL(6,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,

  -- Link to source session if applicable
  flight_session_id UUID REFERENCES flight_sessions(id),
  date DATE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Hours Purchase Records (for prepaid hours)
CREATE TABLE instructor_hours_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  flight_hours_purchased DECIMAL(8,2) NOT NULL,
  ground_hours_purchased DECIMAL(8,2) NOT NULL,
  flight_rate DECIMAL(10,2) NOT NULL,
  ground_rate DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,

  payment_method VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),

  -- Purchase lifecycle
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  expires_at TIMESTAMP WITH TIME ZONE,

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Instructor Billing Transactions (comprehensive audit trail)
CREATE TABLE instructor_billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
    'flight_debit', 'ground_debit', 'cash_credit', 'hours_credit', 'refund', 'adjustment'
  )),

  -- Time tracking (for hour-based transactions)
  flight_hours DECIMAL(8,2) DEFAULT 0,
  ground_hours DECIMAL(8,2) DEFAULT 0,

  -- Cash amount (for cash-based transactions)
  cash_amount DECIMAL(10,2) DEFAULT 0,

  -- Description and references
  description TEXT NOT NULL,
  reference_type VARCHAR(50), -- 'flight_session', 'invoice', 'purchase', 'adjustment', etc.
  reference_id UUID,

  -- Balance tracking (for audit trail)
  flight_hours_balance_after DECIMAL(8,2),
  ground_hours_balance_after DECIMAL(8,2),
  cash_balance_after DECIMAL(10,2),

  -- Processing information
  processed_by UUID REFERENCES profiles(id),

  -- Additional metadata
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Student Account Transactions (general account activity)
CREATE TABLE account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('debit', 'credit', 'refund', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,

  description TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  processed_by UUID REFERENCES profiles(id),

  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_student_instructor_accounts_student ON student_instructor_accounts(student_id);
CREATE INDEX idx_student_instructor_accounts_instructor ON student_instructor_accounts(instructor_id);
CREATE INDEX idx_student_instructor_accounts_status ON student_instructor_accounts(status);

CREATE INDEX idx_student_instructor_rates_student ON student_instructor_rates(student_id);
CREATE INDEX idx_student_instructor_rates_instructor ON student_instructor_rates(instructor_id);
CREATE INDEX idx_student_instructor_rates_active ON student_instructor_rates(is_active);

CREATE INDEX idx_flight_session_billing_session ON flight_session_billing(flight_session_id);
CREATE INDEX idx_flight_session_billing_student ON flight_session_billing(student_id);
CREATE INDEX idx_flight_session_billing_instructor ON flight_session_billing(instructor_id);
CREATE INDEX idx_flight_session_billing_status ON flight_session_billing(billing_status);

CREATE INDEX idx_instructor_invoices_student ON instructor_invoices(student_id);
CREATE INDEX idx_instructor_invoices_instructor ON instructor_invoices(instructor_id);
CREATE INDEX idx_instructor_invoices_status ON instructor_invoices(status);
CREATE INDEX idx_instructor_invoices_due_date ON instructor_invoices(due_date);

CREATE INDEX idx_instructor_invoice_items_invoice ON instructor_invoice_items(invoice_id);
CREATE INDEX idx_instructor_invoice_items_session ON instructor_invoice_items(flight_session_id);

CREATE INDEX idx_instructor_hours_purchases_student ON instructor_hours_purchases(student_id);
CREATE INDEX idx_instructor_hours_purchases_instructor ON instructor_hours_purchases(instructor_id);
CREATE INDEX idx_instructor_hours_purchases_status ON instructor_hours_purchases(status);

CREATE INDEX idx_instructor_billing_transactions_student ON instructor_billing_transactions(student_id);
CREATE INDEX idx_instructor_billing_transactions_instructor ON instructor_billing_transactions(instructor_id);
CREATE INDEX idx_instructor_billing_transactions_type ON instructor_billing_transactions(transaction_type);
CREATE INDEX idx_instructor_billing_transactions_created_at ON instructor_billing_transactions(created_at);

CREATE INDEX idx_account_transactions_student ON account_transactions(student_id);
CREATE INDEX idx_account_transactions_type ON account_transactions(transaction_type);
CREATE INDEX idx_account_transactions_created_at ON account_transactions(created_at);

-- Row Level Security (RLS) Policies

-- Student-Instructor Accounts
ALTER TABLE student_instructor_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own accounts" ON student_instructor_accounts
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view their students' accounts" ON student_instructor_accounts
  FOR SELECT USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update their students' accounts" ON student_instructor_accounts
  FOR UPDATE USING (auth.uid() = instructor_id);

-- Student-Instructor Rates
ALTER TABLE student_instructor_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can manage rates for their students" ON student_instructor_rates
  FOR ALL USING (auth.uid() = instructor_id);

-- Flight Session Billing
ALTER TABLE flight_session_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students and instructors can view session billing" ON flight_session_billing
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = instructor_id);

CREATE POLICY "Instructors can manage session billing" ON flight_session_billing
  FOR ALL USING (auth.uid() = instructor_id);

-- Instructor Invoices
ALTER TABLE instructor_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students and instructors can view invoices" ON instructor_invoices
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = instructor_id);

CREATE POLICY "Instructors can manage invoices" ON instructor_invoices
  FOR ALL USING (auth.uid() = instructor_id);

-- Invoice Items
ALTER TABLE instructor_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students and instructors can view invoice items" ON instructor_invoice_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM instructor_invoices ii
      WHERE ii.id = invoice_id AND (ii.student_id = auth.uid() OR ii.instructor_id = auth.uid())
    )
  );

-- Hours Purchases
ALTER TABLE instructor_hours_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students and instructors can view purchases" ON instructor_hours_purchases
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = instructor_id);

-- Billing Transactions
ALTER TABLE instructor_billing_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students and instructors can view transactions" ON instructor_billing_transactions
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = instructor_id);

-- Account Transactions
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own transactions" ON account_transactions
  FOR SELECT USING (auth.uid() = student_id);

-- Database Functions

-- Function to calculate flight session cost
CREATE OR REPLACE FUNCTION calculate_flight_session_cost(
  session_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  session_record RECORD;
  total_cost DECIMAL(10,2) := 0;
BEGIN
  -- Get session details
  SELECT fs.*, sia.account_type, sir.flight_instruction_rate, sir.ground_instruction_rate
  INTO session_record
  FROM flight_sessions fs
  JOIN student_instructor_accounts sia ON fs.student_id = sia.student_id AND fs.instructor_id = sia.instructor_id
  LEFT JOIN student_instructor_rates sir ON fs.student_id = sir.student_id AND fs.instructor_id = sir.instructor_id AND sir.is_active = true
  WHERE fs.id = session_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Use rates from the rate table if available, otherwise use defaults
  IF session_record.flight_instruction_rate IS NOT NULL THEN
    total_cost := session_record.flight_hours * session_record.flight_instruction_rate;
  ELSE
    total_cost := session_record.flight_hours * 75.00; -- Default rate
  END IF;

  IF session_record.ground_instruction_rate IS NOT NULL THEN
    total_cost := total_cost + (session_record.prebrief_minutes + session_record.postbrief_minutes) / 60 * session_record.ground_instruction_rate;
  ELSE
    total_cost := total_cost + (session_record.prebrief_minutes + session_record.postbrief_minutes) / 60 * 75.00; -- Default rate
  END IF;

  RETURN total_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update account balance after transaction
CREATE OR REPLACE FUNCTION update_student_instructor_balance(
  p_student_id UUID,
  p_instructor_id UUID,
  p_amount DECIMAL(10,2),
  p_flight_hours DECIMAL(8,2) DEFAULT 0,
  p_ground_hours DECIMAL(8,2) DEFAULT 0,
  p_transaction_type VARCHAR(30)
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  current_balance DECIMAL(10,2);
  new_balance DECIMAL(10,2);
  account_record RECORD;
BEGIN
  -- Get current account
  SELECT * INTO account_record
  FROM student_instructor_accounts
  WHERE student_id = p_student_id AND instructor_id = p_instructor_id;

  IF NOT FOUND THEN
    -- Create account if it doesn't exist
    INSERT INTO student_instructor_accounts (student_id, instructor_id, account_balance)
    VALUES (p_student_id, p_instructor_id, 0.00)
    RETURNING account_balance INTO current_balance;
  ELSE
    current_balance := account_record.account_balance;
  END IF;

  -- Calculate new balance based on transaction type
  CASE p_transaction_type
    WHEN 'cash_credit' THEN
      new_balance := current_balance + p_amount;
    WHEN 'refund' THEN
      new_balance := current_balance + p_amount;
    WHEN 'flight_debit' THEN
      new_balance := current_balance - p_amount;
    WHEN 'ground_debit' THEN
      new_balance := current_balance - p_amount;
    WHEN 'adjustment' THEN
      new_balance := current_balance + p_amount; -- Positive for refunds, negative for charges
    ELSE
      new_balance := current_balance;
  END CASE;

  -- Update account balance
  UPDATE student_instructor_accounts
  SET
    account_balance = new_balance,
    updated_at = now()
  WHERE student_id = p_student_id AND instructor_id = p_instructor_id;

  -- Update available hours for flexible accounts
  IF account_record.account_type = 'flexible' THEN
    -- Get current rates to calculate hours
    SELECT COALESCE(flight_instruction_rate, 75.00) INTO flight_rate
    FROM student_instructor_rates
    WHERE student_id = p_student_id AND instructor_id = p_instructor_id AND is_active = true
    ORDER BY effective_date DESC LIMIT 1;

    SELECT COALESCE(ground_instruction_rate, 75.00) INTO ground_rate
    FROM student_instructor_rates
    WHERE student_id = p_student_id AND instructor_id = p_instructor_id AND is_active = true
    ORDER BY effective_date DESC LIMIT 1;

    -- Calculate total hours from balance (simplified - could be more sophisticated)
    UPDATE student_instructor_accounts
    SET available_hours = new_balance / ((flight_rate + ground_rate) / 2)
    WHERE student_id = p_student_id AND instructor_id = p_instructor_id;
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create student-instructor account when needed
CREATE OR REPLACE FUNCTION create_student_instructor_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Create account if it doesn't exist
  INSERT INTO student_instructor_accounts (student_id, instructor_id, account_balance, account_type)
  VALUES (NEW.student_id, NEW.instructor_id, 0.00, 'flexible')
  ON CONFLICT (student_id, instructor_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create accounts when flight sessions are created
CREATE TRIGGER create_account_on_flight_session
  AFTER INSERT ON flight_sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_student_instructor_account();

-- Trigger to create accounts when rates are created
CREATE TRIGGER create_account_on_rate_creation
  AFTER INSERT ON student_instructor_rates
  FOR EACH ROW
  EXECUTE FUNCTION create_student_instructor_account();
