-- Add Part 61 vs Part 141 field to syllabi table
-- This determines which FAA training regulations apply to the syllabus

ALTER TABLE syllabi 
ADD COLUMN IF NOT EXISTS training_part TEXT DEFAULT '61' CHECK (training_part IN ('61', '141'));

COMMENT ON COLUMN syllabi.training_part IS 'FAA training regulation: Part 61 (traditional) or Part 141 (approved school)';

-- Update existing syllabi to default to Part 61
UPDATE syllabi 
SET training_part = '61' 
WHERE training_part IS NULL;

