# 🔄 Enhanced Syllabus System - Migration Guide

## Overview

This guide walks through migrating from the basic syllabus system to the enhanced version with full ACS integration, resource management, and AI capabilities.

---

## ⚠️ Prerequisites

### Required
1. **Supabase Project** - Existing Desert Skies Portal database
2. **Database Access** - Admin credentials for schema modifications
3. **Backup** - Full database backup before migration
4. **ACS Data** - ACS schema must be applied first

### Recommended
- Test on staging environment first
- Plan for 15-30 minute downtime
- Notify users of maintenance window

---

## 📋 Migration Steps

### Step 1: Backup Database
```bash
# Using Supabase CLI
supabase db dump -f backup_pre_syllabus_enhancement.sql

# Or via pg_dump
pg_dump -h [host] -U postgres -d postgres > backup.sql
```

### Step 2: Verify ACS Schema
The enhanced syllabus system depends on the ACS schema. Verify it exists:

```sql
-- Check if ACS tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('acs_documents', 'acs_areas', 'acs_tasks');
```

**If ACS tables don't exist**, apply the ACS schema first:
```bash
psql -h [host] -U postgres -d postgres -f database/acs-documents-schema.sql
```

### Step 3: Apply Enhancement Schema
```bash
psql -h [host] -U postgres -d postgres -f database/syllabus-enhancement-schema.sql
```

**This will**:
- ✅ Add new columns to `syllabi` table
- ✅ Add new columns to `syllabus_lessons` table
- ✅ Create `lesson_resources` table
- ✅ Create `lesson_acs_standards` table
- ✅ Create `lesson_far_references` table
- ✅ Create `student_lesson_progress` table
- ✅ Create all necessary indexes
- ✅ Add foreign key constraints
- ✅ Enable Row Level Security (RLS)

### Step 4: Verify Migration
```sql
-- Check new tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'lesson_%';

-- Check new columns on syllabi
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'syllabi' 
  AND column_name IN (
    'faa_regulations_covered',
    'experience_requirements',
    'knowledge_requirements',
    'proficiency_requirements',
    'acs_id',
    'is_template'
  );

-- Check new columns on syllabus_lessons
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'syllabus_lessons' 
  AND column_name IN (
    'objective',
    'performance_standards',
    'pre_brief_content',
    'post_brief_content',
    'student_prep_materials',
    'instructor_notes',
    'ai_guidance_prompt',
    'is_active'
  );
```

### Step 5: Install Dependencies
```bash
# Install drag-and-drop dependencies
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Verify installation
pnpm list | grep dnd-kit
```

### Step 6: Update Environment
No new environment variables required. Verify existing Supabase config:

```bash
# .env.local should have:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 7: Build and Test
```bash
# Install all dependencies
pnpm install

# Run type checks
pnpm run type-check

# Build the application
pnpm run build

# Run development server to test
pnpm run dev
```

### Step 8: Migrate Existing Data (Optional)

If you have existing syllabi and lessons, you may want to populate new fields:

```sql
-- Set all existing lessons as active
UPDATE syllabus_lessons 
SET is_active = true 
WHERE is_active IS NULL;

-- Set default objectives for lessons without them
UPDATE syllabus_lessons 
SET objective = 'Complete lesson objectives as outlined in pre-brief.' 
WHERE objective IS NULL OR objective = '';

-- Set performance standards based on lesson type
UPDATE syllabus_lessons 
SET performance_standards = 
  CASE 
    WHEN lesson_type = 'stage_check' THEN 'Must meet ACS standards for all associated tasks.'
    WHEN lesson_type = 'progress_check' THEN 'Demonstrate improving proficiency toward ACS standards.'
    ELSE 'Demonstrate understanding and execution of lesson maneuvers.'
  END
