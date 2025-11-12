-- Lesson Edit Suggestions System
-- Allows instructors to suggest changes to lessons for admin approval

CREATE TABLE IF NOT EXISTS lesson_edit_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES syllabus_lessons(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  
  -- What field is being edited
  field_name TEXT NOT NULL, -- 'objective', 'performance_standards', 'maneuvers', 'acs_standards', 'resources', 'pre_brief_content', etc.
  
  -- Current value (for reference)
  current_value JSONB,
  
  -- Suggested new value
  suggested_value JSONB NOT NULL,
  
  -- Suggestion details
  reason TEXT, -- Why the instructor is suggesting this change
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
  
  -- Admin review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance standards as separate items (not one blob)
CREATE TABLE IF NOT EXISTS lesson_performance_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES syllabus_lessons(id) ON DELETE CASCADE,
  
  standard_text TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  acs_reference TEXT, -- Link to ACS task if applicable
  is_required BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maneuver proficiency expectations (what level should be achieved in THIS lesson)
CREATE TABLE IF NOT EXISTS lesson_maneuver_expectations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES syllabus_lessons(id) ON DELETE CASCADE,
  maneuver_id UUID NOT NULL REFERENCES maneuvers(id) ON DELETE CASCADE,
  
  expected_proficiency INTEGER CHECK (expected_proficiency BETWEEN 1 AND 4), -- 1=Beginner, 2=Developing, 3=Proficient, 4=Advanced
  is_required BOOLEAN DEFAULT true,
  emphasis_level TEXT CHECK (emphasis_level IN ('introduction', 'practice', 'review', 'mastery')),
  instructor_notes TEXT,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(lesson_id, maneuver_id)
);

-- Resource types for lessons
CREATE TABLE IF NOT EXISTS lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES syllabus_lessons(id) ON DELETE CASCADE,
  
  resource_type TEXT NOT NULL CHECK (resource_type IN ('video', 'web_link', 'faa_resource', 'lesson_plan', 'pdf', 'powerpoint', 'markdown')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- URL for videos/links
  url TEXT,
  
  -- File storage for uploaded resources
  file_path TEXT,
  file_name TEXT,
  
  -- Rich text/markdown content for lesson plans
  content TEXT,
  
  -- Metadata
  faa_chapter TEXT, -- For FAA resources (e.g., "PHAK Chapter 3")
  duration_minutes INTEGER, -- For videos
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lesson_edit_suggestions_lesson ON lesson_edit_suggestions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_edit_suggestions_instructor ON lesson_edit_suggestions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_edit_suggestions_status ON lesson_edit_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_lesson_performance_standards_lesson ON lesson_performance_standards(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_maneuver_expectations_lesson ON lesson_maneuver_expectations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson ON lesson_resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_resources_type ON lesson_resources(resource_type);

-- RLS Policies
ALTER TABLE lesson_edit_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_performance_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_maneuver_expectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY;

-- Instructors can create suggestions and view their own
CREATE POLICY "Instructors can create edit suggestions"
  ON lesson_edit_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'instructor'
    )
  );

CREATE POLICY "Instructors can view their own suggestions"
  ON lesson_edit_suggestions FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'instructor')
  ));

-- Admins can view and update all suggestions
CREATE POLICY "Admins can manage all suggestions"
  ON lesson_edit_suggestions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Performance standards policies
CREATE POLICY "Instructors and admins can view performance standards"
  ON lesson_performance_standards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('instructor', 'admin', 'student')
    )
  );

CREATE POLICY "Admins can manage performance standards"
  ON lesson_performance_standards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Similar policies for other tables
CREATE POLICY "All can view lesson resources"
  ON lesson_resources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage lesson resources"
  ON lesson_resources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "All can view maneuver expectations"
  ON lesson_maneuver_expectations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage maneuver expectations"
  ON lesson_maneuver_expectations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE lesson_edit_suggestions IS 'Instructor suggestions for lesson edits, pending admin approval';
COMMENT ON TABLE lesson_performance_standards IS 'Individual performance standards for each lesson (not one text blob)';
COMMENT ON TABLE lesson_maneuver_expectations IS 'Expected proficiency levels for maneuvers in each lesson';
COMMENT ON TABLE lesson_resources IS 'Learning resources attached to lessons (videos, links, FAA resources, lesson plans)';

COMMENT ON COLUMN lesson_edit_suggestions.field_name IS 'Field being edited: objective, performance_standards, maneuvers, acs_standards, resources, pre_brief_content, etc.';
COMMENT ON COLUMN lesson_edit_suggestions.status IS 'pending, approved, rejected, or implemented';
COMMENT ON COLUMN lesson_maneuver_expectations.expected_proficiency IS '1=Beginner, 2=Developing, 3=Proficient, 4=Advanced';

