-- Aircraft Billing Configuration (Future Flexibility)
-- Supports DSA-owned, leased, third-party, and passthrough models
-- All amounts in INTEGER CENTS

-- Aircraft ownership/rental configuration
CREATE TABLE aircraft_billing_config (
  aircraft_id UUID PRIMARY KEY REFERENCES aircraft(id),
  
  -- Billing model
  billing_model VARCHAR(20) NOT NULL DEFAULT 'third_party' 
    CHECK (billing_model IN ('dsa_owned', 'dsa_leased', 'third_party', 'passthrough')),
  
  -- DSA-owned/leased rates (INTEGER CENTS)
  hourly_rental_rate_cents INTEGER,
  fuel_cost_per_gallon_cents INTEGER,
  average_fuel_burn_gph DECIMAL(5,2),
  
  -- Third-party passthrough
  third_party_merchant_name VARCHAR(255),
  third_party_wallet_id UUID REFERENCES wallets(id), -- If they get payouts through our system
  dsa_passthrough_fee_percentage DECIMAL(5,2), -- e.g., 3% convenience fee
  
  -- All-inclusive bundling
  can_bundle_with_instruction BOOLEAN NOT NULL DEFAULT false,
  bundled_hourly_rate_cents INTEGER, -- Includes aircraft + instructor + fuel
  
  effective_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_aircraft_billing_config_active ON aircraft_billing_config(is_active, effective_date) 
  WHERE is_active = true;
CREATE INDEX idx_aircraft_billing_config_model ON aircraft_billing_config(billing_model);

-- Aircraft billing rate history (for audit trail)
CREATE TABLE aircraft_billing_rate_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id UUID NOT NULL REFERENCES aircraft(id),
  changed_by UUID NOT NULL REFERENCES profiles(id),
  change_reason TEXT NOT NULL,
  
  old_billing_model VARCHAR(20),
  new_billing_model VARCHAR(20),
  old_hourly_rate_cents INTEGER,
  new_hourly_rate_cents INTEGER,
  old_bundled_rate_cents INTEGER,
  new_bundled_rate_cents INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_aircraft_billing_rate_changes_aircraft ON aircraft_billing_rate_changes(aircraft_id);
CREATE INDEX idx_aircraft_billing_rate_changes_date ON aircraft_billing_rate_changes(created_at DESC);

-- RLS Policies
ALTER TABLE aircraft_billing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE aircraft_billing_rate_changes ENABLE ROW LEVEL SECURITY;

-- Admins can manage aircraft billing config
CREATE POLICY "Admins can manage aircraft billing" ON aircraft_billing_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Admins can view aircraft billing rate changes
CREATE POLICY "Admins can view aircraft rate changes" ON aircraft_billing_rate_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );


