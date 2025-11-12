# Setup and Verification Guide - Mission System

## 🔍 Step 1: Verify Database Schema

Run this script to check if the missions system is set up:

```sql
-- Copy this entire script and run it in Supabase SQL Editor
-- File: database/check-and-create-missions.sql
```

### Expected Output:

✅ **Good Status:**
```
✅ Missions table exists
✅ RLS policies exist on missions table
Policy count: 5+
```

❌ **Bad Status (Need to Fix):**
```
❌ MISSIONS TABLE DOES NOT EXIST
You need to run: database/mission-workflow-schema.sql first
```

---

## 🛠️ Step 2: Create Missions Schema (If Needed)

If missions table doesn't exist, run this in Supabase SQL Editor:

**File:** `database/mission-workflow-schema.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy entire contents of `database/mission-workflow-schema.sql`
4. Run it
5. **Verify:** You should see "CREATE TABLE" success messages

---

## 🌱 Step 3: Seed Demo Data

Once schema exists, create demo missions:

**File:** `database/demo-mission-data.sql`

### Prerequisites Check:

```sql
-- Verify prerequisites exist
SELECT 
  'Student exists' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM profiles 
WHERE id = 'ecf47875-0204-4859-865f-1d310d022231'

UNION ALL

SELECT 
  'Instructor exists',
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM profiles 
WHERE email = 'thomas@desertskiesaviationaz.com'

UNION ALL

SELECT 
  'Syllabus exists',
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM syllabi
WHERE title ILIKE '%private pilot%' OR title ILIKE '%sporty%'

UNION ALL

SELECT 
  'Aircraft exist',
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM aircraft

UNION ALL

SELECT 
  'Maneuvers exist',
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END
FROM maneuvers;
```

### Run Demo Data:

1. Copy entire contents of `database/demo-mission-data.sql`
2. Paste in Supabase SQL Editor
3. Run it
4. **Look for:** RAISE NOTICE messages showing created IDs

---

## 📊 Step 4: Verify Data Created

Run this query to see your demo missions:

```sql
-- View created missions
SELECT 
  m.mission_code,
  m.mission_type,
  m.status,
  m.scheduled_date,
  CASE WHEN m.plan_of_action_id IS NOT NULL THEN '✅ Has POA' ELSE '❌ No POA' END as poa_status,
  CASE WHEN m.debrief_id IS NOT NULL THEN '✅ Has Debrief' ELSE '❌ No Debrief' END as debrief_status,
  CONCAT(i.first_name, ' ', i.last_name) as instructor
FROM missions m
LEFT JOIN profiles i ON i.id = m.assigned_instructor_id
WHERE m.student_id = 'ecf47875-0204-4859-865f-1d310d022231'
ORDER BY m.scheduled_date DESC;
```

### Expected Result:

| mission_code | mission_type | status | scheduled_date | poa_status | debrief_status |
|--------------|--------------|--------|----------------|------------|----------------|
| DSA-PPC-F1   | F (Flight)   | scheduled | +2 days     | ✅ Has POA  | ❌ No Debrief  |
| DSA-PPC-F0   | F (Flight)   | completed | -7 days     | ❌ No POA   | ✅ Has Debrief |

---

## 🔐 Step 5: Verify RLS Policies

Check if student can see missions:

```sql
-- Test RLS as student
SELECT 
  mission_code,
  status,
  scheduled_date
FROM missions
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';
```

**If this returns 0 rows but missions exist:**

RLS policies are blocking access. Check:

```sql
-- View current policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'missions';
```

**Fix:** The policy should be:
```sql
CREATE POLICY "Students can view their own missions" ON missions
FOR SELECT USING (student_id = auth.uid());
```

---

## 🎨 Step 6: Test in Application

### Test URLs:

1. **Schedule (Main View)**
   ```
   /student/schedule
   ```
   Should show:
   - List view / Calendar view tabs
   - Upcoming, In Progress, Completed, All tabs
   - Mission cards with Flight/Ground/Sim icons
   - "Review POA" and "View Debrief" buttons

2. **Dashboard**
   ```
   /student/dashboard
   ```
   Should show:
   - "Upcoming Missions" section at top
   - Next 3 missions
   - Quick action buttons

3. **Mission Detail**
   ```
   /student/missions/[mission-id]
   ```
   Should show:
   - Complete mission overview
   - Training events timeline
   - Quick actions sidebar

4. **Plan of Action**
   ```
   /student/missions/[mission-id]/poa
   ```
   Should show:
   - Mission overview
   - Training objectives
   - Focus areas
   - Video resources
   - FAA references
   - Pre-flight checklist
   - "I've Reviewed This POA" button

5. **Debrief**
   ```
   /student/missions/[mission-id]/debrief
   ```
   Should show:
   - General overview
   - Key takeaways
   - Maneuver scores (1-4 scale)
   - FAR references discussed
   - Next steps

---

## 🐛 Troubleshooting

### Problem: "Missions table does not exist"

**Solution:**
```bash
# Run schema creation script
# In Supabase SQL Editor:
# Paste contents of database/mission-workflow-schema.sql
```

### Problem: "No missions showing in UI"

**Check:**
1. Open browser DevTools → Console
2. Look for logs starting with `[mission-service]` or `[UpcomingMissionsSection]`
3. Check for RLS errors

**Common Issues:**
- User ID mismatch (check console logs)
- RLS policy not applied
- Demo data not seeded
- Wrong student ID in demo data

**Debug Query:**
```sql
-- Check what the app sees
SELECT 
  id,
  mission_code,
  student_id,
  status
