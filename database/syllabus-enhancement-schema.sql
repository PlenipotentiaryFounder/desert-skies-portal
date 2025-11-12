-- =====================================================================
-- Desert Skies Aviation Portal - Syllabus System Enhancement
-- Version: 2.0
-- Purpose: Comprehensive syllabus management with ACS integration
-- =====================================================================

-- =====================================================================
-- 1. ENHANCE SYLLABI TABLE
-- =====================================================================

-- Add ACS and FAR regulation tracking to syllabi
ALTER TABLE syllabi 
ADD COLUMN IF NOT EXISTS faa_type TEXT,
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS acs_document_id UUID REFERENCES acs_documents(id),
ADD COLUMN IF NOT EXISTS target_certificate TEXT, -- 'private', 'instrument', 'commercial', 'cfi', 'multi'
ADD COLUMN IF NOT EXISTS far_references JSONB DEFAULT '[]'::jsonb, -- Array of FAR parts: [{"part": "61", "subpart": "E", "sections": ["61.103", "61.105", "61.107"]}]
ADD COLUMN IF NOT EXISTS experience_requirements JSONB DEFAULT '{}'::jsonb, -- {"flight_hours": 40, "dual": 20, "solo": 10, "cross_country": 3, "night": 3, ...}
ADD COLUMN IF NOT EXISTS knowledge_requirements JSONB DEFAULT '[]'::jsonb, -- Array of knowledge test areas
ADD COLUMN IF NOT EXISTS proficiency_requirements JSONB DEFAULT '[]'::jsonb, -- Array of ACS tasks that must be proficient
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_syllabi_target_certificate ON syllabi(target_certificate);
CREATE INDEX IF NOT EXISTS idx_syllabi_is_active ON syllabi(is_active);
CREATE INDEX IF NOT EXISTS idx_syllabi_acs_document ON syllabi(acs_document_id);

COMMENT ON COLUMN syllabi.far_references IS 'FAA regulations that apply to this syllabus (FAR 61, 91, etc.)';
COMMENT ON COLUMN syllabi.experience_requirements IS 'Required flight hours and experience for certificate/rating';
COMMENT ON COLUMN syllabi.knowledge_requirements IS 'Knowledge test areas and minimum scores';
COMMENT ON COLUMN syllabi.proficiency_requirements IS 'ACS tasks that must meet standards';

-- =====================================================================
-- 2. ENHANCE SYLLABUS_LESSONS TABLE
-- =====================================================================

-- Check if syllabus_lessons table exists, if not create it
CREATE TABLE IF NOT EXISTS syllabus_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  syllabus_id UUID NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('Ground', 'Flight', 'Simulator', 'Solo', 'Checkride')),
  estimated_hours DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  
  -- Learning objectives
  objective TEXT,
  performance_standards TEXT,
  completion_standards JSONB DEFAULT '[]'::jsonb, -- What defines lesson completion
  
  -- Content and resources
  pre_flight_briefing TEXT,
  post_flight_briefing TEXT,
  notes TEXT,
  instructor_notes TEXT,
  student_prep_materials JSONB DEFAULT '[]'::jsonb, -- [{type: 'video', title: '', url: ''}, {type: 'document', title: '', url: ''}]
  
  -- Email integration
  email_subject TEXT,
  email_body TEXT,
  
  -- Scheduling and prerequisites
  is_required BOOLEAN DEFAULT true,
  prerequisite_lesson_ids UUID[], -- Array of lesson IDs that must be completed first
  minimum_proficiency_required INTEGER DEFAULT 3, -- 1-4 scale for maneuver proficiency
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_syllabus_lessons_syllabus_id ON syllabus_lessons(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_lessons_order ON syllabus_lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_syllabus_lessons_type ON syllabus_lessons(lesson_type);
CREATE INDEX IF NOT EXISTS idx_syllabus_lessons_active ON syllabus_lessons(is_active);

COMMENT ON TABLE syllabus_lessons IS 'Individual lessons within a training syllabus';
COMMENT ON COLUMN syllabus_lessons.completion_standards IS 'Criteria for determining lesson completion and proficiency';
COMMENT ON COLUMN syllabus_lessons.student_prep_materials IS 'Resources students should review before the lesson';
COMMENT ON COLUMN syllabus_lessons.prerequisite_lesson_ids IS 'Lessons that must be completed before this one';

-- =====================================================================
-- 3. LESSON RESOURCES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES syllabus_lessons(id) ON DELETE CASCADE,
  
  -- Resource details
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('video', 'document', 'faa_reference', 'external_link', 'pdf', 'chart', 'checklist')),
  url TEXT NOT NULL,
  
  -- Metadata
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  estimated_study_time INTEGER, -- minutes
  
  -- Verification (for YouTube/external links)
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  
  -- Categorization
  category TEXT, -- 'pre_flight', 'post_flight', 'supplemental'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson ON lesson_resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_type ON lesson_resources(resource_type);

