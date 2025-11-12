-- ============================================================================
-- MISSION WORKFLOW SYSTEM SCHEMA
-- ============================================================================
-- This schema implements a comprehensive mission-based training system where:
-- - Missions are pedagogical wrappers that orchestrate training experiences
-- - Training events are atomic billable units (pre-brief, flight, ground, post-brief)
-- - Plans of Action provide pre-mission preparation
-- - Debriefs capture post-mission documentation
-- - Student maneuver progress tracks longitudinal proficiency
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE MANEUVERS TABLE
-- ============================================================================
-- Add ACS task codes and FAR references to existing maneuvers table

ALTER TABLE maneuvers
  ADD COLUMN IF NOT EXISTS primary_acs_task_code TEXT,
  ADD COLUMN IF NOT EXISTS related_acs_task_codes TEXT[],
  ADD COLUMN IF NOT EXISTS far_references JSONB;

COMMENT ON COLUMN maneuvers.primary_acs_task_code IS 'Primary ACS task code (e.g., PA.V.B)';
COMMENT ON COLUMN maneuvers.related_acs_task_codes IS 'Array of related ACS task codes';
COMMENT ON COLUMN maneuvers.far_references IS 'Array of FAR references: [{"reference": "§61.107(b)(1)(iv)", "description": "Required for private pilot certification", "certificate_type": "private_pilot"}]';

-- Note: maneuver_acs_tasks linking table already exists!

-- ============================================================================
-- 2. MISSIONS TABLE
-- ============================================================================
-- Core organizational wrapper for complete training experience

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  assigned_instructor_id UUID NOT NULL REFERENCES profiles(id),
  student_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Mission Identity (Progressive Numbering: F1, F2, F3...)
  mission_code TEXT NOT NULL UNIQUE,  -- "DSA-PPC-F14"
  mission_number INTEGER NOT NULL,
  program_code TEXT NOT NULL,  -- "PPC", "IFR", "CPL"
  mission_type TEXT NOT NULL CHECK (mission_type IN ('F', 'G', 'S')),  -- Flight, Ground, Sim
  
  -- Lesson Template (Optional - can be fully custom)
  lesson_template_id UUID REFERENCES syllabus_lessons(id) ON DELETE SET NULL,
  lesson_code TEXT,  -- Denormalized for display (e.g., "PPC-L5")
  template_snapshot JSONB,  -- Frozen copy at creation time
  customizations JSONB,  -- What instructor changed from template
  is_customized BOOLEAN DEFAULT false,
  
  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_start_time TIME,
  
  -- Aircraft Assignment
  scheduled_aircraft_id UUID REFERENCES aircraft(id),
  actual_aircraft_id UUID REFERENCES aircraft(id),
  aircraft_changed BOOLEAN DEFAULT false,
  aircraft_change_reason TEXT,
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'partially_completed')),
  instructor_assessment TEXT 
    CHECK (instructor_assessment IN ('satisfactory', 'needs_more_practice', 'outstanding')),
  
  -- Related Documents
  plan_of_action_id UUID,  -- References plans_of_action(id) - will be added after table creation
  debrief_id UUID,  -- References debriefs(id) - will be added after table creation
  
  -- Calculated Totals (from training_events)
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

