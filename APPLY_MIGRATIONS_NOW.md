# 🚀 Apply Database Migrations - Quick Guide

## ⚡ **What You Need to Do Now**

Apply the database schema to make everything work!

---

## **Step 1: Apply Lesson-Maneuvers Schema** ⏱️ 2 min

This creates the table that links lessons to maneuvers.

### **Using Supabase MCP Tools** (Recommended):

I can run this for you! Just say "apply the lesson maneuvers migration" and I'll use MCP tools to apply it directly to your database.

### **Manual Method** (Alternative):

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `database/lesson-maneuvers-schema.sql`
3. Paste and click "Run"

---

## **Step 2: Verify Existing Tables** ✅

These tables should already exist (from previous migrations):
- ✅ `lesson_acs_standards` - Links lessons to ACS tasks
- ✅ `maneuver_scores` - Stores maneuver scores and instructor notes
- ✅ `student_maneuver_progress` - Tracks longitudinal progress
- ✅ `missions` and `training_events` - Mission workflow system

**Check if they exist:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'lesson_acs_standards',
    'maneuver_scores',
    'student_maneuver_progress',
    'missions',
    'training_events',
    'lesson_maneuvers'
  );
```

If any are missing, let me know and I'll help apply them!

---

## **Step 3: Link Lessons to Maneuvers** 📝 (Optional for now)

After the schema is applied, you can start linking maneuvers to lessons:

### **Example: Link Steep Turns to Lesson 5**
```sql
-- Find the lesson and maneuver IDs first
SELECT id, title FROM syllabus_lessons WHERE title ILIKE '%steep turn%';
SELECT id, name FROM maneuvers WHERE name ILIKE '%steep turn%';

-- Then link them
INSERT INTO lesson_maneuvers (
  lesson_id, 
  maneuver_id, 
  is_required, 
  is_introduction, 
  target_proficiency, 
  emphasis_level,
  instructor_notes
) VALUES (
  '[lesson-id-from-above]',
  '[maneuver-id-from-above]',
  true,  -- Required
  true,  -- First introduction
  3,     -- Target: Proficient (1-4 scale)
  'proficiency',  -- Emphasis level
  'First introduction to steep turns. Focus on outside visual references and coordination.'
);
```

### **Bulk Linking (Smart Way)**
I can help you create a bulk linking script based on your syllabus structure. Just tell me which lessons have which maneuvers!

---

## **Step 4: Test the UI** 🎉

1. Navigate to `/instructor/syllabi`
2. Click into any syllabus
3. Click into a lesson
4. You should see:
   - ✅ Maneuvers on the Overview tab (will be empty until you link some)
   - ✅ Performance standards as checkboxes
   - ✅ ACS Standards tab working (if ACS standards are linked)
   - ✅ Compact, improved UI

---

## **Quick Test Query**

After applying migrations, run this to verify:

```sql
-- Check if lesson_maneuvers table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'lesson_maneuvers'
ORDER BY ordinal_position;

-- Should return columns:
-- id, lesson_id, maneuver_id, is_required, is_introduction, 
-- target_proficiency, display_order, emphasis_level, 
-- instructor_notes, student_prep_notes, created_at, updated_at, created_by
```

---

## **What Happens If I Don't Apply Migrations?**

The UI will still work, but:
- ⚠️ Maneuvers won't show on Overview tab (nothing linked yet)
- ⚠️ Maneuvers tab will show "No Maneuvers Linked" message
- ✅ ACS Standards tab will work (already exists)
- ✅ Performance standards checklist will work
- ✅ Historical notes component will work when you use it

**Everything degrades gracefully!** No errors, just empty states.

---

## **Need Help?**

Just ask me to:
- "Apply the lesson maneuvers migration"
- "Link [maneuver name] to [lesson name]"
- "Show me all lessons in [syllabus name]"
- "Show me all maneuvers"

I can use MCP Supabase tools to do it all for you! 🚀

---

## **Summary Checklist**

- [ ] Apply `database/lesson-maneuvers-schema.sql`
- [ ] Verify existing tables (lesson_acs_standards, maneuver_scores, etc.)
- [ ] Test instructor lesson detail page
- [ ] Link maneuvers to lessons (optional, can do gradually)
- [ ] Celebrate! 🎉

**Total time: ~5 minutes** ⏱️

---

**Ready? Let's do it!** 🚀

Say "apply the migrations" and I'll use MCP tools to run them for you!

