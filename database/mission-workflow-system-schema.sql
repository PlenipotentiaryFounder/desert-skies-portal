-- =====================================================
-- MISSION WORKFLOW SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Created: 2025-01-24
-- Description: Comprehensive mission-based training workflow system
-- 
-- Architecture Overview:
-- - Missions: Pedagogical wrappers for complete training experiences
-- - Training Events: Atomic billable units (pre-brief, flight, ground, post-brief)
-- - Lesson Templates: Reusable blueprints from syllabi
-- - Plans of Action: Pre-mission preparation (AI-assisted)
-- - Debriefs: Post-mission documentation (AI-formatted)
-- - Maneuver Tracking: Longitudinal student proficiency monitoring
-- =====================================================

-- =====================================================
-- 1. ENHANCE EXISTING MANEUVERS TABLE
-- =====================================================

-- Add ACS and FAR reference columns to existing maneuvers table
ALTER TABLE maneuvers 
  ADD COLUMN IF NOT EXISTS primary_acs_task_code TEXT,
  ADD COLUMN IF NOT EXISTS related_acs_task_codes TEXT[],
  ADD COLUMN IF NOT EXISTS far_references JSONB;

COMMENT ON COLUMN maneuvers.primary_acs_task_code IS 'Primary ACS task code (e.g., PA.V.B)';
COMMENT ON COLUMN maneuvers.related_acs_task_codes IS 'Array of related ACS task codes';
COMMENT ON COLUMN maneuvers.far_references IS 'Array of FAR references: [{"reference": "§61.107(b)(1)(iv)", "description": "...", "certificate_type": "private_pilot"}]';

-- =====================================================
-- 2. MANEUVER-ACS LINKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS maneuver_acs_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maneuver_id UUID NOT NULL REFERENCES maneuvers(id) ON DELETE CASCADE,
  acs_task_id UUID NOT NULL REFERENCES acs_tasks(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(maneuver_id, acs_task_id)
);

CREATE INDEX IF NOT EXISTS idx_maneuver_acs_tasks_maneuver ON maneuver_acs_tasks(maneuver_id);
CREATE INDEX IF NOT EXISTS idx_maneuver_acs_tasks_acs_task ON maneuver_acs_tasks(acs_task_id);

COMMENT ON TABLE maneuver_acs_tasks IS 'Links maneuvers to their corresponding ACS tasks';

