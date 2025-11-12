-- =====================================================
-- DISCOVERY FLIGHT SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Created: 2025-01-24
-- Description: Streamlined onboarding for discovery flight customers
-- 
-- Features:
-- - Lightning-fast mobile-optimized onboarding
-- - Stripe payment integration
-- - Groupon code validation
-- - Automated email workflows
-- - CRM integration (Outlook/Apple Contacts)
-- - Instructor assignment
-- - Conversion to full student enrollment
-- =====================================================

-- =====================================================
-- 1. DISCOVERY FLIGHTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS discovery_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer Information
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  
  -- Booking Source
  booking_source TEXT NOT NULL DEFAULT 'website' 
    CHECK (booking_source IN ('website', 'groupon', 'cal_com', 'referral', 'other')),
  booking_reference TEXT,  -- Cal.com booking ID or other reference
  
  -- Payment Status
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'groupon_verified', 'refunded', 'failed')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'groupon', 'cash', 'other')),
  
  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_paid_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Groupon Integration
  groupon_code TEXT,
  groupon_verified BOOLEAN DEFAULT false,
  groupon_verified_at TIMESTAMP WITH TIME ZONE,
  groupon_order_id TEXT,
  
  -- Onboarding Status
  onboarding_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (onboarding_status IN ('pending', 'in_progress', 'completed', 'expired')),
  onboarding_started_at TIMESTAMP WITH TIME ZONE,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  onboarding_expires_at TIMESTAMP WITH TIME ZONE,  -- 30 days from creation
  
  -- Onboarding Steps Completed
  steps_completed JSONB DEFAULT '{
    "personal_info": false,
    "id_upload": false,
    "liability_waiver": false,
    "payment": false
  }'::jsonb,
  
  -- Documents
  id_document_path TEXT,  -- Path in Supabase storage
  id_document_type TEXT CHECK (id_document_type IN ('drivers_license', 'passport', 'state_id', 'other')),
  id_verified BOOLEAN DEFAULT false,
  id_verified_at TIMESTAMP WITH TIME ZONE,
  id_verified_by UUID REFERENCES profiles(id),
  
  -- Liability Waiver
  waiver_signed BOOLEAN DEFAULT false,
  waiver_signed_at TIMESTAMP WITH TIME ZONE,
  waiver_signature_data JSONB,  -- { name, signature, ip_address, user_agent }
  
  -- Flight Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  scheduled_instructor_id UUID REFERENCES profiles(id),
  scheduled_aircraft_id UUID REFERENCES aircraft(id),
  
  -- Flight Status
  flight_status TEXT DEFAULT 'not_scheduled'
    CHECK (flight_status IN ('not_scheduled', 'scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  flight_completed_at TIMESTAMP WITH TIME ZONE,
  flight_cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Mission Link (if flight completed)
  mission_id UUID REFERENCES missions(id),
  
  -- Conversion to Student
  converted_to_student BOOLEAN DEFAULT false,
  student_profile_id UUID REFERENCES profiles(id),
  converted_at TIMESTAMP WITH TIME ZONE,
  enrolled_in_syllabus_id UUID REFERENCES syllabi(id),
  
  -- CRM Integration
  outlook_contact_id TEXT,
  outlook_synced_at TIMESTAMP WITH TIME ZONE,
  apple_contact_id TEXT,
  apple_synced_at TIMESTAMP WITH TIME ZONE,
  
  -- Communication
  confirmation_email_sent BOOLEAN DEFAULT false,
  confirmation_email_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_email_sent BOOLEAN DEFAULT false,
  reminder_email_sent_at TIMESTAMP WITH TIME ZONE,
  follow_up_email_sent BOOLEAN DEFAULT false,
  follow_up_email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  customer_notes TEXT,  -- Notes from customer during onboarding
  admin_notes TEXT,  -- Internal notes
  special_requests TEXT,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  referral_source TEXT,
  utm_campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discovery_flights_email ON discovery_flights(email);
CREATE INDEX IF NOT EXISTS idx_discovery_flights_status ON discovery_flights(onboarding_status, flight_status);
CREATE INDEX IF NOT EXISTS idx_discovery_flights_payment ON discovery_flights(payment_status);
CREATE INDEX IF NOT EXISTS idx_discovery_flights_scheduled_date ON discovery_flights(scheduled_date) WHERE flight_status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_discovery_flights_instructor ON discovery_flights(scheduled_instructor_id);
CREATE INDEX IF NOT EXISTS idx_discovery_flights_stripe_customer ON discovery_flights(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discovery_flights_groupon ON discovery_flights(groupon_code) WHERE groupon_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discovery_flights_converted ON discovery_flights(converted_to_student, converted_at);
CREATE INDEX IF NOT EXISTS idx_discovery_flights_created ON discovery_flights(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_discovery_flights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_discovery_flights_updated_at
  BEFORE UPDATE ON discovery_flights
  FOR EACH ROW
  EXECUTE FUNCTION update_discovery_flights_updated_at();

-- =====================================================
-- 2. GROUPON CODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS groupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Code Details
  code TEXT NOT NULL UNIQUE,
  groupon_deal_id TEXT,
  groupon_order_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'redeemed', 'expired', 'invalid', 'refunded')),
  
  -- Redemption
  redeemed_by_discovery_flight_id UUID REFERENCES discovery_flights(id),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by_email TEXT,
  
  -- Validity
  valid_from DATE,
  valid_until DATE,
  
  -- Value
  value_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Metadata
  groupon_api_response JSONB,  -- Store full API response
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groupon_codes_code ON groupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_groupon_codes_status ON groupon_codes(status);
CREATE INDEX IF NOT EXISTS idx_groupon_codes_redeemed ON groupon_codes(redeemed_by_discovery_flight_id) WHERE redeemed_by_discovery_flight_id IS NOT NULL;

-- =====================================================
-- 3. DISCOVERY FLIGHT ACTIVITY LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS discovery_flight_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_flight_id UUID NOT NULL REFERENCES discovery_flights(id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created',
    'onboarding_started',
    'step_completed',
    'payment_received',
    'groupon_verified',
    'waiver_signed',
    'id_uploaded',
    'flight_scheduled',
    'flight_rescheduled',
    'flight_completed',
    'flight_cancelled',
    'instructor_assigned',
    'email_sent',
    'crm_synced',
    'converted_to_student',
    'note_added',
    'status_changed'
  )),
  
  activity_description TEXT NOT NULL,
  activity_metadata JSONB,
  
  -- Actor
  performed_by UUID REFERENCES profiles(id),
  performed_by_role TEXT,  -- 'customer', 'admin', 'instructor', 'system'
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_flight_activity_flight ON discovery_flight_activity_log(discovery_flight_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_flight_activity_type ON discovery_flight_activity_log(activity_type, created_at DESC);

-- =====================================================
-- 4. DISCOVERY FLIGHT EMAIL QUEUE
-- =====================================================

CREATE TABLE IF NOT EXISTS discovery_flight_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_flight_id UUID NOT NULL REFERENCES discovery_flights(id) ON DELETE CASCADE,
  
  -- Email Details
  email_type TEXT NOT NULL CHECK (email_type IN (
    'confirmation',
    'reminder_24h',
    'reminder_1h',
    'follow_up_immediate',
    'follow_up_3day',
    'follow_up_7day',
    'conversion_offer',
    'abandoned_onboarding'
  )),
  
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Template
  template_id TEXT,
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  
  -- Personalization
  template_variables JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  
  -- Scheduling
  scheduled_send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery
  email_provider TEXT,  -- 'resend', 'sendgrid', etc.
  provider_message_id TEXT,
  provider_response JSONB,
  
  -- Tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced BOOLEAN DEFAULT false,
  bounce_reason TEXT,
  
  -- Retry Logic
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_email_queue_flight ON discovery_flight_email_queue(discovery_flight_id);
CREATE INDEX IF NOT EXISTS idx_discovery_email_queue_status ON discovery_flight_email_queue(status, scheduled_send_at);
CREATE INDEX IF NOT EXISTS idx_discovery_email_queue_pending ON discovery_flight_email_queue(status, scheduled_send_at) 
  WHERE status = 'pending' AND scheduled_send_at <= NOW();
CREATE INDEX IF NOT EXISTS idx_discovery_email_queue_type ON discovery_flight_email_queue(email_type, status);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE discovery_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE groupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_flight_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_flight_email_queue ENABLE ROW LEVEL SECURITY;

-- Discovery Flights: Admins and instructors can view all, customers can view their own (via email match)
CREATE POLICY "Admins can view all discovery flights"
  ON discovery_flights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Instructors can view assigned discovery flights"
  ON discovery_flights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'instructor'
    )
    AND (
      scheduled_instructor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR scheduled_instructor_id IS NULL
    )
  );