WHERE performance_standards IS NULL OR performance_standards = '';
```

### Step 9: Seed Sample Data (Development Only)

For testing purposes, you can create sample data:

```sql
-- Create a sample syllabus
INSERT INTO syllabi (
  name,
  description,
  target_certificate,
  version,
  is_active,
  faa_regulations_covered,
  experience_requirements,
  knowledge_requirements,
  proficiency_requirements
) VALUES (
  'Private Pilot Training Syllabus (Part 61)',
  'Comprehensive private pilot training curriculum meeting FAA Part 61 requirements',
  'private',
  '2.0',
  true,
  '{"61.87": "Pre-solo requirements", "61.103": "Eligibility requirements", "61.105": "Aeronautical knowledge", "61.107": "Flight proficiency", "61.109": "Flight time requirements"}',
  '{"solo": "10 hours", "dual": "20 hours", "cross_country": "3 hours"}',
  '{"areas": ["Regulations", "Airspace", "Weather", "Performance", "Systems"]}',
  '{"maneuvers": ["Steep Turns", "Stalls", "Emergency Procedures", "Landings"]}'
) RETURNING id;

-- Create a sample lesson (use the returned syllabus ID)
INSERT INTO syllabus_lessons (
  syllabus_id,
  title,
  description,
  order_index,
  lesson_type,
  estimated_hours,
  objective,
  performance_standards,
  pre_brief_content,
  is_active
) VALUES (
  '[SYLLABUS_ID]', -- Replace with actual ID
  'Introduction to Flight Controls',
  'Learn the four forces of flight and basic aircraft control',
  1,
  'ground',
  2.0,
  'Understand the four forces of flight and how flight controls affect aircraft attitude and movement.',
  'Student must be able to explain lift, weight, thrust, and drag, and identify the flight controls and their effects.',
  'Review Chapter 5 of the Pilot''s Handbook of Aeronautical Knowledge. Be prepared to discuss the four forces and the primary flight controls.',
  true
);
```

---

## 🔒 Security Verification

### RLS Policies Check
```sql
-- Verify RLS is enabled on new tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'lesson_%';

-- Should show rowsecurity = true for all lesson_* tables
```

### Test Access Control
```sql
-- As admin: Should be able to read/write all
-- As instructor: Should be able to read, write own syllabi
-- As student: Should be able to read assigned syllabi only

-- Test queries with different user roles
```

---

## 🧪 Testing Checklist

### Admin Tests
- [ ] Can view all syllabi at `/admin/syllabi`
- [ ] Can create new syllabus
- [ ] Can edit syllabus details
- [ ] Can reorder lessons via drag-drop
- [ ] Can edit lesson in 8-tab editor
- [ ] Can link ACS standards
- [ ] Can add maneuvers
- [ ] Can add FAR references
- [ ] Can upload resources
- [ ] Can delete lessons and syllabi

### Instructor Tests
- [ ] Can view syllabi at `/instructor/syllabi`
- [ ] Can see enrolled students
- [ ] Can view student progress
- [ ] Can view lesson details
- [ ] Can create Plan of Action
- [ ] Voice input works (or gracefully degrades)
- [ ] AI POA generation returns valid data
- [ ] Can access teaching assistant

### Student Tests
- [ ] Can view assigned syllabus at `/student/syllabus`
- [ ] Can see progress bars
- [ ] Current lesson is highlighted
- [ ] Future lessons are locked
- [ ] Can view lesson details
- [ ] Can access pre-brief materials
- [ ] Can view resources
- [ ] Can see ACS standards
- [ ] External links work

### API Tests
```bash
# Test POA generation
curl -X POST http://localhost:3000/api/ai/generate-poa \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Flight 5, heading east to practice slow flight and stalls"}'

# Test recommendations
curl http://localhost:3000/api/ai/lesson-recommendations?studentId=[ID]&syllabusId=[ID]

# Test teaching assistant
curl -X POST http://localhost:3000/api/ai/teaching-assistant \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I teach steep turns?", "lessonId": "[ID]"}'
```

---

## 🔄 Rollback Plan

If issues occur, rollback using these steps:

### Option 1: Database Restore
```bash
# Restore from backup
psql -h [host] -U postgres -d postgres < backup_pre_syllabus_enhancement.sql
```

### Option 2: Remove New Tables Only
```sql
-- Drop new tables (keeps old data intact)
DROP TABLE IF EXISTS lesson_resources CASCADE;
DROP TABLE IF EXISTS lesson_acs_standards CASCADE;
DROP TABLE IF EXISTS lesson_far_references CASCADE;
DROP TABLE IF EXISTS student_lesson_progress CASCADE;

