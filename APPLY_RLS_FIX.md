# 🚀 Apply RLS Fix for Syllabus Lessons

## ✅ Issue Identified

**Root Cause**: The `syllabus_lessons` table has **NO RLS policies** defined, causing silent update failures for admin/instructor users.

---

## 📋 How to Apply the Fix

### Option 1: Via Supabase Dashboard (Recommended)

1. **Navigate to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `ixckucusqhjizjmfrvdg`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste the Migration**
   - Open `database/fix-syllabus-lessons-rls.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Execute the Migration**
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait for execution to complete
   - Check for any errors in the output

5. **Verify the Fix**
   - Scroll to the bottom of the results
   - You should see two result tables:
     - **Table 1**: List of policies (should show 5 policies)
     - **Table 2**: RLS status (both tables should show `rowsecurity = true`)

### Option 2: Via Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project
supabase link --project-ref ixckucusqhjizjmfrvdg

# Apply the migration
supabase db execute -f database/fix-syllabus-lessons-rls.sql
```

### Option 3: Via psql (if you have direct database access)

```bash
psql "postgresql://[connection-string]" -f database/fix-syllabus-lessons-rls.sql
```

---

## 🧪 Test the Fix

After applying the migration, test the comprehensive lesson editor:

### Test Steps:

1. **Navigate to Admin Panel**
   - Go to: `http://localhost:3000/admin/syllabi`
   - Select a syllabus
   - Click "Edit" tab

2. **Open Comprehensive Lesson Editor**
   - Click "Full Edit" on any lesson
   - The comprehensive editor dialog should open

3. **Make Changes**
   - Update the lesson title (e.g., add " - UPDATED" to the end)
   - Change the estimated hours (e.g., from 2.0 to 2.5)
   - Change the lesson type (e.g., from "Ground" to "Flight")

4. **Save Changes**
   - Click "Save Changes"
   - You should see a success toast notification

5. **Verify Changes Persisted**
   - Close the editor dialog
   - **Refresh the page** (Ctrl/Cmd + R)
   - Check if your changes are still there

6. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for log messages:
     ```
     [CLIENT] Update successful: {success: true}
     ```
   - Should NOT see any RLS errors

---

## 🔍 Expected Results

### Before Fix:
- ❌ Changes appear to save but don't persist after refresh
- ❌ Database rejects UPDATE due to missing RLS policies
- ❌ Silent failure - no error messages

### After Fix:
- ✅ Changes save successfully
- ✅ Changes persist after page refresh
- ✅ RLS policies allow admin/instructor users to update
- ✅ Console shows success messages

---

## 📊 What the Migration Does

1. **Enables RLS** on `syllabus_lessons` and `syllabi` tables (if not already enabled)

2. **Drops Conflicting Policies** (if any exist)

3. **Creates 5 New Policies:**

   **For `syllabus_lessons`:**
   - ✅ **"Anyone can view active lessons"** - SELECT for all users
   - ✅ **"Admins can manage all lessons"** - ALL operations for admin role
   - ✅ **"Instructors can manage all lessons"** - ALL operations for instructor role

   **For `syllabi`:**
   - ✅ **"Anyone can view active syllabi"** - SELECT for all users
   - ✅ **"Admins can manage all syllabi"** - ALL operations for admin role
   - ✅ **"Instructors can view all syllabi"** - SELECT for instructor role

4. **Verifies** that policies are in place with built-in checks

---

## ⚠️ Important Notes

### User Roles

Your user (`thomas@desertskiesaviationaz.com`) has both roles:
- ✅ `admin`
- ✅ `instructor`

This means you'll match BOTH the admin AND instructor policies, ensuring you have full access.

### Policy Evaluation

RLS policies with `FOR ALL` allow:
- ✅ SELECT (read)
- ✅ INSERT (create)
- ✅ UPDATE (modify)
- ✅ DELETE (remove)

The policies use the `user_roles` junction table to check roles:
```sql
EXISTS (
  SELECT 1 FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid()
  AND r.name IN ('admin', 'instructor')
)
```

---

## 🐛 Troubleshooting

### If Changes Still Don't Persist:

1. **Check RLS Status**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('syllabus_lessons', 'syllabi');
   ```
   Both should show `rowsecurity = true`

2. **Check Policies Exist**
   ```sql
   SELECT tablename, policyname, cmd
   FROM pg_policies 
   WHERE tablename IN ('syllabus_lessons', 'syllabi')
   ORDER BY tablename, policyname;
   ```
   Should show 5 policies (3 for syllabus_lessons, 2 for syllabi)

3. **Check Your Roles**
   ```sql
   SELECT r.name as role_name
   FROM user_roles ur
   JOIN roles r ON r.id = ur.role_id
   WHERE ur.user_id = auth.uid();
   ```
   Should show `admin` and/or `instructor`

4. **Check for RLS Errors**
   - Open browser DevTools
   - Go to Network tab
   - Look for failed API calls
   - Check response for RLS-related errors

---

## 📞 Need Help?

If issues persist after applying the migration:

1. **Check Supabase Logs**
   - Dashboard → Logs → Postgres
   - Look for RLS policy violations

2. **Verify User Context**
   - Make sure you're logged in as `thomas@desertskiesaviationaz.com`
   - Clear browser cache/cookies and re-login

3. **Test with Different Roles**
   - Try with a pure instructor account (if available)
   - Try with a pure admin account
   - This helps isolate role-specific issues

---

## ✅ Success Criteria

The fix is successful when:

1. ✅ You can update lesson titles, descriptions, types, and hours
2. ✅ Changes persist after page refresh
3. ✅ No RLS errors in browser console
4. ✅ Database queries show updated values
5. ✅ All 5 RLS policies are visible in Supabase Dashboard

---

**File to Execute**: `database/fix-syllabus-lessons-rls.sql`

**Estimated Time**: 2-3 minutes

**Impact**: Immediate fix for lesson update functionality