CREATE POLICY "Customers can view their own discovery flight"
  ON discovery_flights FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins and instructors can update discovery flights"
  ON discovery_flights FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'instructor')
    )
  );

CREATE POLICY "System can insert discovery flights"
  ON discovery_flights FOR INSERT
  WITH CHECK (true);  -- Public insert for onboarding flow

-- Groupon Codes: Admins only
CREATE POLICY "Admins can manage groupon codes"
  ON groupon_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Activity Log: Read-only for admins/instructors
CREATE POLICY "Admins and instructors can view activity logs"
  ON discovery_flight_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'instructor')
    )
  );

CREATE POLICY "System can insert activity logs"
  ON discovery_flight_activity_log FOR INSERT
  WITH CHECK (true);

-- Email Queue: Admins only
CREATE POLICY "Admins can view email queue"
  ON discovery_flight_email_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "System can manage email queue"
  ON discovery_flight_email_queue FOR ALL
  WITH CHECK (true);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to check if onboarding is complete
CREATE OR REPLACE FUNCTION is_discovery_flight_onboarding_complete(p_discovery_flight_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_steps JSONB;
  v_all_complete BOOLEAN;
BEGIN
  SELECT steps_completed INTO v_steps
  FROM discovery_flights
  WHERE id = p_discovery_flight_id;
  
  -- Check if all required steps are true
  v_all_complete := (
    (v_steps->>'personal_info')::boolean = true AND
    (v_steps->>'id_upload')::boolean = true AND
    (v_steps->>'liability_waiver')::boolean = true AND
    (v_steps->>'payment')::boolean = true
  );
  
  RETURN v_all_complete;
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_discovery_flight_activity(
  p_discovery_flight_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL,
  p_performed_by_role TEXT DEFAULT 'system'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO discovery_flight_activity_log (
    discovery_flight_id,
    activity_type,
    activity_description,
    activity_metadata,
    performed_by,
    performed_by_role
  )
  VALUES (
    p_discovery_flight_id,
    p_activity_type,
    p_description,
    p_metadata,
    p_performed_by,
    p_performed_by_role
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule email
CREATE OR REPLACE FUNCTION schedule_discovery_flight_email(
  p_discovery_flight_id UUID,
  p_email_type TEXT,
  p_scheduled_send_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
  v_email_id UUID;
  v_email TEXT;
  v_name TEXT;
BEGIN
  -- Get customer email and name
  SELECT email, first_name || ' ' || last_name
  INTO v_email, v_name
  FROM discovery_flights
  WHERE id = p_discovery_flight_id;
  
  -- Insert email into queue
  INSERT INTO discovery_flight_email_queue (
    discovery_flight_id,
    email_type,
    recipient_email,
    recipient_name,
    scheduled_send_at
  )
  VALUES (
    p_discovery_flight_id,
    p_email_type,
    v_email,
    v_name,
    p_scheduled_send_at
  )
  RETURNING id INTO v_email_id;
  
  RETURN v_email_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. AUTOMATED TRIGGERS
-- =====================================================

-- Trigger to set onboarding expiration (30 days from creation)
CREATE OR REPLACE FUNCTION set_discovery_flight_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.onboarding_expires_at IS NULL THEN
    NEW.onboarding_expires_at := NEW.created_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_discovery_flight_expiration
  BEFORE INSERT ON discovery_flights
  FOR EACH ROW
  EXECUTE FUNCTION set_discovery_flight_expiration();

-- Trigger to update onboarding status when all steps complete
CREATE OR REPLACE FUNCTION update_discovery_flight_onboarding_status()
RETURNS TRIGGER AS $$
BEGIN
  IF is_discovery_flight_onboarding_complete(NEW.id) AND NEW.onboarding_status != 'completed' THEN
    NEW.onboarding_status := 'completed';
    NEW.onboarding_completed_at := NOW();
    
    -- Log activity
    PERFORM log_discovery_flight_activity(
      NEW.id,
      'step_completed',
      'Onboarding completed - all steps finished',
      jsonb_build_object('steps', NEW.steps_completed),
      NULL,
      'system'
    );
    
    -- Schedule follow-up email
    PERFORM schedule_discovery_flight_email(
      NEW.id,
      'follow_up_immediate',
      NOW() + INTERVAL '1 hour'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discovery_flight_onboarding_status
  BEFORE UPDATE ON discovery_flights
  FOR EACH ROW
  WHEN (OLD.steps_completed IS DISTINCT FROM NEW.steps_completed)
  EXECUTE FUNCTION update_discovery_flight_onboarding_status();

-- =====================================================
-- 8. USEFUL VIEWS
-- =====================================================

-- View: Discovery Flights Dashboard
CREATE OR REPLACE VIEW discovery_flights_dashboard AS
SELECT 
  df.*,
  p_instructor.first_name || ' ' || p_instructor.last_name as instructor_name,
  p_instructor.email as instructor_email,
  a.tail_number as aircraft_tail_number,
  a.make_model as aircraft_make_model,
  CASE 
    WHEN df.onboarding_status = 'completed' AND df.flight_status = 'not_scheduled' THEN 'ready_to_schedule'
    WHEN df.onboarding_status = 'in_progress' THEN 'onboarding'
    WHEN df.flight_status = 'scheduled' THEN 'scheduled'
    WHEN df.flight_status = 'completed' AND NOT df.converted_to_student THEN 'conversion_opportunity'
    WHEN df.converted_to_student THEN 'converted'
    ELSE 'pending'
  END as workflow_stage,
  CASE 
    WHEN df.onboarding_expires_at < NOW() AND df.onboarding_status != 'completed' THEN true
    ELSE false
  END as is_expired,
  (SELECT COUNT(*) FROM discovery_flight_activity_log WHERE discovery_flight_id = df.id) as activity_count
FROM discovery_flights df
LEFT JOIN profiles p_instructor ON df.scheduled_instructor_id = p_instructor.id
LEFT JOIN aircraft a ON df.scheduled_aircraft_id = a.id;

COMMENT ON VIEW discovery_flights_dashboard IS 'Comprehensive view of discovery flights with workflow stages';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Discovery Flight System schema created successfully.';
  RAISE NOTICE 'Created 4 new tables:';
  RAISE NOTICE '  - discovery_flights';
  RAISE NOTICE '  - groupon_codes';
  RAISE NOTICE '  - discovery_flight_activity_log';
  RAISE NOTICE '  - discovery_flight_email_queue';
  RAISE NOTICE 'Added comprehensive RLS policies';
  RAISE NOTICE 'Created helper functions and automated triggers';
  RAISE NOTICE 'Ready for discovery flight onboarding workflow!';
END $$;


