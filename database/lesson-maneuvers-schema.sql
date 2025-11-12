-- =====================================================================
-- LESSON MANEUVERS LINKING TABLE
-- =====================================================================
-- Purpose: Links syllabus lessons to specific maneuvers that will be practiced
-- Connects existing syllabus_lessons and maneuvers tables
-- =====================================================================

CREATE TABLE IF NOT EXISTS lesson_maneuvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  lesson_id UUID NOT NULL REFERENCES syllabus_lessons(id) ON DELETE CASCADE,
  maneuver_id UUID NOT NULL REFERENCES maneuvers(id) ON DELETE CASCADE,
  
  -- Relationship Details
  is_required BOOLEAN DEFAULT true, -- Is this maneuver required for lesson completion?
  is_introduction BOOLEAN DEFAULT false, -- Is this the first time student sees this maneuver?
  target_proficiency INTEGER DEFAULT 3 CHECK (target_proficiency BETWEEN 1 AND 4), -- Expected proficiency level (1-4)
  
  -- Display and Ordering
  display_order INTEGER DEFAULT 0,
  emphasis_level TEXT DEFAULT 'standard' CHECK (emphasis_level IN ('introduction', 'standard', 'proficiency', 'mastery')),
  
  -- Instructor Guidance
  instructor_notes TEXT, -- Special considerations for teaching this maneuver in this lesson
  student_prep_notes TEXT, -- What students should study before attempting this maneuver
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  -- Ensure each maneuver only linked once per lesson
  UNIQUE(lesson_id, maneuver_id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_lesson_maneuvers_lesson ON lesson_maneuvers(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_maneuvers_maneuver ON lesson_maneuvers(maneuver_id);
CREATE INDEX IF NOT EXISTS idx_lesson_maneuvers_required ON lesson_maneuvers(lesson_id, is_required);
CREATE INDEX IF NOT EXISTS idx_lesson_maneuvers_order ON lesson_maneuvers(lesson_id, display_order);

-- Comments for Documentation
COMMENT ON TABLE lesson_maneuvers IS 'Links syllabus lessons to maneuvers that will be practiced, with proficiency targets and teaching guidance';
COMMENT ON COLUMN lesson_maneuvers.is_introduction IS 'True if this is the students first exposure to this maneuver';
COMMENT ON COLUMN lesson_maneuvers.target_proficiency IS 'Expected proficiency level by end of lesson: 1=Intro, 2=Developing, 3=Proficient, 4=Mastery';
COMMENT ON COLUMN lesson_maneuvers.emphasis_level IS 'How much focus this maneuver gets in the lesson';

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_lesson_maneuvers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lesson_maneuvers_updated_at ON lesson_maneuvers;
CREATE TRIGGER trigger_lesson_maneuvers_updated_at
  BEFORE UPDATE ON lesson_maneuvers
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_maneuvers_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

ALTER TABLE lesson_maneuvers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can read lesson maneuvers
DROP POLICY IF EXISTS "Authenticated users can view lesson maneuvers" ON lesson_maneuvers;
CREATE POLICY "Authenticated users can view lesson maneuvers"
  ON lesson_maneuvers FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins and instructors can manage lesson maneuvers
DROP POLICY IF EXISTS "Admins and instructors can manage lesson maneuvers" ON lesson_maneuvers;
CREATE POLICY "Admins and instructors can manage lesson maneuvers"
  ON lesson_maneuvers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'instructor')
    )
  );

-- =====================================================================
-- HELPFUL VIEWS
-- =====================================================================

-- View: Lesson maneuvers with full details
CREATE OR REPLACE VIEW lesson_maneuvers_detailed AS
SELECT 
  lm.*,
  sl.title as lesson_title,
  sl.lesson_type,
  m.name as maneuver_name,
  m.description as maneuver_description,
  m.category as maneuver_category,
  m.faa_reference,
  m.primary_acs_task_code,
  m.tolerances as maneuver_tolerances
FROM lesson_maneuvers lm
JOIN syllabus_lessons sl ON sl.id = lm.lesson_id
JOIN maneuvers m ON m.id = lm.maneuver_id
ORDER BY lm.lesson_id, lm.display_order;

COMMENT ON VIEW lesson_maneuvers_detailed IS 'Complete view of lesson-maneuver relationships with full maneuver and lesson details';

-- View: Maneuver progression through syllabus
CREATE OR REPLACE VIEW maneuver_syllabus_progression AS
SELECT 
  m.id as maneuver_id,
  m.name as maneuver_name,
  m.category,
  sl.syllabus_id,
  s.name as syllabus_name,
  COUNT(lm.id) as appearances_in_syllabus,
  MIN(sl.order_index) as first_lesson_index,
  MAX(sl.order_index) as last_lesson_index,
  ARRAY_AGG(sl.title ORDER BY sl.order_index) as lesson_titles,
  ARRAY_AGG(lm.emphasis_level ORDER BY sl.order_index) as emphasis_progression
FROM maneuvers m
JOIN lesson_maneuvers lm ON lm.maneuver_id = m.id
JOIN syllabus_lessons sl ON sl.id = lm.lesson_id
JOIN syllabi s ON s.id = sl.syllabus_id
GROUP BY m.id, m.name, m.category, sl.syllabus_id, s.name;

COMMENT ON VIEW maneuver_syllabus_progression IS 'Shows how maneuvers progress through a syllabus from introduction to mastery';

-- =====================================================================
-- SAMPLE DATA (Optional - uncomment to seed)
-- =====================================================================

/*
-- Example: Link "Steep Turns" maneuver to "Lesson 5: Basic Maneuvers"
-- Replace UUIDs with actual IDs from your database

INSERT INTO lesson_maneuvers (lesson_id, maneuver_id, is_required, is_introduction, target_proficiency, emphasis_level, instructor_notes, student_prep_notes)
VALUES 
  (
    '[LESSON_UUID]',  -- Lesson 5 UUID
    '[MANEUVER_UUID]',  -- Steep Turns UUID
    true,  -- Required
    true,  -- First introduction
    2,  -- Target: Developing proficiency
    'introduction',  -- Emphasis level
    'Student first exposure to steep turns. Focus on outside visual references and coordination. Keep altitude within 200ft initially.',
    'Review Chapter 5 of PHAK. Watch video on steep turn technique. Understand load factor and overbanking tendency.'
  );
*/