-- =====================================================
-- 3. LESSON TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS lesson_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID REFERENCES syllabi(id) ON DELETE SET NULL,
  
  -- Identity
  lesson_code TEXT NOT NULL UNIQUE,  -- "PPC-L5", "IFR-L12"
  lesson_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Session Type
  session_type TEXT NOT NULL CHECK (session_type IN ('flight', 'ground', 'simulator')),
  estimated_duration_minutes INTEGER DEFAULT 120,
  
  -- Pre-Brief Content Template
  prebrief_objectives TEXT[],
  prebrief_topics JSONB,
  prebrief_resources JSONB[],
  
  -- Main Session Content
  learning_objectives TEXT[],
  maneuvers JSONB[],  -- [{ maneuver_id, target_standard, is_required, notes }]
  
  -- Post-Brief Content Template
  postbrief_focus_areas TEXT[],
  debrief_prompts TEXT[],
  
  -- Metadata
  prerequisite_lesson_ids UUID[],
  suggested_next_lesson_id UUID,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_templates_syllabus ON lesson_templates(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_lesson_templates_code ON lesson_templates(lesson_code);
CREATE INDEX IF NOT EXISTS idx_lesson_templates_active ON lesson_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_lesson_templates_session_type ON lesson_templates(session_type);

COMMENT ON TABLE lesson_templates IS 'Reusable lesson blueprints for creating missions';
COMMENT ON COLUMN lesson_templates.maneuvers IS 'JSONB array of maneuver configurations with target standards';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_lesson_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lesson_templates_updated_at
  BEFORE UPDATE ON lesson_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_templates_updated_at();

-- =====================================================
-- 4. MISSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  assigned_instructor_id UUID NOT NULL REFERENCES profiles(id),
  student_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Identity (Progressive Numbering)
  mission_code TEXT NOT NULL UNIQUE,  -- "DSA-PPC-F14"
  mission_number INTEGER NOT NULL,
  program_code TEXT NOT NULL,  -- "PPC", "IFR", "CPL"
  mission_type TEXT NOT NULL CHECK (mission_type IN ('F', 'G', 'S')),  -- Flight, Ground, Sim
  
  -- Lesson Template (Optional - can be null for fully custom missions)
  lesson_template_id UUID REFERENCES lesson_templates(id) ON DELETE SET NULL,
  lesson_code TEXT,  -- Denormalized for display
  template_snapshot JSONB,  -- Frozen at creation
  customizations JSONB,  -- What instructor changed
  is_customized BOOLEAN DEFAULT false,
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME,
  
  -- Aircraft Assignment (can change if aircraft unavailable)
  scheduled_aircraft_id UUID REFERENCES aircraft(id),
  actual_aircraft_id UUID REFERENCES aircraft(id),
  aircraft_changed BOOLEAN DEFAULT false,
  aircraft_change_reason TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'partially_completed')),
  instructor_assessment TEXT 
    CHECK (instructor_assessment IN ('satisfactory', 'needs_more_practice', 'outstanding')),
  
  -- Related Content (Foreign keys to associated records)
  plan_of_action_id UUID,  -- Will reference plans_of_action(id)
  debrief_id UUID,  -- Will reference debriefs(id)
  
  -- Totals (Calculated from training_events)
  total_cost_cents INTEGER DEFAULT 0,
  total_flight_hours DECIMAL(4,2) DEFAULT 0,
  total_ground_hours DECIMAL(4,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_missions_enrollment ON missions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_missions_instructor ON missions(assigned_instructor_id);
CREATE INDEX IF NOT EXISTS idx_missions_student ON missions(student_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_date ON missions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_missions_code ON missions(mission_code);
CREATE INDEX IF NOT EXISTS idx_missions_template ON missions(lesson_template_id);
CREATE INDEX IF NOT EXISTS idx_missions_completed ON missions(completed_at) WHERE status = 'completed';

COMMENT ON TABLE missions IS 'Organizational wrapper for complete training experiences';
COMMENT ON COLUMN missions.mission_code IS 'Unique progressive identifier (e.g., DSA-PPC-F14)';
COMMENT ON COLUMN missions.template_snapshot IS 'Frozen copy of lesson template at mission creation';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW
  EXECUTE FUNCTION update_missions_updated_at();

-- =====================================================
-- 5. TRAINING EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS training_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES student_enrollments(id),
  
  -- Assignment (Can differ from mission instructor for substitutions)
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  student_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Event Classification
  event_type TEXT NOT NULL CHECK (event_type IN ('prebrief', 'flight', 'ground', 'simulator', 'postbrief')),
  event_sequence INTEGER NOT NULL,  -- Order within mission (1, 2, 3, 4)
  
  -- Billing (Student Charge)
  billing_category TEXT NOT NULL CHECK (billing_category IN ('flight_instruction', 'ground_instruction', 'simulator_instruction')),
  scheduled_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  billable_hours DECIMAL(4,2),
  student_billing_rate_dollars DECIMAL(8,2),
  student_charge_cents INTEGER,
  
  -- Instructor Payout
  instructor_payout_rate_cents INTEGER,
  instructor_payout_cents INTEGER,
  
  -- DSA Margin
  dsa_margin_cents INTEGER,  -- Calculated: student_charge - instructor_payout
  
  -- Payment Status
  student_payment_status TEXT DEFAULT 'pending' 
    CHECK (student_payment_status IN ('pending', 'paid', 'refunded', 'disputed')),
  instructor_payout_status TEXT DEFAULT 'pending'
    CHECK (instructor_payout_status IN ('pending', 'scheduled', 'paid', 'failed')),
  
  -- Ledger Integration
  ledger_journal_id UUID,  -- Links to double-entry ledger
  
  -- Flight-Specific (Nullable for ground events)
  aircraft_id UUID REFERENCES aircraft(id),
  hobbs_start DECIMAL(8,2),
  hobbs_end DECIMAL(8,2),
  tach_start DECIMAL(8,2),
  tach_end DECIMAL(8,2),
  
  -- Timing
  scheduled_start_time TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  
  -- Content
  objectives_covered TEXT[],
  notes TEXT,
  weather_conditions JSONB,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  completed_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_training_events_mission ON training_events(mission_id);
CREATE INDEX IF NOT EXISTS idx_training_events_instructor ON training_events(instructor_id);
CREATE INDEX IF NOT EXISTS idx_training_events_student ON training_events(student_id);
CREATE INDEX IF NOT EXISTS idx_training_events_status ON training_events(status);
CREATE INDEX IF NOT EXISTS idx_training_events_date ON training_events(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_training_events_type ON training_events(event_type);
CREATE INDEX IF NOT EXISTS idx_training_events_payment_status ON training_events(student_payment_status);

COMMENT ON TABLE training_events IS 'Atomic billable units within missions (pre-brief, flight, ground, post-brief)';
COMMENT ON COLUMN training_events.event_sequence IS 'Order of event within mission for proper chronology';
COMMENT ON COLUMN training_events.dsa_margin_cents IS 'Profit margin: student_charge - instructor_payout';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_training_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_training_events_updated_at
  BEFORE UPDATE ON training_events
  FOR EACH ROW
  EXECUTE FUNCTION update_training_events_updated_at();

-- =====================================================
-- 6. PLANS OF ACTION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS plans_of_action (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  
  -- POA Header (DSA Format)
  flight_number INTEGER,
  aircraft_tail_number TEXT,
  departure_direction TEXT,
  destination_airport TEXT,
  duration_hours DECIMAL(3,1) DEFAULT 2.0,
  
  -- Mission Overview (Narrative)
  mission_overview TEXT,
  
  -- Training Objectives
  training_objectives TEXT[],
  
  -- Student Focus Notes (From last 3 debriefs)
  student_focus_notes TEXT[],
  prior_debrief_ids UUID[],
  prior_debrief_insights JSONB,  -- What AI extracted from debriefs
  
  -- Pre-Flight Study Material
  video_resources JSONB[],  -- [{ title, url, verified, verified_at }]
  faa_references JSONB[],   -- [{ title, url, verified }]
  
  -- Student Prep Checklist
  prep_checklist_items TEXT[],
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'shared', 'acknowledged', 'archived')),
  shared_with_student_at TIMESTAMP WITH TIME ZONE,
  student_acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- AI Metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_model_used TEXT,
  ai_generation_time_ms INTEGER,
  ai_sources JSONB,  -- What data informed generation
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poa_mission ON plans_of_action(mission_id);
CREATE INDEX IF NOT EXISTS idx_poa_student ON plans_of_action(student_id);
CREATE INDEX IF NOT EXISTS idx_poa_instructor ON plans_of_action(instructor_id);
CREATE INDEX IF NOT EXISTS idx_poa_status ON plans_of_action(status);

COMMENT ON TABLE plans_of_action IS 'Pre-mission preparation documents following DSA POA format';
COMMENT ON COLUMN plans_of_action.prior_debrief_insights IS 'AI-extracted insights from previous debriefs';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_plans_of_action_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_plans_of_action_updated_at
  BEFORE UPDATE ON plans_of_action
  FOR EACH ROW
  EXECUTE FUNCTION update_plans_of_action_updated_at();

-- Add foreign key constraint to missions table
ALTER TABLE missions 
  ADD CONSTRAINT fk_missions_poa 
  FOREIGN KEY (plan_of_action_id) 
  REFERENCES plans_of_action(id) 
  ON DELETE SET NULL;

-- =====================================================
-- 7. DEBRIEFS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  
  flight_number INTEGER,
  
  -- Maneuvers (LINKED TO DATABASE VIA UUIDs)
  maneuvers_covered UUID[],  -- Array of maneuver UUIDs
  maneuver_details JSONB[],
  
  -- Regulations Discussed (LINKED)
  far_references JSONB[],
  
  -- ACS Tasks (LINKED)
  acs_tasks_covered UUID[],  -- Array of acs_task UUIDs
  acs_task_details JSONB[],
  
  -- Debrief Content (DSA Template Format)
  general_overview TEXT,  -- 2-5 sentence narrative
  key_takeaways JSONB[],
  next_lesson_plan TEXT,
  
  -- Raw Transcript
  raw_transcript TEXT,
  transcript_duration_seconds INTEGER,
  
  -- AI Processing
  ai_formatted BOOLEAN DEFAULT false,
  ai_model_used TEXT,
  ai_confidence_score DECIMAL(3,2),
  ai_processing_time_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_debriefs_mission ON debriefs(mission_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_student ON debriefs(student_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_instructor ON debriefs(instructor_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_date ON debriefs(created_at);

COMMENT ON TABLE debriefs IS 'Post-mission documentation following DSA Debrief Template';
COMMENT ON COLUMN debriefs.maneuvers_covered IS 'Array of maneuver UUIDs from database';
COMMENT ON COLUMN debriefs.maneuver_details IS 'JSONB array with maneuver performance details';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_debriefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_debriefs_updated_at
  BEFORE UPDATE ON debriefs
  FOR EACH ROW
  EXECUTE FUNCTION update_debriefs_updated_at();

-- Add foreign key constraint to missions table
ALTER TABLE missions 
  ADD CONSTRAINT fk_missions_debrief 
  FOREIGN KEY (debrief_id) 
  REFERENCES debriefs(id) 
  ON DELETE SET NULL;

-- =====================================================
-- 8. ENHANCED MANEUVER SCORES TABLE
-- =====================================================

-- Drop existing maneuver_scores table if it exists (check first)
-- Then recreate with enhanced schema

CREATE TABLE IF NOT EXISTS maneuver_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  training_event_id UUID NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Maneuver
  maneuver_id UUID NOT NULL REFERENCES maneuvers(id),
  maneuver_name TEXT NOT NULL,  -- Denormalized
  acs_task_code TEXT,
  
  -- Scoring (1-4 scale with descriptors)
  performance_level TEXT NOT NULL CHECK (performance_level IN ('unsatisfactory', 'progressing', 'proficient', 'exceptional')),
  numeric_score INTEGER NOT NULL CHECK (numeric_score BETWEEN 1 AND 4),
  acs_standard_met BOOLEAN,
  
  -- Rich Context
  instructor_notes TEXT,
  areas_of_strength TEXT[],
  areas_for_improvement TEXT[],
  specific_observations JSONB,
  
  -- Attempt Tracking (for this maneuver lifetime)
  student_attempt_number INTEGER,  -- How many times student has attempted THIS maneuver
  
  scored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maneuver_scores_mission ON maneuver_scores(mission_id);
CREATE INDEX IF NOT EXISTS idx_maneuver_scores_event ON maneuver_scores(training_event_id);
CREATE INDEX IF NOT EXISTS idx_maneuver_scores_student_maneuver ON maneuver_scores(student_id, maneuver_id, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_maneuver_scores_instructor ON maneuver_scores(instructor_id);

COMMENT ON TABLE maneuver_scores IS 'Links maneuver performance to training events with 1-4 scoring scale';
COMMENT ON COLUMN maneuver_scores.performance_level IS 'Descriptive level: unsatisfactory, progressing, proficient, exceptional';

-- =====================================================
-- 9. STUDENT MANEUVER PROGRESS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS student_maneuver_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  maneuver_id UUID NOT NULL REFERENCES maneuvers(id) ON DELETE CASCADE,
  
  -- Aggregate Stats
  total_attempts INTEGER DEFAULT 0,
  first_attempt_date DATE,
  last_attempt_date DATE,
  
  -- Latest Performance
  latest_mission_id UUID REFERENCES missions(id),
  latest_score INTEGER CHECK (latest_score BETWEEN 1 AND 4),
  latest_performance_level TEXT,
  acs_standard_met BOOLEAN,
  
  -- Trend Analysis
  average_score DECIMAL(3,2),
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining', 'insufficient_data')),
  scores_history INTEGER[],  -- [2, 2, 3, 3, 3, 4]
  
  -- Instructor Notes (Most Recent)
  latest_instructor_notes TEXT,
  common_strengths TEXT[],
  common_areas_for_improvement TEXT[],
  
  -- Proficiency Markers
  first_proficient_date DATE,  -- First score >= 3
  consistently_proficient BOOLEAN DEFAULT false,  -- 3+ in last 3 attempts
  checkride_ready BOOLEAN DEFAULT false,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, maneuver_id)
);

CREATE INDEX IF NOT EXISTS idx_student_maneuver_progress_student ON student_maneuver_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_maneuver_progress_maneuver ON student_maneuver_progress(maneuver_id);
CREATE INDEX IF NOT EXISTS idx_student_maneuver_progress_proficient ON student_maneuver_progress(student_id, consistently_proficient);
CREATE INDEX IF NOT EXISTS idx_student_maneuver_progress_checkride ON student_maneuver_progress(student_id, checkride_ready);

COMMENT ON TABLE student_maneuver_progress IS 'Longitudinal tracking of student proficiency per maneuver';
COMMENT ON COLUMN student_maneuver_progress.scores_history IS 'Array of recent scores for trend analysis';

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE lesson_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans_of_action ENABLE ROW LEVEL SECURITY;
ALTER TABLE debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maneuver_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_maneuver_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE maneuver_acs_tasks ENABLE ROW LEVEL SECURITY;

-- Lesson Templates: Visible to all authenticated users
CREATE POLICY "Authenticated users can view active lesson templates"
  ON lesson_templates FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

CREATE POLICY "Instructors and admins can manage lesson templates"
  ON lesson_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('instructor', 'admin')
    )
  );

-- Missions: Students see their own, instructors see assigned, admins see all
CREATE POLICY "Students can view their own missions"
  ON missions FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can view missions they're assigned to"
  ON missions FOR SELECT
  USING (
    assigned_instructor_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all missions"
  ON missions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "Instructors can create and update missions"
  ON missions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('instructor', 'admin')
    )
  );

-- Training Events: Follow mission visibility
CREATE POLICY "Users can view training events for their missions"
  ON training_events FOR SELECT
  USING (
    mission_id IN (
      SELECT id FROM missions
      WHERE student_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR assigned_instructor_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "Instructors can manage training events"
  ON training_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('instructor', 'admin')
    )
  );

-- Plans of Action: Students see their own, instructors see assigned
CREATE POLICY "Students can view their own POAs"
  ON plans_of_action FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage POAs"
  ON plans_of_action FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('instructor', 'admin')
    )
  );

