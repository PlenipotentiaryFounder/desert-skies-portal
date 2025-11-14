# 🚀 Database Migration Instructions

## ✅ Code Successfully Pushed!

All code changes have been committed and pushed to GitHub.

**Commit:** `e10cbbf` - feat: Complete student onboarding and dashboard overhaul

---

## ⚠️ IMPORTANT: Run Database Migration

To complete the setup, you need to run the database migration in your Supabase Dashboard.

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/yhwmegltklqytocqrmov
2. Navigate to: **SQL Editor** (left sidebar)

### Step 2: Copy and Paste This SQL

```sql
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
```

### Step 3: Click "Run" (or press Ctrl+Enter)

You should see:
- ✅ "Success. No rows returned"

---

## 🔍 What This Migration Does

1. **Updates enrollment status options:**
   - Adds `pending_approval` status (students awaiting admin review)
   - Keeps existing statuses: active, inactive, completed, cancelled
   - Adds `on_hold` status for temporary suspension

2. **Adds approval tracking:**
   - `approved_by` - UUID of admin who approved
   - `approved_at` - Timestamp of approval
   - `approval_notes` - Admin notes about the approval/rejection

3. **Creates performance index:**
   - Speeds up queries for pending enrollments

---

## 🧪 Test After Migration

1. **Complete onboarding as Test Student 2**
   - Should see "Enrollment Pending Approval" in dashboard

2. **Check admin page:**
   - Go to: `/admin/enrollments/pending`
   - Should see Test Student 2's enrollment

3. **Approve the enrollment:**
   - Click "Approve Enrollment"
   - Student dashboard should update with real training data

---

## 📊 What's New in the Dashboard

### Training Tab:
- ✅ Shows real lessons from assigned syllabus
- ✅ Displays current lesson from active missions
- ✅ Lists upcoming lessons
- ✅ Calculates actual progress

### Progress Tab:
- ✅ Uses real flight log hours
- ✅ Shows maneuver scores (when available)

### Billing Tab:
- ✅ Shows enrollment status
- ✅ Helpful payment information
- ✅ Financing options

### Schedule Tab:
- ✅ Real calendar with missions

### Notifications Tab:
- ✅ Fixed timestamp error

---

## 📝 Quick Reference

**Supabase Project:** yhwmegltklqytocqrmov  
**Migration File:** `database/update-enrollment-status.sql`  
**Git Commit:** e10cbbf

---

**Questions?** All dashboard tabs now use real data. If you see empty states, that's intentional - they explain what will appear once data exists! 🎉