-- Remove new columns from existing tables
ALTER TABLE syllabi 
  DROP COLUMN IF EXISTS faa_regulations_covered,
  DROP COLUMN IF EXISTS experience_requirements,
  DROP COLUMN IF EXISTS knowledge_requirements,
  DROP COLUMN IF EXISTS proficiency_requirements,
  DROP COLUMN IF EXISTS acs_id,
  DROP COLUMN IF EXISTS is_template;

ALTER TABLE syllabus_lessons
  DROP COLUMN IF EXISTS objective,
  DROP COLUMN IF EXISTS performance_standards,
  DROP COLUMN IF EXISTS pre_brief_content,
  DROP COLUMN IF EXISTS post_brief_content,
  DROP COLUMN IF EXISTS student_prep_materials,
  DROP COLUMN IF EXISTS instructor_notes,
  DROP COLUMN IF EXISTS ai_guidance_prompt,
  DROP COLUMN IF EXISTS is_active;
```

---

## 📊 Performance Considerations

### Indexes Created
The migration creates indexes on:
- `lesson_resources.lesson_id`
- `lesson_acs_standards.lesson_id`
- `lesson_acs_standards.acs_task_id`
- `lesson_far_references.lesson_id`
- `student_lesson_progress.student_id`
- `student_lesson_progress.lesson_id`

### Query Performance
Monitor these queries for performance:
```sql
-- Get lesson with all related data
SELECT l.*, 
  json_agg(DISTINCT lr.*) as resources,
  json_agg(DISTINCT las.*) as acs_standards
FROM syllabus_lessons l
LEFT JOIN lesson_resources lr ON l.id = lr.lesson_id
LEFT JOIN lesson_acs_standards las ON l.id = las.lesson_id
WHERE l.id = $1
GROUP BY l.id;

-- Get student progress
SELECT * FROM student_lesson_progress 
WHERE student_id = $1 
ORDER BY updated_at DESC;
```

If slow, add additional indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_slp_updated 
  ON student_lesson_progress(updated_at DESC);
```

---

## 🐛 Common Issues

### Issue 1: "ACS tables do not exist"
**Solution**: Apply ACS schema first:
```bash
psql -h [host] -U postgres -d postgres -f database/acs-documents-schema.sql
```

### Issue 2: "Permission denied for table"
**Solution**: Ensure RLS policies are correctly applied:
```sql
-- Re-apply RLS policies from migration file
-- Check user has correct role in user_profiles
```

### Issue 3: "Module not found: @dnd-kit"
**Solution**: Install dependencies:
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Issue 4: TypeScript errors
**Solution**: Rebuild types:
```bash
pnpm run build
# Or if using Supabase CLI
supabase gen types typescript --local > lib/database.types.ts
```

---

## 📞 Support

If you encounter issues during migration:

1. **Check logs**: Review Supabase logs and Next.js console
2. **Verify schema**: Ensure all tables and columns exist
3. **Test permissions**: Verify RLS policies work for each role
4. **Review backup**: Ensure backup is valid before proceeding

---

## ✅ Post-Migration Checklist

- [ ] Database migration completed successfully
- [ ] All new tables exist with proper constraints
- [ ] New columns added to existing tables
- [ ] RLS policies enabled and tested
- [ ] Dependencies installed (@dnd-kit)
- [ ] Application builds without errors
- [ ] All three user types (Admin, Instructor, Student) tested
- [ ] API endpoints responding correctly
- [ ] Sample data created for testing (optional)
- [ ] Performance monitoring enabled
- [ ] Documentation updated
- [ ] Team notified of new features
- [ ] Training materials prepared for users

---

## 🎉 Success!

Your Enhanced Syllabus System is now live! Users can now benefit from:
- 🎯 Comprehensive lesson builder with ACS integration
- 📚 Rich learning resources for students
- 🤖 AI-powered teaching assistance
- 📊 Detailed progress tracking
- ✨ Modern, intuitive interfaces

**Next Steps**: Monitor usage, gather user feedback, and iterate on features!