FROM missions 
WHERE student_id = 'ecf47875-0204-4859-865f-1d310d022231';

-- Verify student can access
SET request.jwt.claim.sub = 'ecf47875-0204-4859-865f-1d310d022231';
SELECT * FROM missions WHERE student_id = auth.uid();
```

### Problem: "Plan of Action not found"

**Check:**
```sql
SELECT 
  poa.id,
  poa.status,
  poa.shared_with_student_at,
  m.mission_code
FROM plans_of_action poa
JOIN missions m ON m.id = poa.mission_id
WHERE poa.student_id = 'ecf47875-0204-4859-865f-1d310d022231';
```

**Fix:** Re-run demo data script to create POA

### Problem: "Instructor not found"

**Check:**
```sql
SELECT 
  id,
  email,
  first_name,
  last_name
FROM profiles
WHERE email = 'thomas@desertskiesaviationaz.com';
```

**Fix:** 
1. Update email in demo script, OR
2. Create instructor profile first

---

## 📝 Console Logging

### What to Look For:

When you load `/student/schedule`, you should see:

```
[StudentSchedulePage] Loading schedule for user: ecf47875-0204-4859-865f-1d310d022231
[mission-service] getStudentMissions called for student: ecf47875-0204-4859-865f-1d310d022231
[mission-service] Filters: {"status":null}
[mission-service] Authenticated user: ecf47875-0204-4859-865f-1d310d022231
[mission-service] Found missions: 2
[StudentSchedulePage] Loaded missions: 2
```

### Bad Logs (Problems):

```
[mission-service] User ID mismatch! Auth: xxx Requested: yyy
→ User not logged in correctly

[mission-service] Found missions: 0
→ RLS blocking or no data seeded

ERROR: relation "missions" does not exist
→ Schema not created
```

---

## 🎯 Mission System Overview

### Mission Types:

1. **F - Flight Mission**
   - References syllabus flight lesson
   - Has aircraft assignment
   - Includes pre-brief, flight, post-brief events
   - Tracks maneuvers performed in flight
   - Logs flight hours

2. **G - Ground Mission**  
   - References syllabus ground lesson
   - No aircraft needed
   - Includes ground instruction events
   - Logs ground hours
   - Can include written exam prep, oral exam, etc.

3. **S - Simulator Mission**
   - References syllabus simulator lesson
   - Has simulator assignment
   - Similar structure to flight mission
   - Tracks simulator hours
   - Practices procedures, emergencies, etc.

### Mission Container Includes:

- **Syllabus Lesson Reference** - What you're learning
- **Plan of Action** - Pre-mission preparation
- **Training Events** - Atomic billable units (pre-brief, main training, post-brief)
- **Debrief** - Post-mission feedback and assessment
- **Maneuver Scores** - Performance tracking (1-4 scale)
- **Hours Logged** - Flight, ground, or simulator time
- **Billing** - Student charges and instructor payout

---

## ✅ Success Checklist

- [ ] Missions table exists in database
- [ ] RLS policies applied (5+ policies on missions table)
- [ ] Demo data seeded (2 missions for test student)
- [ ] Student user exists with correct ID
- [ ] Instructor user exists with correct email
- [ ] `/student/schedule` page loads without errors
- [ ] Missions visible in list view
- [ ] Missions visible in calendar view
- [ ] "Review POA" button appears for upcoming mission
- [ ] "View Debrief" button appears for completed mission
- [ ] POA page loads with content
- [ ] Debrief page loads with maneuver scores
- [ ] Console shows expected log messages
- [ ] No RLS errors in console
- [ ] No "relation does not exist" errors

---

## 📞 Quick Reference

### Key Files:

- **Schema:** `database/mission-workflow-schema.sql`
- **Demo Data:** `database/demo-mission-data.sql`
- **Verification:** `database/check-and-create-missions.sql`
- **Schedule Page:** `app/student/schedule/page.tsx`
- **Dashboard Section:** `app/student/dashboard/upcoming-missions-section.tsx`
- **Mission Service:** `lib/mission-service.ts`

### Key Concepts:

- **Mission** = Container for entire training session
- **Training Event** = Atomic billable unit within mission
- **POA** = Pre-mission Plan of Action
- **Debrief** = Post-mission feedback document
- **Maneuver** = Skill practiced and scored in mission

---

**Next:** Once everything is verified, you should see a fully functional mission system with flights, ground sessions, and simulator training all properly organized and accessible to students!

