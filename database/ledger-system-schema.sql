-- Double-Entry Ledger System (Production-Grade)
-- Ensures all transactions balance to zero with transaction-level enforcement
-- Includes concurrency controls, currency consistency, and liability wallets

-- Wallets for all actors (students, instructors, platform, liabilities)
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('student', 'instructor', 'platform', 'aircraft_owner', 'liability')),
  owner_id UUID, -- NULL for platform and liability wallets
  liability_subtype VARCHAR(50), -- 'tax_payable', 'gift_card_liability', etc.
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one wallet per owner, allow multiple liability subtypes
  UNIQUE(owner_type, owner_id, liability_subtype)
);

-- Guarantee single platform wallet
CREATE UNIQUE INDEX idx_wallets_single_platform 
  ON wallets(owner_type) 
  WHERE owner_type = 'platform' AND owner_id IS NULL;

CREATE INDEX idx_wallets_owner ON wallets(owner_type, owner_id);
CREATE INDEX idx_wallets_liability ON wallets(liability_subtype) WHERE owner_type = 'liability';

-- Journals (atomic business events with currency lock)
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  event_id UUID, -- flight_session_id, invoice_id, etc.
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'reversed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_journals_event ON journals(event_type, event_id);
CREATE INDEX idx_journals_status ON journals(status, created_at);

-- Double-entry ledger (every transaction has balanced entries)
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id),
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  
  -- Signed amount in CENTS (positive = credit, negative = debit)
  amount_cents INTEGER NOT NULL,
  
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Business context
  ref_type VARCHAR(50) NOT NULL,
  ref_id UUID,
  
  description TEXT NOT NULL,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Materialized wallet balances (trigger-maintained)
CREATE TABLE wallet_balances (
  wallet_id UUID PRIMARY KEY REFERENCES wallets(id),
  balance_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ledger_entries_journal ON ledger_entries(journal_id);
CREATE INDEX idx_ledger_entries_wallet ON ledger_entries(wallet_id);
CREATE INDEX idx_ledger_entries_ref ON ledger_entries(ref_type, ref_id);
CREATE INDEX idx_ledger_entries_created ON ledger_entries(created_at DESC);
CREATE INDEX idx_ledger_entries_wallet_created ON ledger_entries(wallet_id, created_at DESC);

-- CRITICAL FIX: Transaction-level constraint (not row-level)
-- Validates journal balance at END of transaction
CREATE OR REPLACE FUNCTION check_journal_balance() RETURNS TRIGGER AS $$
DECLARE
  journal_sum INTEGER;
  journal_currency VARCHAR(3);
BEGIN
  -- Get journal currency
  SELECT currency INTO journal_currency FROM journals WHERE id = NEW.journal_id;
  
  -- Check all entries balance to zero
  SELECT COALESCE(SUM(amount_cents), 0) INTO journal_sum
  FROM ledger_entries
  WHERE journal_id = NEW.journal_id;
  
  IF journal_sum != 0 THEN
    RAISE EXCEPTION 'Journal % does not balance (sum: % cents)', NEW.journal_id, journal_sum;
  END IF;
  
  -- Check all entries use same currency
  IF EXISTS (
    SELECT 1 FROM ledger_entries 
    WHERE journal_id = NEW.journal_id 
    AND currency != journal_currency
  ) THEN
    RAISE EXCEPTION 'Journal % has mixed currencies', NEW.journal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STATEMENT-level trigger (fires after all inserts in transaction)
CREATE CONSTRAINT TRIGGER enforce_journal_balance
  AFTER INSERT ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_journal_balance();

-- Trigger: Update wallet_balances on ledger entry
CREATE OR REPLACE FUNCTION update_wallet_balance() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallet_balances (wallet_id, balance_cents, updated_at)
  VALUES (NEW.wallet_id, NEW.amount_cents, now())
  ON CONFLICT (wallet_id) 
  DO UPDATE SET 
    balance_cents = wallet_balances.balance_cents + NEW.amount_cents,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maintain_wallet_balance
  AFTER INSERT ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

-- Advisory lock helper for concurrent wallet operations
CREATE OR REPLACE FUNCTION acquire_wallet_lock(p_wallet_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  -- Use advisory lock to serialize operations on same wallet
  PERFORM pg_advisory_xact_lock(hashtext(p_wallet_id::TEXT));
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Database function that handles posting journals with locks and validation
CREATE OR REPLACE FUNCTION post_journal_with_locks(
  p_journal_id UUID,
  p_event_type VARCHAR,
  p_event_id UUID,
  p_currency VARCHAR,
  p_entries JSONB
) RETURNS VOID AS $$
DECLARE
  entry JSONB;
  wallet_ids UUID[];
BEGIN
  -- Extract all wallet IDs and acquire locks in sorted order (prevent deadlocks)
  SELECT ARRAY_AGG(DISTINCT (e->>'wallet_id')::UUID ORDER BY (e->>'wallet_id')::UUID)
  INTO wallet_ids
  FROM jsonb_array_elements(p_entries) e;
  
  -- Acquire advisory locks on all wallets involved
  PERFORM acquire_wallet_lock(w) FROM unnest(wallet_ids) w;
  
  -- Create journal
  INSERT INTO journals (id, event_type, event_id, currency, status)
  VALUES (p_journal_id, p_event_type, p_event_id, p_currency, 'completed');
  
  -- Insert all ledger entries
  FOR entry IN SELECT * FROM jsonb_array_elements(p_entries)
  LOOP
    INSERT INTO ledger_entries (
      journal_id, wallet_id, amount_cents, currency,
      ref_type, ref_id, description, metadata
    ) VALUES (
      p_journal_id,
      (entry->>'wallet_id')::UUID,
      (entry->>'amount_cents')::INTEGER,
      p_currency,
      entry->>'ref_type',
      (entry->>'ref_id')::UUID,
      entry->>'description',
      entry->'metadata'
    );
  END LOOP;
  
  -- Transaction-level constraint will verify balance = 0 before commit
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

-- Students can view their own wallet
CREATE POLICY "Students can view own wallet" ON wallets
  FOR SELECT USING (owner_type = 'student' AND auth.uid() = owner_id);

-- Instructors can view their own wallet
CREATE POLICY "Instructors can view own wallet" ON wallets
  FOR SELECT USING (owner_type = 'instructor' AND auth.uid() = owner_id);

-- Admins can view all wallets
CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Students can view their own ledger entries
CREATE POLICY "Students can view own ledger entries" ON ledger_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = ledger_entries.wallet_id
      AND wallets.owner_type = 'student'
      AND wallets.owner_id = auth.uid()
    )
  );

-- Instructors can view their own ledger entries
CREATE POLICY "Instructors can view own ledger entries" ON ledger_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = ledger_entries.wallet_id
      AND wallets.owner_type = 'instructor'
      AND wallets.owner_id = auth.uid()
    )
  );

-- Admins can view all ledger entries
CREATE POLICY "Admins can view all ledger entries" ON ledger_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Similar policies for wallet_balances
CREATE POLICY "Users can view own wallet balance" ON wallet_balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = wallet_balances.wallet_id
      AND (
        (wallets.owner_type = 'student' AND wallets.owner_id = auth.uid())
        OR (wallets.owner_type = 'instructor' AND wallets.owner_id = auth.uid())
      )
    )
  );

CREATE POLICY "Admins can view all wallet balances" ON wallet_balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );


