-- ============================================================================
-- INSTRUCTOR ONBOARDING SYSTEM
-- ============================================================================
-- Complete onboarding system for new instructors including:
-- - Personal information collection
-- - Document uploads (licenses, certificates, insurance)
-- - Emergency contact information
-- - 1099 contractor agreement
-- - Stripe Connect integration for payments
-- - Calendar integration (Google/Outlook)
-- ============================================================================

-- Instructor Onboarding Table
CREATE TABLE IF NOT EXISTS instructor_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progress Tracking
  current_step TEXT DEFAULT 'welcome',
  step_number INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Personal Information
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT,
  date_of_birth DATE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'United States',
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- Aviation Credentials
  cfi_certificate_number TEXT,
  cfi_expiration_date DATE,
  cfii_certificate BOOLEAN DEFAULT false,
  cfii_expiration_date DATE,
  mei_certificate BOOLEAN DEFAULT false,
  mei_expiration_date DATE,
  pilot_certificate_number TEXT,
  pilot_certificate_type TEXT, -- ATP, Commercial, etc.
  medical_certificate_class TEXT, -- First, Second, Third
  medical_expiration_date DATE,
  total_flight_hours DECIMAL(8,1),
  total_instruction_hours DECIMAL(8,1),
  
  -- Document Uploads (JSONB for flexibility)
  uploaded_documents JSONB DEFAULT '{}'::jsonb,
  
  -- Document Upload Flags
  government_id_uploaded BOOLEAN DEFAULT false,
  pilot_certificate_uploaded BOOLEAN DEFAULT false,
  cfi_certificate_uploaded BOOLEAN DEFAULT false,
  medical_certificate_uploaded BOOLEAN DEFAULT false,
  birth_certificate_uploaded BOOLEAN DEFAULT false,
  
  -- Insurance
  insurance_acknowledged BOOLEAN DEFAULT false,
  insurance_policy_uploaded BOOLEAN DEFAULT false,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiration_date DATE,
  
  -- 1099 Contractor Agreement
  contractor_agreement_signed BOOLEAN DEFAULT false,
  contractor_agreement_signed_at TIMESTAMP WITH TIME ZONE,
  contractor_agreement_ip_address TEXT,
  contractor_agreement_signature_data TEXT, -- Base64 signature image
  
  -- Stripe Connect
  stripe_connect_initiated BOOLEAN DEFAULT false,
  stripe_connect_completed BOOLEAN DEFAULT false,
  stripe_connect_account_id TEXT,
  
  -- Calendar Integration
  calendar_integration_completed BOOLEAN DEFAULT false,
  calendar_provider TEXT, -- 'google', 'outlook', or NULL
  calendar_connection_id UUID, -- References calendar_connections table
  
  -- Step Completion Tracking
  completed_steps JSONB DEFAULT '{}'::jsonb,
  welcome_completed BOOLEAN DEFAULT false,
  personal_info_completed BOOLEAN DEFAULT false,
  aviation_background_completed BOOLEAN DEFAULT false,
  emergency_contact_completed BOOLEAN DEFAULT false,
  document_upload_completed BOOLEAN DEFAULT false,
  insurance_completed BOOLEAN DEFAULT false,
  contractor_agreement_completed BOOLEAN DEFAULT false,
  stripe_connect_completed_step BOOLEAN DEFAULT false,
  calendar_integration_completed_step BOOLEAN DEFAULT false,
  
  -- Admin Approval
  admin_approved BOOLEAN DEFAULT false,
  admin_approved_by UUID REFERENCES auth.users(id),
  admin_approved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_instructor_onboarding_user_id ON instructor_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_onboarding_completed ON instructor_onboarding(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_instructor_onboarding_current_step ON instructor_onboarding(current_step);
CREATE INDEX IF NOT EXISTS idx_instructor_onboarding_admin_approval ON instructor_onboarding(admin_approved) WHERE admin_approved = false;

-- Instructor Invitation Tokens Table
CREATE TABLE IF NOT EXISTS instructor_invitation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  
  -- Invitation Details
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Role and Permissions
  roles TEXT[] DEFAULT ARRAY['instructor']::TEXT[], -- Can be ['instructor', 'admin']
  permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Usage Tracking
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for invitation tokens
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_token ON instructor_invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_email ON instructor_invitation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_used ON instructor_invitation_tokens(used) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_expires ON instructor_invitation_tokens(expires_at);

-- RLS Policies for instructor_onboarding
ALTER TABLE instructor_onboarding ENABLE ROW LEVEL SECURITY;

-- Instructors can view and update their own onboarding
CREATE POLICY "Instructors can view own onboarding"
  ON instructor_onboarding FOR SELECT
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Instructors can update own onboarding"
  ON instructor_onboarding FOR UPDATE
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Instructors can insert own onboarding"
  ON instructor_onboarding FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Admins can view all onboarding records
CREATE POLICY "Admins can view all instructor onboarding"
  ON instructor_onboarding FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Admins can update all onboarding records (for approval)
CREATE POLICY "Admins can update all instructor onboarding"
  ON instructor_onboarding FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- RLS Policies for instructor_invitation_tokens
ALTER TABLE instructor_invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitation tokens
CREATE POLICY "Admins can view invitation tokens"
  ON instructor_invitation_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can create invitation tokens"
  ON instructor_invitation_tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can update invitation tokens"
  ON instructor_invitation_tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_instructor_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on instructor_onboarding
DROP TRIGGER IF EXISTS trigger_update_instructor_onboarding_updated_at ON instructor_onboarding;
CREATE TRIGGER trigger_update_instructor_onboarding_updated_at
  BEFORE UPDATE ON instructor_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_instructor_onboarding_updated_at();

-- Comments for documentation
COMMENT ON TABLE instructor_onboarding IS 'Tracks instructor onboarding progress including documents, agreements, and integrations';
COMMENT ON TABLE instructor_invitation_tokens IS 'Secure invitation tokens for new instructor registration';
COMMENT ON COLUMN instructor_onboarding.uploaded_documents IS 'JSONB object storing document metadata: {document_type: {name, url, path, uploaded_at, size, type}}';
COMMENT ON COLUMN instructor_onboarding.completed_steps IS 'JSONB object tracking completion of each onboarding step';
COMMENT ON COLUMN instructor_invitation_tokens.roles IS 'Array of roles to assign (e.g., [''instructor'', ''admin''])';
COMMENT ON COLUMN instructor_invitation_tokens.permissions IS 'JSONB object for fine-grained permissions';

-- ============================================================================
-- SAMPLE QUERIES FOR TESTING
-- ============================================================================

-- Get incomplete instructor onboarding records
-- SELECT 
--   io.id,
--   io.user_id,
--   p.first_name,
--   p.last_name,
--   p.email,
--   io.current_step,
--   io.step_number,
--   io.created_at,
--   io.last_activity_at
-- FROM instructor_onboarding io
-- JOIN profiles p ON p.id = io.user_id
-- WHERE io.completed_at IS NULL
-- ORDER BY io.last_activity_at DESC;

-- Get pending admin approvals
-- SELECT 
--   io.id,
--   io.user_id,
--   p.first_name,
--   p.last_name,
--   p.email,
--   io.completed_at,
--   io.admin_approved
-- FROM instructor_onboarding io
-- JOIN profiles p ON p.id = io.user_id
-- WHERE io.completed_at IS NOT NULL
-- AND io.admin_approved = false
-- ORDER BY io.completed_at DESC;

-- Get active invitation tokens
-- SELECT 
--   token,
--   email,
--   invited_at,
--   expires_at,
--   used,
--   roles
-- FROM instructor_invitation_tokens
-- WHERE used = false
-- AND expires_at > NOW()
-- ORDER BY invited_at DESC;

