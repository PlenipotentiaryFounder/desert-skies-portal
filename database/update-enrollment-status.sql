-- Update student_enrollments table to support pending_approval status
-- This is required for the admin approval workflow

-- Drop existing constraint if it exists
ALTER TABLE student_enrollments 
DROP CONSTRAINT IF EXISTS student_enrollments_status_check;

-- Add new constraint with pending_approval status
ALTER TABLE student_enrollments 
ADD CONSTRAINT student_enrollments_status_check 
CHECK (status IN ('pending_approval', 'active', 'inactive', 'completed', 'cancelled', 'on_hold'));

-- Add enrollment approval fields
ALTER TABLE student_enrollments 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Create index for pending approvals
CREATE INDEX IF NOT EXISTS idx_student_enrollments_pending 
ON student_enrollments(status) 
WHERE status = 'pending_approval';

-- Add comment
COMMENT ON COLUMN student_enrollments.status IS 'Status of enrollment: pending_approval (waiting for admin), active (approved and ongoing), inactive (paused), completed (finished), cancelled, on_hold';

