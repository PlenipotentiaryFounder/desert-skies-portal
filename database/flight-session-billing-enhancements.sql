-- Flight Session Billing Enhancements (Migration)
-- Adds instructor payout tracking, margin calculation, and future aircraft costs
-- FIX: All new monetary columns use INTEGER CENTS for precision

-- Add instructor payout tracking columns
ALTER TABLE flight_session_billing
ADD COLUMN IF NOT EXISTS student_flight_charge_cents INTEGER,
ADD COLUMN IF NOT EXISTS student_ground_charge_cents INTEGER,
ADD COLUMN IF NOT EXISTS student_total_charge_cents INTEGER,
ADD COLUMN IF NOT EXISTS instructor_flight_payout_cents INTEGER,
ADD COLUMN IF NOT EXISTS instructor_ground_payout_cents INTEGER,
ADD COLUMN IF NOT EXISTS instructor_total_payout_cents INTEGER,
ADD COLUMN IF NOT EXISTS dsa_flight_margin_cents INTEGER,
ADD COLUMN IF NOT EXISTS dsa_ground_margin_cents INTEGER,
ADD COLUMN IF NOT EXISTS dsa_total_margin_cents INTEGER;

-- Add ledger and transfer linking
ALTER TABLE flight_session_billing
ADD COLUMN IF NOT EXISTS journal_id UUID REFERENCES journals(id),
ADD COLUMN IF NOT EXISTS transfer_id UUID REFERENCES instructor_transfers(id),
ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(20) DEFAULT 'pending';

-- Future aircraft billing support
ALTER TABLE flight_session_billing
ADD COLUMN IF NOT EXISTS aircraft_rental_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuel_cost_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS aircraft_owner_payout_cents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bundled_rate_used BOOLEAN DEFAULT false;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_flight_session_billing_journal ON flight_session_billing(journal_id);
CREATE INDEX IF NOT EXISTS idx_flight_session_billing_transfer ON flight_session_billing(transfer_id);
CREATE INDEX IF NOT EXISTS idx_flight_session_billing_transfer_status ON flight_session_billing(transfer_status) 
  WHERE transfer_status = 'pending';

-- Example calculation logic (for reference):
-- Student pays: student_flight_charge_cents = 7500 (75.00 * 1hr * 100)
-- Instructor gets: instructor_flight_payout_cents = 5000 (50.00 * 1hr * 100)
-- DSA margin: dsa_flight_margin_cents = 2500 (25.00 * 1hr * 100)
-- Total balance: -7500 (student) + 5000 (instructor) + 2500 (platform) = 0

-- Note: Existing DECIMAL columns (flight_cost, ground_cost, total_cost) remain for backward compatibility
-- New code should use the _cents columns for all calculations


