-- Fix lesson_type values to match the expected enum values
-- This fixes the issue where filter doesn't work because lesson types are incorrectly cased

-- Update all lesson_type values to title case (proper format)
UPDATE syllabus_lessons
SET lesson_type = CASE
  WHEN LOWER(lesson_type) = 'flight' THEN 'Flight'
  WHEN LOWER(lesson_type) = 'ground' THEN 'Ground'
  WHEN LOWER(lesson_type) = 'simulator' OR LOWER(lesson_type) = 'sim' THEN 'Simulator'
  WHEN LOWER(lesson_type) = 'briefing' THEN 'Briefing'
  WHEN LOWER(lesson_type) = 'checkride' OR LOWER(lesson_type) = 'stage_check' OR LOWER(lesson_type) = 'check_ride' THEN 'Checkride'
  WHEN LOWER(lesson_type) = 'progress_check' THEN 'Checkride'
  ELSE 'Ground' -- Default to Ground if unknown
END
WHERE lesson_type IS NOT NULL;

-- Set NULL lesson types to 'Ground' as default
UPDATE syllabus_lessons
SET lesson_type = 'Ground'
WHERE lesson_type IS NULL;

-- Add a check constraint to enforce valid lesson types (optional)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'syllabus_lessons_lesson_type_check'
  ) THEN
    ALTER TABLE syllabus_lessons 
    ADD CONSTRAINT syllabus_lessons_lesson_type_check 
    CHECK (lesson_type IN ('Flight', 'Ground', 'Simulator', 'Briefing', 'Checkride'));
  END IF;
END $$;

COMMENT ON COLUMN syllabus_lessons.lesson_type IS 'Type of lesson: Flight, Ground, Simulator, Briefing, or Checkride';

