-- ============================================================================
-- ORGANIZATION SETTINGS TABLE
-- ============================================================================
-- Purpose: Store configurable organization-wide settings
-- Used by: Admin settings page, pre-brief workflow, various features
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Reference
  -- For multi-tenant support - can reference a specific organization
  -- For single-tenant (Desert Skies), this can be NULL or single record
  organization_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name TEXT,
  
  -- Pre-Brief & POA Settings
  require_poa_acknowledgement BOOLEAN DEFAULT false,
  
  -- Future Settings (Placeholders for expansion)
  require_risk_assessment BOOLEAN DEFAULT true,
  allow_instructor_self_approval BOOLEAN DEFAULT false,
  auto_generate_poa BOOLEAN DEFAULT true,
  
  -- Notification Settings
  send_mission_reminders BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  
  -- Scheduling Settings
  min_scheduling_notice_hours INTEGER DEFAULT 24,
  max_daily_flight_hours DECIMAL(3,1) DEFAULT 8.0,
  
  -- Billing Settings
  default_currency TEXT DEFAULT 'USD',
  require_payment_before_flight BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_settings_org_id ON organization_settings(organization_id);

-- Comments
COMMENT ON TABLE organization_settings IS 'Organization-wide configurable settings';
COMMENT ON COLUMN organization_settings.require_poa_acknowledgement IS 'When true, instructors cannot complete pre-brief until student acknowledges POA';
COMMENT ON COLUMN organization_settings.require_risk_assessment IS 'When true, students must complete risk assessment before flight';
COMMENT ON COLUMN organization_settings.auto_generate_poa IS 'When true, automatically generate POA from lesson template on mission creation';

-- RLS Policies
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Admins can view all settings
CREATE POLICY "Admins can view organization settings" ON organization_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Admins can update settings
CREATE POLICY "Admins can update organization settings" ON organization_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Admins can insert settings
CREATE POLICY "Admins can insert organization settings" ON organization_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Instructors and students can view settings (read-only)
CREATE POLICY "Users can view organization settings" ON organization_settings
    FOR SELECT USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_organization_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organization_settings_updated_at ON organization_settings;
CREATE TRIGGER update_organization_settings_updated_at 
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_organization_settings_updated_at();

-- Insert default settings for Desert Skies Aviation
INSERT INTO organization_settings (
  organization_name,
  require_poa_acknowledgement,
  require_risk_assessment,
  auto_generate_poa,
  send_mission_reminders,
  reminder_hours_before,
  min_scheduling_notice_hours,
  max_daily_flight_hours,
  default_currency,
  require_payment_before_flight
) VALUES (
  'Desert Skies Aviation',
  false,  -- Default to nice-to-have as requested
  true,
  true,
  true,
  24,
  24,
  8.0,
  'USD',
  false
) ON CONFLICT DO NOTHING;