COMMENT ON TABLE lesson_resources IS 'Learning resources attached to syllabus lessons';
COMMENT ON COLUMN lesson_resources.is_verified IS 'Whether the URL has been checked for validity';

-- =====================================================================
-- 4. LESSON ACS STANDARDS JUNCTION TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS lesson_acs_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES syllabus_lessons(id) ON DELETE CASCADE,
  acs_task_id UUID NOT NULL REFERENCES acs_tasks(id) ON DELETE CASCADE,
  
  -- Relationship details
  is_primary_focus BOOLEAN DEFAULT false, -- Is this THE main ACS task for this lesson?
  proficiency_target INTEGER DEFAULT 3, -- 1-4 scale
  instructor_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lesson_id, acs_task_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_acs_lesson ON lesson_acs_standards(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_acs_task ON lesson_acs_standards(acs_task_id);

COMMENT ON TABLE lesson_acs_standards IS 'Links syllabus lessons to specific ACS tasks';
COMMENT ON COLUMN lesson_acs_standards.is_primary_focus IS 'Indicates if this is the main ACS standard being trained';

-- =====================================================================
-- 5. LESSON FAR REFERENCES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS lesson_far_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES syllabus_lessons(id) ON DELETE CASCADE,
  
  -- FAR Details
  far_part TEXT NOT NULL, -- '61', '91', '67', etc.
  far_section TEXT NOT NULL, -- '61.103', '91.126', etc.
  far_subsection TEXT, -- '(a)(1)', '(b)(2)(i)', etc.
  description TEXT, -- Human-readable description of what this reg covers
  
  -- Relationship
  relevance TEXT, -- 'required', 'supplemental', 'reference'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lesson_id, far_section, far_subsection)
);

CREATE INDEX IF NOT EXISTS idx_lesson_far_lesson ON lesson_far_references(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_far_part ON lesson_far_references(far_part);

COMMENT ON TABLE lesson_far_references IS 'Links syllabus lessons to applicable FAA regulations';

-- =====================================================================
-- 6. STUDENT LESSON PROGRESS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES student_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES syllabus_lessons(id) ON DELETE CASCADE,
  
  -- Progress tracking
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'scheduled', 'in_progress', 'completed', 'mastered')),
  attempts INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  total_flight_hours DECIMAL(6,2) DEFAULT 0,
  
  -- Performance
  average_maneuver_score DECIMAL(3,2), -- 1.00 to 4.00
  proficiency_level INTEGER, -- 1-4 based on ACS standards
  
  -- Dates
  first_attempted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  instructor_notes TEXT,
  student_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, lesson_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_student ON student_lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_enrollment ON student_lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_lesson ON student_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_lesson_progress_status ON student_lesson_progress(status);

COMMENT ON TABLE student_lesson_progress IS 'Tracks individual student progress through syllabus lessons';
COMMENT ON COLUMN student_lesson_progress.proficiency_level IS 'Overall proficiency on this lesson (1-4 scale)';

-- =====================================================================
-- 7. VIEWS FOR EASY QUERYING
-- =====================================================================

-- View: Complete syllabus with lesson count and enrollment stats
CREATE OR REPLACE VIEW syllabi_overview AS
SELECT 
  s.*,
  COUNT(DISTINCT sl.id) as lesson_count,
  COUNT(DISTINCT se.id) as enrollment_count,
  COUNT(DISTINCT CASE WHEN se.status = 'active' THEN se.id END) as active_enrollments,
  SUM(sl.estimated_hours) as total_estimated_hours,
  ad.title as acs_document_title,
  ad.certificate_type as acs_certificate_type
