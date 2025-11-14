# Student Onboarding & Enrollment System - Fix Action Plan
**Date:** November 14, 2025  
**Priority:** CRITICAL  
**Estimated Time:** 32-44 hours (4-5 days)

---

## Priority 1: Critical Fixes (Must Fix Before Launch)

### Fix #1: Create Missing Admin API Route ⚠️ CRITICAL
**File:** `app/admin/students/new/api/route.ts` (DOES NOT EXIST)  
**Estimated Time:** 2 hours

**Problem:**
- `AdminAddStudentForm.tsx` calls `/admin/students/new/api` (line 33)
- This API route does not exist
- Server action exists but is not connected

**Solution:**
Create new API route that wraps the server action:

```typescript
// File: app/admin/students/new/api/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAddStudentServerAction } from '../page.server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const result = await adminAddStudentServerAction(data)
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Testing:**
- [ ] Admin can access add student form
- [ ] Form submits successfully
- [ ] Student receives email with magic link
- [ ] Instructor receives notification

---

### Fix #2: Fix Email Service Type Mismatch ⚠️ CRITICAL
**Files:** `lib/email-service.ts`, multiple API routes  
**Estimated Time:** 3 hours

**Problem:**
- `sendEmail` function expects `html` and `text` parameters
- Multiple places call it with `reactComponent` and `reactProps`
- Emails fail to send or render incorrectly

**Solution Option A (Recommended):** Update email service to support React components

```typescript
// File: lib/email-service.ts
import { renderToStaticMarkup } from 'react-dom/server'

export async function sendEmail(params: {
  to: string
  subject: string
  html?: string
  text?: string
  reactComponent?: React.ComponentType<any>
  reactProps?: any
  from?: string
  reply_to?: string
}): Promise<{ success: boolean; message_id?: string; error?: string }> {
  // If React component provided, render it
  let html = params.html
  if (params.reactComponent && !html) {
    html = renderToStaticMarkup(
      React.createElement(params.reactComponent, params.reactProps)
    )
  }
  
  // Rest of existing code...
}
```

**Solution Option B:** Update all callers to pre-render HTML

**Testing:**
- [ ] Welcome emails send correctly
- [ ] Instructor notification emails send correctly
- [ ] Approval emails send correctly
- [ ] All emails render properly in email clients

---

### Fix #3: Fix Admin Email Query ⚠️ CRITICAL
**File:** `app/api/student/complete-onboarding/route.ts` (line 171)  
**Estimated Time:** 1 hour

**Problem:**
- Query uses `.eq('role', 'admin')` but `profiles` table doesn't have `role` column
- Admins never receive notification emails

**Solution:**
```typescript
// Replace lines 167-172 with:
const { data: admins } = await supabase
  .from('profiles')
  .select(`
    id,
    email,
    first_name,
    last_name
  `)
  .in('id', 
    supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_id', 
        supabase
          .from('roles')
          .select('id')
          .eq('name', 'admin')
          .single()
      )
  )

// OR use a simpler approach with RPC function:
const { data: adminUsers } = await supabase.rpc('get_users_by_role', {
  role_name: 'admin'
})
```

**Testing:**
- [ ] Admin receives email when student completes onboarding
- [ ] Email contains correct student information
- [ ] Multiple admins all receive emails

---

### Fix #4: Fix Missing Supabase Client in Instructor API ⚠️ CRITICAL
**File:** `app/instructor/students/new/api/route.ts` (line 54)  
**Estimated Time:** 1 hour

**Problem:**
- Line 54 references `supabase` variable that is not defined
- API will crash when trying to assign student role

**Solution:**
```typescript
// Add at the top of the POST function (after line 13):
const cookieStore = await cookies()
const supabase = await createClient(cookieStore)