-- Debriefs: Students see their own, instructors see assigned
CREATE POLICY "Students can view their own debriefs"
  ON debriefs FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage debriefs"
  ON debriefs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('instructor', 'admin')
    )
  );

-- Maneuver Scores: Students see their own, instructors see assigned
CREATE POLICY "Students can view their own maneuver scores"
  ON maneuver_scores FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage maneuver scores"
  ON maneuver_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('instructor', 'admin')
    )
  );

-- Student Maneuver Progress: Students see their own
CREATE POLICY "Students can view their own maneuver progress"
  ON student_maneuver_progress FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can view and update student maneuver progress"
  ON student_maneuver_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('instructor', 'admin')
    )
  );

-- Maneuver ACS Tasks: Public reference data
CREATE POLICY "Anyone can view maneuver-ACS task links"
  ON maneuver_acs_tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage maneuver-ACS task links"
  ON maneuver_acs_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate mission totals from training events
CREATE OR REPLACE FUNCTION calculate_mission_totals(p_mission_id UUID)
RETURNS TABLE(
  total_cost_cents INTEGER,
  total_flight_hours DECIMAL(4,2),
  total_ground_hours DECIMAL(4,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(te.student_charge_cents), 0)::INTEGER as total_cost_cents,
    COALESCE(SUM(CASE WHEN te.billing_category = 'flight_instruction' 
                      THEN te.billable_hours ELSE 0 END), 0)::DECIMAL(4,2) as total_flight_hours,
    COALESCE(SUM(CASE WHEN te.billing_category = 'ground_instruction' 
                      THEN te.billable_hours ELSE 0 END), 0)::DECIMAL(4,2) as total_ground_hours
  FROM training_events te
  WHERE te.mission_id = p_mission_id
  AND te.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Function to update student maneuver progress after scoring
CREATE OR REPLACE FUNCTION update_student_maneuver_progress_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_scores INTEGER[];
  v_avg_score DECIMAL(3,2);
  v_trend TEXT;
  v_proficient_count INTEGER;
BEGIN
  -- Get recent scores for this student/maneuver combination
  SELECT ARRAY_AGG(numeric_score ORDER BY scored_at DESC)
  INTO v_scores
  FROM (
    SELECT numeric_score, scored_at
    FROM maneuver_scores
    WHERE student_id = NEW.student_id
    AND maneuver_id = NEW.maneuver_id
    ORDER BY scored_at DESC
    LIMIT 10
  ) recent_scores;
  
  -- Calculate average
  SELECT AVG(score)::DECIMAL(3,2)
  INTO v_avg_score
  FROM UNNEST(v_scores) as score;
  
  -- Determine trend
  IF array_length(v_scores, 1) >= 3 THEN
    IF v_scores[1] > v_scores[2] AND v_scores[2] >= v_scores[3] THEN
      v_trend := 'improving';
    ELSIF v_scores[1] < v_scores[2] AND v_scores[2] <= v_scores[3] THEN
      v_trend := 'declining';
    ELSE
      v_trend := 'stable';
    END IF;
  ELSE
    v_trend := 'insufficient_data';
  END IF;
  
  -- Count proficient scores in last 3 attempts
  SELECT COUNT(*)
  INTO v_proficient_count
  FROM UNNEST(v_scores[1:3]) as score
  WHERE score >= 3;
  
  -- Upsert student_maneuver_progress
  INSERT INTO student_maneuver_progress (
    student_id,
    maneuver_id,
    total_attempts,
    first_attempt_date,
    last_attempt_date,
    latest_mission_id,
    latest_score,
    latest_performance_level,
    acs_standard_met,
    average_score,
    trend,
    scores_history,
    latest_instructor_notes,
    first_proficient_date,
    consistently_proficient,
    checkride_ready
  )
  VALUES (
    NEW.student_id,
    NEW.maneuver_id,
    1,
    CURRENT_DATE,
    CURRENT_DATE,
    NEW.mission_id,
    NEW.numeric_score,
    NEW.performance_level,
    NEW.acs_standard_met,
    v_avg_score,
    v_trend,
    v_scores,
    NEW.instructor_notes,
    CASE WHEN NEW.numeric_score >= 3 THEN CURRENT_DATE ELSE NULL END,
    v_proficient_count >= 3,
    v_proficient_count >= 3 AND NEW.numeric_score >= 3
  )
  ON CONFLICT (student_id, maneuver_id)
  DO UPDATE SET
    total_attempts = student_maneuver_progress.total_attempts + 1,
    last_attempt_date = CURRENT_DATE,
    latest_mission_id = NEW.mission_id,
    latest_score = NEW.numeric_score,
    latest_performance_level = NEW.performance_level,
    acs_standard_met = NEW.acs_standard_met,
    average_score = v_avg_score,
    trend = v_trend,
    scores_history = v_scores,
    latest_instructor_notes = NEW.instructor_notes,
    first_proficient_date = COALESCE(student_maneuver_progress.first_proficient_date, 
                                     CASE WHEN NEW.numeric_score >= 3 THEN CURRENT_DATE ELSE NULL END),
    consistently_proficient = v_proficient_count >= 3,
    checkride_ready = v_proficient_count >= 3 AND NEW.numeric_score >= 3,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update student maneuver progress
CREATE TRIGGER trigger_update_student_maneuver_progress
  AFTER INSERT ON maneuver_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_student_maneuver_progress_trigger();

-- =====================================================
-- 12. USEFUL VIEWS
-- =====================================================

-- View: Mission Summary with calculated totals
CREATE OR REPLACE VIEW mission_summary AS
SELECT 
  m.*,
  (SELECT COUNT(*) FROM training_events te WHERE te.mission_id = m.id) as total_events,
  (SELECT COUNT(*) FROM training_events te WHERE te.mission_id = m.id AND te.status = 'completed') as completed_events,
  COALESCE((SELECT SUM(student_charge_cents) FROM training_events te WHERE te.mission_id = m.id AND te.status = 'completed'), 0) as calculated_total_cost_cents,
  COALESCE((SELECT SUM(CASE WHEN billing_category = 'flight_instruction' THEN billable_hours ELSE 0 END) 
            FROM training_events te WHERE te.mission_id = m.id AND te.status = 'completed'), 0) as calculated_flight_hours,
  COALESCE((SELECT SUM(CASE WHEN billing_category = 'ground_instruction' THEN billable_hours ELSE 0 END) 
            FROM training_events te WHERE te.mission_id = m.id AND te.status = 'completed'), 0) as calculated_ground_hours
FROM missions m;

COMMENT ON VIEW mission_summary IS 'Mission details with calculated totals from training events';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Mission Workflow System schema migration completed successfully.';
  RAISE NOTICE 'Created 8 new tables:';
  RAISE NOTICE '  - lesson_templates';
  RAISE NOTICE '  - missions';
  RAISE NOTICE '  - training_events';
  RAISE NOTICE '  - plans_of_action';
  RAISE NOTICE '  - debriefs';
  RAISE NOTICE '  - maneuver_scores (enhanced)';
  RAISE NOTICE '  - student_maneuver_progress';
  RAISE NOTICE '  - maneuver_acs_tasks';
  RAISE NOTICE 'Enhanced maneuvers table with ACS/FAR references';
  RAISE NOTICE 'Added comprehensive RLS policies';
  RAISE NOTICE 'Created helper functions and triggers';
END $$;