FROM syllabi s
LEFT JOIN syllabus_lessons sl ON sl.syllabus_id = s.id
LEFT JOIN student_enrollments se ON se.syllabus_id = s.id
LEFT JOIN acs_documents ad ON ad.id = s.acs_document_id
GROUP BY s.id, ad.title, ad.certificate_type;

COMMENT ON VIEW syllabi_overview IS 'Complete syllabus overview with statistics';

-- View: Lesson details with maneuver and ACS counts
CREATE OR REPLACE VIEW lessons_detailed AS
SELECT 
  sl.*,
  COUNT(DISTINCT lm.maneuver_id) as maneuver_count,
  COUNT(DISTINCT las.acs_task_id) as acs_task_count,
  COUNT(DISTINCT lr.id) as resource_count,
  COUNT(DISTINCT lfr.id) as far_reference_count,
  s.name as syllabus_name,
  s.target_certificate
FROM syllabus_lessons sl
LEFT JOIN lesson_maneuvers lm ON lm.lesson_id = sl.id
LEFT JOIN lesson_acs_standards las ON las.lesson_id = sl.id
LEFT JOIN lesson_resources lr ON lr.lesson_id = sl.id
LEFT JOIN lesson_far_references lfr ON lfr.lesson_id = sl.id
LEFT JOIN syllabi s ON s.id = sl.syllabus_id
GROUP BY sl.id, s.name, s.target_certificate;

COMMENT ON VIEW lessons_detailed IS 'Detailed lesson view with related content counts';

-- =====================================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- =====================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
DROP TRIGGER IF EXISTS update_syllabi_updated_at ON syllabi;
CREATE TRIGGER update_syllabi_updated_at
  BEFORE UPDATE ON syllabi
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_syllabus_lessons_updated_at ON syllabus_lessons;
CREATE TRIGGER update_syllabus_lessons_updated_at
  BEFORE UPDATE ON syllabus_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_resources_updated_at ON lesson_resources;
CREATE TRIGGER update_lesson_resources_updated_at
  BEFORE UPDATE ON lesson_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_lesson_progress_updated_at ON student_lesson_progress;
CREATE TRIGGER update_student_lesson_progress_updated_at
  BEFORE UPDATE ON student_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on new tables
ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_acs_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_far_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lesson_resources
CREATE POLICY "Anyone can view lesson resources" ON lesson_resources
  FOR SELECT USING (true);

CREATE POLICY "Admins and instructors can manage lesson resources" ON lesson_resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN profiles p ON p.id = ur.user_id
      WHERE p.id IN (
        SELECT id FROM profiles WHERE id = auth.uid()
      )
      AND r.name IN ('admin', 'instructor')
    )
  );

-- RLS Policies for lesson_acs_standards
CREATE POLICY "Anyone can view lesson ACS standards" ON lesson_acs_standards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage lesson ACS standards" ON lesson_acs_standards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN profiles p ON p.id = ur.user_id
      WHERE p.id IN (
        SELECT id FROM profiles WHERE id = auth.uid()
      )
      AND r.name = 'admin'
    )
  );

-- RLS Policies for lesson_far_references
CREATE POLICY "Anyone can view lesson FAR references" ON lesson_far_references
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage lesson FAR references" ON lesson_far_references
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN profiles p ON p.id = ur.user_id
      WHERE p.id IN (
        SELECT id FROM profiles WHERE id = auth.uid()
      )
      AND r.name = 'admin'
    )
  );

-- RLS Policies for student_lesson_progress
CREATE POLICY "Students can view own progress" ON student_lesson_progress
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Instructors can view their students' progress" ON student_lesson_progress
  FOR SELECT USING (
    enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE instructor_id IN (
        SELECT id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Instructors can update their students' progress" ON student_lesson_progress
  FOR ALL USING (
    enrollment_id IN (
      SELECT id FROM student_enrollments
      WHERE instructor_id IN (
        SELECT id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- =====================================================================
-- 10. SEED DATA FOR TESTING (Optional)
-- =====================================================================

-- This will be handled by a separate seed script

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================