// Then line 54-61 will work correctly
```

**Testing:**
- [ ] Instructor can add student via form
- [ ] Student role is assigned correctly
- [ ] No crashes or undefined variable errors

---

### Fix #5: Remove Hardcoded IDs ⚠️ CRITICAL
**Files:** 
- `components/student/onboarding/onboarding-flow.tsx` (lines 174-180)
- `app/api/student/complete-onboarding/route.ts` (lines 97-101)

**Estimated Time:** 3 hours

**Problem:**
- Hardcoded instructor ID: `7e6acaad-5d48-46e3-ad10-fa9144c541dc`
- Hardcoded syllabus IDs that may not exist in production
- System breaks if these IDs don't exist

**Solution:**

```typescript
// Create new service function: lib/default-instructor-service.ts
export async function getDefaultInstructor() {
  const supabase = await createClient()
  
  // Try to get Thomas Ferrier
  const { data: instructor } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('email', 'thomas@desertskiesaviationaz.com')
    .single()
  
  if (instructor) return instructor
  
  // Fallback: Get any active instructor
  const { data: fallback } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', 
      supabase
        .from('user_roles')
        .select('user_id')
        .eq('role_id',
          supabase
            .from('roles')
            .select('id')
            .eq('name', 'instructor')
        )
    )
    .eq('status', 'active')
    .limit(1)
    .single()
  
  return fallback
}

// Create new service function: lib/syllabus-service.ts
export async function getSyllabusByProgram(program: string) {
  const supabase = await createClient()
  
  const programCategoryMap: Record<string, string> = {
    'private_pilot': 'private',
    'instrument_rating': 'instrument',
    'commercial_pilot': 'commercial',
    'multi_engine': 'multi-engine',
    'flight_instructor': 'instructor',
    'discovery_flight': 'discovery'
  }
  
  const category = programCategoryMap[program] || 'private'
  
  const { data: syllabus } = await supabase
    .from('syllabi')
    .select('id, name, description, category')
    .eq('category', category)
    .eq('is_active', true)
    .limit(1)
    .single()
  
  return syllabus
}
```

**Update onboarding-flow.tsx:**
```typescript
// Remove lines 174-180 (hardcoded SYLLABUS_MAP and DEFAULT_INSTRUCTOR_ID)
// Import the new service functions
import { getDefaultInstructor } from '@/lib/default-instructor-service'
import { getSyllabusByProgram } from '@/lib/syllabus-service'

// Update enrollment creation logic (lines 274-300) to use service functions
```

**Testing:**
- [ ] System works with Thomas Ferrier's account
- [ ] System works with different instructor
- [ ] System works with different syllabi
- [ ] Proper error handling if no instructor/syllabus found

---

### Fix #6: Fix Duplicate Enrollment Creation ⚠️ CRITICAL
**Files:** 
- `components/student/onboarding/onboarding-flow.tsx` (lines 274-300)
- `app/api/student/complete-onboarding/route.ts` (lines 131-149)

**Estimated Time:** 2 hours

**Problem:**
- Enrollment created in onboarding flow during program selection step
- Enrollment also created in complete-onboarding API
- Results in duplicate enrollments

**Solution:**

**Option A (Recommended):** Remove enrollment creation from onboarding flow
```typescript
// In onboarding-flow.tsx, remove lines 274-300
// Only save syllabus_id to onboarding record, don't create enrollment
// Let complete-onboarding API handle enrollment creation
```

**Option B:** Check for existing enrollment before creating
```typescript
// In complete-onboarding API, add check:
const { data: existingEnrollment } = await supabase
  .from('student_enrollments')
  .select('id')
  .eq('student_id', user.id)
  .eq('syllabus_id', syllabus.id)
  .eq('instructor_id', instructorId)
  .maybeSingle()

if (!existingEnrollment) {
  // Create new enrollment
}
```

**Testing:**
- [ ] Only one enrollment created per student
- [ ] Enrollment has correct status (pending_approval)
- [ ] No duplicate enrollments in database

---

### Fix #7: Add Unique Constraints ⚠️ CRITICAL
**Database Migration**  
**Estimated Time:** 2 hours

**Problem:**
- No unique constraint on `student_onboarding.user_id`
- No unique constraint preventing duplicate enrollments
- Data integrity issues

**Solution:**

```sql
-- File: database/migrations/add_unique_constraints.sql