-- Indexes for missions
CREATE INDEX IF NOT EXISTS idx_missions_enrollment ON missions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_missions_instructor ON missions(assigned_instructor_id);
CREATE INDEX IF NOT EXISTS idx_missions_student ON missions(student_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_date ON missions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_missions_code ON missions(mission_code);
CREATE INDEX IF NOT EXISTS idx_missions_template ON missions(lesson_template_id);

COMMENT ON TABLE missions IS 'Organizational wrapper for complete training experiences';
COMMENT ON COLUMN missions.mission_code IS 'Unique mission identifier (e.g., DSA-PPC-F14)';
COMMENT ON COLUMN missions.template_snapshot IS 'Frozen copy of lesson template at creation time';
COMMENT ON COLUMN missions.customizations IS 'Instructor modifications to the template';

-- ============================================================================
-- 3. TRAINING EVENTS TABLE
-- ============================================================================
-- Atomic billable units (pre-brief, flight, ground, post-brief)

CREATE TABLE IF NOT EXISTS training_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES student_enrollments(id),
  
  -- Assignment (Can differ from mission instructor for substitutions)
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  student_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Event Classification
  event_type TEXT NOT NULL CHECK (event_type IN ('prebrief', 'flight', 'ground', 'simulator', 'postbrief')),
  event_sequence INTEGER NOT NULL,  -- Order within mission (1, 2, 3, 4)
  
  -- Student Billing
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
  ledger_journal_id UUID,  -- Links to journals table
  
  -- Flight-Specific Data (Nullable for ground events)
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

-- Indexes for training_events
CREATE INDEX IF NOT EXISTS idx_training_events_mission ON training_events(mission_id);
CREATE INDEX IF NOT EXISTS idx_training_events_instructor ON training_events(instructor_id);
CREATE INDEX IF NOT EXISTS idx_training_events_student ON training_events(student_id);
CREATE INDEX IF NOT EXISTS idx_training_events_status ON training_events(status);
CREATE INDEX IF NOT EXISTS idx_training_events_date ON training_events(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_training_events_billing ON training_events(student_payment_status);

COMMENT ON TABLE training_events IS 'Atomic billable units for granular training tracking';
COMMENT ON COLUMN training_events.event_sequence IS 'Order within mission (1=prebrief, 2=flight/ground, 3=postbrief)';
COMMENT ON COLUMN training_events.dsa_margin_cents IS 'Platform margin: student_charge - instructor_payout';

-- ============================================================================
-- 4. PLANS OF ACTION TABLE
-- ============================================================================
-- Pre-mission preparation documents

CREATE TABLE IF NOT EXISTS plans_of_action (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  
  -- POA Header (DSA Format)
  flight_number INTEGER,
  aircraft_tail_number TEXT,
  departure_direction TEXT,
  destination_airport TEXT,
  duration_hours DECIMAL(3,1) DEFAULT 2.0,
  
  -- Mission Overview
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

-- Indexes for plans_of_action
CREATE INDEX IF NOT EXISTS idx_poa_mission ON plans_of_action(mission_id);
CREATE INDEX IF NOT EXISTS idx_poa_student ON plans_of_action(student_id);
CREATE INDEX IF NOT EXISTS idx_poa_status ON plans_of_action(status);
CREATE INDEX IF NOT EXISTS idx_poa_created ON plans_of_action(created_at DESC);

COMMENT ON TABLE plans_of_action IS 'Pre-mission preparation documents following DSA POA format';
COMMENT ON COLUMN plans_of_action.prior_debrief_insights IS 'AI-extracted insights from last 3 debriefs';
COMMENT ON COLUMN plans_of_action.ai_sources IS 'Metadata about what informed AI generation';

-- ============================================================================
-- 5. DEBRIEFS TABLE
-- ============================================================================
-- Post-mission documentation

CREATE TABLE IF NOT EXISTS debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  
  flight_number INTEGER,
  
  -- Maneuvers (LINKED TO DATABASE VIA UUIDs)
  maneuvers_covered UUID[],  -- Array of maneuver UUIDs
  maneuver_details JSONB[],
  /* Structure:
  [{
    "maneuver_id": "uuid",
    "maneuver_name": "Steep Turns",
    "acs_task_code": "PA.V.B",
    "score": 3,
    "performance_level": "proficient",
    "notes": "Excellent coordination",
    "far_references": ["§61.107(b)(1)(iv)"]
  }]
  */
  
  -- Regulations Discussed (LINKED)
  far_references JSONB[],
  /* Structure:
  [{
    "reference": "§61.107(b)(1)(iv)",
    "description": "Preflight preparation",
    "context": "Discussed weight and balance"
  }]
  */
  
  -- ACS Tasks (LINKED)
  acs_tasks_covered UUID[],  -- Array of acs_task UUIDs
  acs_task_details JSONB[],
  
  -- Debrief Content (DSA Template Format)
  general_overview TEXT,  -- 2-5 sentence narrative
  key_takeaways JSONB[],
  /* Structure:
  [{
    "category": "strength|improvement|correction",
    "observation": "Text",
    "evidence": "Text",
    "coaching": "Text"
  }]
  */
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

-- Indexes for debriefs
CREATE INDEX IF NOT EXISTS idx_debriefs_mission ON debriefs(mission_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_student ON debriefs(student_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_instructor ON debriefs(instructor_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_date ON debriefs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debriefs_maneuvers ON debriefs USING GIN (maneuvers_covered);
CREATE INDEX IF NOT EXISTS idx_debriefs_acs_tasks ON debriefs USING GIN (acs_tasks_covered);

COMMENT ON TABLE debriefs IS 'Post-mission documentation following DSA Debrief Template';
COMMENT ON COLUMN debriefs.maneuvers_covered IS 'Array of maneuver UUIDs (not just text names)';
COMMENT ON COLUMN debriefs.acs_tasks_covered IS 'Array of ACS task UUIDs for rich relational queries';

-- ============================================================================
-- 6. STUDENT MANEUVER PROGRESS TABLE
-- ============================================================================
-- Longitudinal tracking of student proficiency per maneuver

CREATE TABLE IF NOT EXISTS student_maneuver_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  maneuver_id UUID NOT NULL REFERENCES maneuvers(id) ON DELETE CASCADE,
  
  -- Aggregate Stats
  total_attempts INTEGER DEFAULT 0,
  first_attempt_date DATE,
  last_attempt_date DATE,
  
  -- Latest Performance
  latest_mission_id UUID REFERENCES missions(id),
  latest_score INTEGER CHECK (latest_score BETWEEN 1 AND 4),
  latest_performance_level TEXT CHECK (latest_performance_level IN ('unsatisfactory', 'progressing', 'proficient', 'exceptional')),
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

-- Indexes for student_maneuver_progress
CREATE INDEX IF NOT EXISTS idx_student_maneuver_progress_student ON student_maneuver_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_maneuver_progress_maneuver ON student_maneuver_progress(maneuver_id);
CREATE INDEX IF NOT EXISTS idx_student_maneuver_progress_proficient ON student_maneuver_progress(student_id, consistently_proficient);
CREATE INDEX IF NOT EXISTS idx_student_maneuver_progress_checkride ON student_maneuver_progress(student_id, checkride_ready);

COMMENT ON TABLE student_maneuver_progress IS 'Longitudinal tracking of student proficiency per maneuver';
COMMENT ON COLUMN student_maneuver_progress.scores_history IS 'Array of scores over time for trend analysis';
COMMENT ON COLUMN student_maneuver_progress.consistently_proficient IS 'True if last 3 attempts scored 3 or higher';

-- ============================================================================
-- 7. ENHANCE MANEUVER SCORES TABLE
-- ============================================================================
-- Add mission_id and training_event_id references

ALTER TABLE maneuver_scores
  ADD COLUMN IF NOT EXISTS mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS training_event_id UUID,  -- Will reference training_events(id)
  ADD COLUMN IF NOT EXISTS maneuver_name TEXT,  -- Denormalized for performance
  ADD COLUMN IF NOT EXISTS acs_task_code TEXT,  -- Denormalized
  ADD COLUMN IF NOT EXISTS performance_level TEXT CHECK (performance_level IN ('unsatisfactory', 'progressing', 'proficient', 'exceptional')),
  ADD COLUMN IF NOT EXISTS numeric_score INTEGER CHECK (numeric_score BETWEEN 1 AND 4),
  ADD COLUMN IF NOT EXISTS acs_standard_met BOOLEAN,
  ADD COLUMN IF NOT EXISTS instructor_notes TEXT,
  ADD COLUMN IF NOT EXISTS areas_of_strength TEXT[],
  ADD COLUMN IF NOT EXISTS areas_for_improvement_text TEXT[],
  ADD COLUMN IF NOT EXISTS specific_observations JSONB,
  ADD COLUMN IF NOT EXISTS student_attempt_number INTEGER,  -- How many times student has attempted THIS maneuver
  ADD COLUMN IF NOT EXISTS scored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on mission_id
CREATE INDEX IF NOT EXISTS idx_maneuver_scores_mission ON maneuver_scores(mission_id);

-- Add training_event_id index (will create FK after training_events table exists)
CREATE INDEX IF NOT EXISTS idx_maneuver_scores_event ON maneuver_scores(training_event_id);
CREATE INDEX IF NOT EXISTS idx_maneuver_scores_student_maneuver ON maneuver_scores(student_id, maneuver_id, scored_at DESC);

-- ============================================================================
-- 8. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Add FKs that reference tables created in this migration

-- Add FK from missions to plans_of_action
ALTER TABLE missions 
  ADD CONSTRAINT fk_missions_plan_of_action 
  FOREIGN KEY (plan_of_action_id) REFERENCES plans_of_action(id) ON DELETE SET NULL;

-- Add FK from missions to debriefs
ALTER TABLE missions 
  ADD CONSTRAINT fk_missions_debrief 
  FOREIGN KEY (debrief_id) REFERENCES debriefs(id) ON DELETE SET NULL;

-- Add FK from maneuver_scores to training_events
ALTER TABLE maneuver_scores 
  ADD CONSTRAINT fk_maneuver_scores_training_event 
  FOREIGN KEY (training_event_id) REFERENCES training_events(id) ON DELETE CASCADE;

-- Add FK from training_events to journals (ledger integration)
ALTER TABLE training_events 
  ADD CONSTRAINT fk_training_events_journal 
  FOREIGN KEY (ledger_journal_id) REFERENCES journals(id) ON DELETE SET NULL;

-- ============================================================================
-- 9. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Missions trigger
DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Training events trigger
DROP TRIGGER IF EXISTS update_training_events_updated_at ON training_events;
CREATE TRIGGER update_training_events_updated_at BEFORE UPDATE ON training_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Plans of action trigger
DROP TRIGGER IF EXISTS update_plans_of_action_updated_at ON plans_of_action;
CREATE TRIGGER update_plans_of_action_updated_at BEFORE UPDATE ON plans_of_action
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Debriefs trigger
DROP TRIGGER IF EXISTS update_debriefs_updated_at ON debriefs;
CREATE TRIGGER update_debriefs_updated_at BEFORE UPDATE ON debriefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Student maneuver progress trigger
DROP TRIGGER IF EXISTS update_student_maneuver_progress_updated_at ON student_maneuver_progress;
CREATE TRIGGER update_student_maneuver_progress_updated_at BEFORE UPDATE ON student_maneuver_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans_of_action ENABLE ROW LEVEL SECURITY;
ALTER TABLE debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_maneuver_progress ENABLE ROW LEVEL SECURITY;

-- Missions Policies
CREATE POLICY "Students can view their own missions" ON missions
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can view their assigned missions" ON missions
    FOR SELECT USING (assigned_instructor_id = auth.uid());

CREATE POLICY "Admins can view all missions" ON missions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

CREATE POLICY "Instructors can create missions" ON missions
    FOR INSERT WITH CHECK (
        assigned_instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('instructor', 'admin')
        )
    );

CREATE POLICY "Instructors can update their missions" ON missions
    FOR UPDATE USING (
        assigned_instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Training Events Policies
CREATE POLICY "Students can view their training events" ON training_events
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can view their training events" ON training_events
    FOR SELECT USING (instructor_id = auth.uid());

CREATE POLICY "Admins can view all training events" ON training_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

CREATE POLICY "Instructors can manage training events" ON training_events
    FOR ALL USING (
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('instructor', 'admin')
        )
    );

-- Plans of Action Policies
CREATE POLICY "Students can view their POAs" ON plans_of_action
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can view and manage their POAs" ON plans_of_action
    FOR ALL USING (
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Debriefs Policies
CREATE POLICY "Students can view their debriefs" ON debriefs
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can view and manage their debriefs" ON debriefs
    FOR ALL USING (
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Student Maneuver Progress Policies
CREATE POLICY "Students can view their own progress" ON student_maneuver_progress
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Instructors can view their students' progress" ON student_maneuver_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM student_enrollments se
            WHERE se.student_id = student_maneuver_progress.student_id
            AND se.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

CREATE POLICY "Instructors can update student progress" ON student_maneuver_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM student_enrollments se
            WHERE se.student_id = student_maneuver_progress.student_id
            AND se.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('instructor', 'admin')
        )
    );

-- ============================================================================
-- 11. UTILITY FUNCTIONS
-- ============================================================================

-- Function to generate next mission code
CREATE OR REPLACE FUNCTION generate_mission_code(
    p_program_code TEXT,
    p_mission_type TEXT,
    p_enrollment_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_next_number INTEGER;
    v_mission_code TEXT;
BEGIN
    -- Get the next mission number for this enrollment and type
    SELECT COALESCE(MAX(mission_number), 0) + 1
    INTO v_next_number
    FROM missions
    WHERE enrollment_id = p_enrollment_id
    AND mission_type = p_mission_type;
    
    -- Generate mission code
    v_mission_code := 'DSA-' || p_program_code || '-' || p_mission_type || v_next_number::TEXT;
    
    RETURN v_mission_code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate mission totals from training events
CREATE OR REPLACE FUNCTION update_mission_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE missions
    SET 
        total_cost_cents = (
            SELECT COALESCE(SUM(student_charge_cents), 0)
            FROM training_events
            WHERE mission_id = NEW.mission_id
        ),
        total_flight_hours = (
            SELECT COALESCE(SUM(CASE WHEN billing_category = 'flight_instruction' THEN billable_hours ELSE 0 END), 0)
            FROM training_events
            WHERE mission_id = NEW.mission_id
        ),
        total_ground_hours = (
            SELECT COALESCE(SUM(CASE WHEN billing_category = 'ground_instruction' THEN billable_hours ELSE 0 END), 0)
            FROM training_events
            WHERE mission_id = NEW.mission_id
        )
    WHERE id = NEW.mission_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update mission totals when training events change
DROP TRIGGER IF EXISTS update_mission_totals_trigger ON training_events;
CREATE TRIGGER update_mission_totals_trigger
    AFTER INSERT OR UPDATE OF student_charge_cents, billable_hours, billing_category ON training_events
    FOR EACH ROW
    EXECUTE FUNCTION update_mission_totals();

-- ============================================================================
-- 12. SAMPLE DATA FOR TESTING
-- ============================================================================

-- Note: This is for reference only - actual seed data should be added separately

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- ============================================================================
-- ENHANCEMENT: Add new columns to plans_of_action table
-- ============================================================================
-- Add practice_area, instructor_briefed_at, and maneuvers_detail columns
-- to support enhanced pre-brief functionality

ALTER TABLE plans_of_action 
  ADD COLUMN IF NOT EXISTS practice_area TEXT,
  ADD COLUMN IF NOT EXISTS instructor_briefed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS maneuvers_detail JSONB;

COMMENT ON COLUMN plans_of_action.practice_area IS 'Designated practice area for maneuvers (e.g., "North Practice Area")';
COMMENT ON COLUMN plans_of_action.instructor_briefed_at IS 'Timestamp when instructor completed the pre-brief';
COMMENT ON COLUMN plans_of_action.maneuvers_detail IS 'Rich maneuver data with proficiency targets, success criteria, ACS standards, and student progress';

-- Index for JSONB queries on maneuvers_detail
CREATE INDEX IF NOT EXISTS idx_poa_maneuvers_detail ON plans_of_action USING GIN (maneuvers_detail);

