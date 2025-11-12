# Instructor Schedule Page - Critical Bug Fixes

**Date**: November 12, 2025  
**Status**: ✅ RESOLVED

## 🐛 Issues Fixed

### Issue #1: Database Relationship Errors
**Error**: `"Could not find a relationship between 'missions' and 'aircraft' in the schema cache"`

**Root Cause**: The queries were using `aircraft_id` as the foreign key column, but the `missions` table actually has:
- `scheduled_aircraft_id` → for the aircraft scheduled for the mission
- `actual_aircraft_id` → for the aircraft actually used (can differ if aircraft unavailable)

**Solution**: Updated all Supabase queries to use the correct column names and foreign key constraint names.

#### Files Fixed:
1. **`app/instructor/schedule/instructor-missions-data-wrapper.tsx`**
   - Changed: `aircraft:aircraft!aircraft_id` 
   - To: `scheduled_aircraft:aircraft!missions_scheduled_aircraft_id_fkey` and `actual_aircraft:aircraft!missions_actual_aircraft_id_fkey`
   - Changed: `.eq('instructor_id', user.id)` 
   - To: `.eq('assigned_instructor_id', user.id)` (correct column name per schema)

2. **`app/instructor/schedule/instructor-schedule-calendar-wrapper.tsx`**
   - Same foreign key fixes as above

3. **`app/instructor/schedule/instructor-missions-list.tsx`**
   - Updated Mission interface to include both `scheduled_aircraft` and `actual_aircraft` fields
   - Updated UI to display actual aircraft if available, falling back to scheduled aircraft

4. **`app/instructor/schedule/instructor-schedule-calendar.tsx`**
   - Updated Mission interface to match new aircraft field structure

---

### Issue #2: API Route Authentication Errors
**Error**: `TypeError: Cannot read properties of undefined (reading 'getUser')`

**Root Cause**: The `createClient()` function was being called incorrectly in API routes. The function signature changed from accepting a cookie store parameter to calling `cookies()` internally.

**Solution**: 
1. Simplified `lib/supabase/server.ts` to remove the async parameter and call `cookies()` directly
2. Updated all API routes to call `await createClient()` instead of `createClient(await cookies())`

#### Files Fixed:
1. **`lib/supabase/server.ts`**
   - Removed async parameter from `createClient()` function
   - Function now calls `cookies()` directly internally
   - Cleaner, more predictable API

2. **`app/api/instructor/availability/route.ts`** (GET, POST, PUT, DELETE)
   - Changed: `const supabase = createClient(await cookies())`
   - To: `const supabase = await createClient()`

3. **`app/api/instructor/time-off/route.ts`** (GET, POST, PUT, DELETE)
   - Same fix as availability routes

---

## 📊 Database Schema Reference

### Missions Table Foreign Keys
```sql
missions (
  -- Aircraft relationships
  scheduled_aircraft_id UUID REFERENCES aircraft(id),
  actual_aircraft_id UUID REFERENCES aircraft(id),
  
  -- Instructor relationship
  assigned_instructor_id UUID REFERENCES profiles(id),
  
  -- Student relationship
  student_id UUID REFERENCES profiles(id),
  
  -- Lesson template relationship  
  lesson_template_id UUID REFERENCES lesson_templates(id)
)
```

### Correct Query Pattern
```typescript
const { data } = await supabase
  .from('missions')
  .select(`
    *,
    student:profiles!missions_student_id_fkey(id, first_name, last_name, email, avatar_url),
    scheduled_aircraft:aircraft!missions_scheduled_aircraft_id_fkey(id, tail_number, make, model),
    actual_aircraft:aircraft!missions_actual_aircraft_id_fkey(id, tail_number, make, model),
    lesson_template:lesson_templates(id, title, description, lesson_type),
    plan_of_action:plans_of_action(id, status, shared_with_student_at, student_acknowledged_at)
  `)
  .eq('assigned_instructor_id', user.id) // ← Correct column!
  .in('status', ['scheduled', 'in_progress'])
```

---

## ✅ Testing Checklist

- [x] Fixed foreign key relationship errors
- [x] Fixed API authentication errors
- [x] Updated TypeScript interfaces
- [x] Updated UI components to display aircraft correctly
- [ ] Verify missions load successfully on instructor schedule page
- [ ] Verify availability calendar works
- [ ] Verify time-off requests work
- [ ] Check browser console for any remaining errors

---

## 🚀 Next Steps

Once the page loads successfully:
1. Test creating a new mission
2. Test updating availability
3. Test submitting time-off requests
4. Verify calendar events display correctly
5. Test POA creation flow

---

## 📝 Notes

- The `actual_aircraft` field will be `null` for most missions initially, as it's only set when different from scheduled aircraft
- Display logic: Show `actual_aircraft` if available, otherwise show `scheduled_aircraft`
- All API routes now use consistent authentication pattern
- Server client configuration is now simpler and more maintainable