-- Add unique constraint to student_onboarding
ALTER TABLE student_onboarding
ADD CONSTRAINT student_onboarding_user_id_unique UNIQUE (user_id);

-- Add unique constraint to student_enrollments
-- Allow same student to enroll in different programs or with different instructors
-- But prevent exact duplicates
ALTER TABLE student_enrollments
ADD CONSTRAINT student_enrollments_unique_active 
UNIQUE (student_id, syllabus_id, instructor_id, status)
WHERE status IN ('pending_approval', 'active');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_onboarding_user_id 
ON student_onboarding(user_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_status 
ON student_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id 
ON student_enrollments(student_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_instructor_id 
ON student_enrollments(instructor_id);
```

**Testing:**
- [ ] Cannot create duplicate onboarding records
- [ ] Cannot create duplicate enrollments
- [ ] Queries are fast with indexes
- [ ] Can still create multiple enrollments for different programs

---

## Priority 2: Major Fixes (Fix Soon)

### Fix #8: Add Email Verification
**Estimated Time:** 4 hours

**Current State:** Users can sign up and immediately access system  
**Desired State:** Users must verify email before accessing system

**Implementation:**
1. Update signup flow to require email confirmation
2. Add email verification page
3. Update middleware to check email verification
4. Add resend verification email functionality

---

### Fix #9: Add URL Parameter Pre-fill
**File:** `components/auth/signup-form.tsx`  
**Estimated Time:** 1 hour

**Current State:** Invitation links include email/name but form doesn't use them  
**Desired State:** Form pre-fills from URL parameters

**Implementation:**
```typescript
// In SignupForm component, add:
const searchParams = useSearchParams()

useEffect(() => {
  const email = searchParams.get('email')
  const firstName = searchParams.get('firstName')
  const lastName = searchParams.get('lastName')
  
  if (email) form.setValue('email', email)
  if (firstName) form.setValue('firstName', firstName)
  if (lastName) form.setValue('lastName', lastName)
}, [searchParams])
```

---

### Fix #10: Add Document Upload Validation
**File:** `components/student/onboarding/onboarding-flow.tsx`  
**Estimated Time:** 2 hours

**Current State:** Document upload step is optional  
**Desired State:** Require ID and medical certificate before completion

**Implementation:**
1. Change `required: false` to `required: true` for document-upload step
2. Add validation in completion step
3. Show warning if required documents missing
4. Block completion until documents uploaded

---

### Fix #11: Integrate Invite Student Dialog
**Files:** 
- `app/admin/students/page.tsx`
- `app/admin/students/invite-student-dialog.tsx`

**Estimated Time:** 2 hours

**Current State:** Beautiful invitation dialog exists but is not used  
**Desired State:** Admin can click button to open invitation dialog

**Implementation:**
```typescript
// In app/admin/students/page.tsx, add:
import { InviteStudentDialog } from './invite-student-dialog'

// Add state and button:
const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

<Button onClick={() => setInviteDialogOpen(true)}>
  Invite Student
</Button>

<InviteStudentDialog
  isOpen={inviteDialogOpen}
  onClose={() => setInviteDialogOpen(false)}
  onSuccess={() => {
    setInviteDialogOpen(false)
    // Refresh student list
  }}
/>
```

---

### Fix #12: Add Better Error Handling
**All API Routes**  
**Estimated Time:** 4 hours

**Implementation:**
1. Add try-catch blocks to all API routes
2. Log errors with context
3. Return user-friendly error messages
4. Add error boundaries in React components

---

### Fix #13: Add Database Indexes
**Already included in Fix #7**

---

## Priority 3: Minor Fixes (Nice to Have)

### Fix #14: Add Onboarding Progress Persistence
**Estimated Time:** 2 hours

Improve auto-save reliability and add progress indicators.

---

### Fix #15: Add Better Loading States
**Estimated Time:** 3 hours

Add skeleton loaders throughout the application.

---

### Fix #16: Add Analytics
**Estimated Time:** 4 hours

Track onboarding completion rates and identify drop-off points.

---

## Testing Checklist

After implementing all Priority 1 fixes, test the following:

### Admin Flow:
- [ ] Admin can access add student form at `/admin/students/new`
- [ ] Admin can fill out student information
- [ ] Admin can select instructors to assign
- [ ] Form submits successfully
- [ ] Student account is created
- [ ] Student receives email with magic link
- [ ] Instructor receives notification email
- [ ] Enrollment is created with correct status
- [ ] No duplicate enrollments created

### Student Signup Flow:
- [ ] Student can access signup page at `/signup`
- [ ] Student can fill out signup form
- [ ] Form validates all fields
- [ ] Account is created successfully
- [ ] Student is redirected to onboarding
- [ ] Onboarding record is created

### Onboarding Flow:
- [ ] Student sees welcome step
- [ ] Student can navigate through all 8 steps
- [ ] Data is auto-saved at each step
- [ ] Student can go back to previous steps
- [ ] Progress bar updates correctly
- [ ] Document upload works
- [ ] Program selection works
- [ ] Completion step creates enrollment
- [ ] Student receives confirmation

### Enrollment Approval Flow:
- [ ] Admin sees pending enrollments at `/admin/enrollments/pending`
- [ ] Admin can view student details
- [ ] Admin can view uploaded documents
- [ ] Admin can approve enrollment
- [ ] Student receives approval email
- [ ] Instructor receives notification
- [ ] Enrollment status changes to 'active'
- [ ] Student can access dashboard

### Email Flow:
- [ ] All emails send successfully
- [ ] All emails render correctly
- [ ] All emails contain correct information
- [ ] All links in emails work

### Database Integrity:
- [ ] No duplicate onboarding records
- [ ] No duplicate enrollments
- [ ] All foreign keys are valid
- [ ] RLS policies work correctly
- [ ] Queries are performant

---

## Implementation Order

### Day 1 (8 hours):
1. Fix #1: Create missing admin API route (2h)
2. Fix #4: Fix missing Supabase client (1h)
3. Fix #3: Fix admin email query (1h)
4. Fix #2: Fix email service (3h)
5. Testing (1h)

### Day 2 (8 hours):
1. Fix #5: Remove hardcoded IDs (3h)
2. Fix #6: Fix duplicate enrollment creation (2h)
3. Fix #7: Add unique constraints (2h)
4. Testing (1h)

### Day 3 (8 hours):
1. Fix #9: Add URL parameter pre-fill (1h)
2. Fix #10: Add document upload validation (2h)
3. Fix #11: Integrate invite dialog (2h)
4. Fix #12: Add better error handling (2h)
5. Testing (1h)

### Day 4-5 (16 hours):
1. End-to-end testing (8h)
2. Bug fixes from testing (4h)
3. Documentation updates (2h)
4. Final review and deployment prep (2h)

---

## Success Criteria

The system is ready for production when:

✅ All Priority 1 fixes are implemented  
✅ All Priority 2 fixes are implemented (or explicitly deferred)  
✅ All items in testing checklist pass  
✅ No critical or major bugs remain  
✅ Documentation is updated  
✅ Code is reviewed  
✅ Deployment plan is ready  

---

## Risk Assessment

### High Risk:
- Database migrations (Fix #7) - Could break existing data
- Email service changes (Fix #2) - Could break all email functionality

### Medium Risk:
- Removing hardcoded IDs (Fix #5) - Could break existing workflows
- Duplicate enrollment fix (Fix #6) - Could affect data integrity

### Low Risk:
- Admin API route (Fix #1) - New feature, won't break existing
- URL parameter pre-fill (Fix #9) - Enhancement only

---

## Rollback Plan

If issues arise after deployment:

1. **Database migrations**: Have rollback SQL ready
2. **Email service**: Keep old version as fallback
3. **API changes**: Use feature flags to disable new code
4. **Monitor**: Watch error logs and user reports closely
5. **Quick fixes**: Have team ready for immediate patches

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Next Review:** After Priority 1 fixes are complete

