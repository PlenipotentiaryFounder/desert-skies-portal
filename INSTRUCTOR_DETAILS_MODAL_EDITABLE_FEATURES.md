# Instructor Details Modal - Editable Features Documentation

## Overview
The Instructor Details Modal has been completely redesigned to be fully editable, allowing admins to manage all aspects of an instructor's profile, certifications, rates, and student assignments directly from the interface.

---

## ✅ Implemented Features

### 1. **Overview Tab - Editable Contact Information**

#### What You Can Edit:
- ✅ Phone Number
- ✅ Address (street, city, state)

#### How It Works:
1. Click the **"Edit"** button in the Contact Information card
2. Form fields appear with current values pre-filled
3. Make your changes
4. Click **"Save"** to update or **"Cancel"** to discard changes
5. Updates are saved to the `profiles` table
6. Page refreshes automatically to show new data

#### Backend Function:
```typescript
updateInstructorContact(instructorId, {
  phone_number: string
  address_line1: string
  city: string
  state: string
})
```

---

### 2. **Overview Tab - Stripe Connect Email**

#### Feature:
- **"Send Setup Email"** button in the Stripe Connect card
- Only visible if instructor hasn't completed Stripe Connect setup

#### What It Does:
1. Generates a beautiful HTML email with Stripe Connect onboarding link
2. Sends email to instructor's registered email address
3. Creates a notification in the instructor's account
4. Provides clear instructions and benefits of completing setup

#### Email Content Includes:
- Professional Desert Skies Aviation branding
- Clear call-to-action button
- List of benefits (instant payouts, real-time tracking, etc.)
- 7-day link validity notice
- Support contact information

#### Backend Function:
```typescript
sendStripeConnectEmail(instructorId, instructorEmail, instructorName)
```

---

### 3. **Certifications Tab - Fully Editable**

#### What You Can Edit:
- ✅ **CFI Certification**
  - Toggle checkbox to enable/disable
  - Certificate number
  - Expiration date
  
- ✅ **CFII Certification**
  - Toggle checkbox to enable/disable
  - Expiration date
  
- ✅ **MEI Certification**
  - Toggle checkbox to enable/disable
  - Expiration date

#### How It Works:
1. Click **"Edit Certifications"** button at top of tab
2. Checkbox interface appears for each certification type
3. When a certification is checked, its specific fields appear
4. Fill in certificate numbers and expiration dates
5. Click **"Save"** to update or **"Cancel"** to discard
6. Updates are saved to `instructor_onboarding` table
7. Expiration status badges update automatically

#### Features:
- **Date pickers** for expiration dates
- **Conditional fields** (only show fields for enabled certifications)
- **Color-coded expiration warnings**:
  - 🟢 Green: Valid (>30 days)
  - 🟡 Yellow: Expiring Soon (<30 days)
  - 🔴 Red: Expired (past expiration)

#### Backend Function:
```typescript
updateInstructorCertifications(instructorId, {
  cfi_certificate_number: string
  cfi_expiration_date: string
  cfii_certificate: boolean
  cfii_expiration_date: string
  mei_certificate: boolean
  mei_expiration_date: string
})
```

---

### 4. **Students Tab - Assign Student Feature**

#### Feature:
- **"Assign Student"** button that opens a dedicated assignment dialog

#### Assign Student Dialog Features:

##### Student Search & Selection
- 🔍 **Real-time search** by name or email
- 📋 **Full student list** with scrollable interface
- 👤 **Student profiles** with avatars and contact info
- ⚠️ **Current instructor display** for each student
- 🏷️ **"Has Active Enrollment"** badge for already-assigned students
- ✅ **Visual selection** with highlighted state

##### Syllabus Selection
- 📚 **Dropdown of all active syllabi/programs**
- 📝 Displays program title and FAA type
- Required for enrollment

##### Reassignment Warning
- ⚠️ **Yellow alert box** appears when selecting a student with existing enrollment
- Shows current instructor name
- Explains that assignment will update their enrollment
- Helps prevent accidental reassignments

##### Assignment Process
1. User opens "Assign Student" dialog
2. Searches for and selects a student
3. Chooses the appropriate training program
4. Reviews any reassignment warnings
5. Clicks "Assign Student"
6. System updates enrollment in database
7. Notification sent to student
8. Page refreshes to show updated data

#### Backend Functions:
```typescript
// Get all available students with enrollment status
getAvailableStudentsForAssignment()

// Get active training programs
getAvailableSyllabi()

// Assign or reassign student
assignStudentToInstructor(studentId, instructorId, syllabusId)
```

#### Database Updates:
- **New Student**: Creates new `student_enrollments` record
- **Existing Enrollment**: Updates `instructor_id` in existing enrollment
- **Notification**: Creates notification for student

---

### 5. **Rates Tab - Editable Payout Rates**

#### What You Can Edit:
- ✅ **Flight Instruction Rate** (what instructor receives per hour)
- ✅ **Ground Instruction Rate** (what instructor receives per hour)

#### How It Works:
1. Click **"Edit Rates"** button at top of tab
2. Input fields appear with current rates (displayed in dollars)
3. Enter new rates in **dollars** (e.g., "75.00")
4. Click **"Save"** to create new rate record or **"Cancel"** to discard
5. System converts dollars to cents automatically
6. Previous rates are deactivated (audit trail maintained)
7. New active rate created with effective date
8. Updates `instructor_payout_rates` table

#### Features:
- **Dollar input** for user-friendly editing (converts to cents internally)
- **Rate history** maintained (old rates deactivated, not deleted)
- **Effective dating** (new rate effective from today)
- **Audit trail** (created_by and updated_by tracked)

#### Backend Function:
```typescript
updateInstructorRates(
  instructorId,
  flightRateCents,  // converted from dollars
  groundRateCents,  // converted from dollars
  adminId           // tracks who made the change
)
```

#### Database Behavior:
1. Deactivates all current active rates for this instructor
2. Creates new rate record with:
   - `is_active: true`
   - `effective_date: today`
   - `payout_model: 'hourly'`
   - Admin ID for audit trail

---

## Technical Implementation

### State Management
Each editable section maintains its own state:
- `editingOverview`: Boolean for edit mode
- `editingCertifications`: Boolean for edit mode
- `editingRates`: Boolean for edit mode
- `overviewData`: Form data for contact information
- `certsData`: Form data for certifications
- `ratesData`: Form data for payout rates

### Data Flow
```
User Action
    ↓
Edit Button Click
    ↓
Edit Mode Enabled (state update)
    ↓
Form Fields Displayed
    ↓
User Makes Changes
    ↓
Save Button Click
    ↓
Server Action Called
    ↓
Database Updated
    ↓
Success Toast Displayed
    ↓
Edit Mode Disabled
    ↓
Router Refresh (re-fetches data)
    ↓
UI Updated with New Data
```

### Error Handling
Every update function includes:
- ✅ Try-catch blocks
- ✅ Error logging to console
- ✅ User-friendly error toast messages
- ✅ Graceful failure (edit mode remains open)
- ✅ Success confirmation toasts

### Server Actions
All update functions are server actions (`"use server"`):
- **Security**: Run on server, not exposed to client
- **Authentication**: Use server-side Supabase client with cookies
- **Validation**: Server-side validation before database updates
- **Transactions**: Atomic operations where needed

---

## User Experience Enhancements

### Visual Feedback
- 🎯 **Edit/Save/Cancel buttons** clearly labeled with icons
- 💾 **Loading states** during save operations
- ✅ **Success toasts** confirm actions completed
- ❌ **Error toasts** explain what went wrong
- 🔄 **Auto-refresh** shows updated data immediately

### Form Design
- **Pre-filled values**: Current data loaded into forms
- **Placeholder text**: Helpful examples shown
- **Date pickers**: Standard HTML5 date inputs
- **Number inputs**: Step values for currency (0.01)
- **Checkboxes**: Clear labeling for certifications

### Accessibility
- **Proper labels** for all form fields
- **Keyboard navigation** works throughout
- **Focus management** on edit mode toggle
- **Clear button states** (disabled when no changes)

---

## Database Schema Updates

### Tables Modified

#### `profiles`
```sql
UPDATE profiles SET
  phone_number = $1,
  address_line1 = $2,
  city = $3,
  state = $4,
  updated_at = NOW()
WHERE id = $instructor_id
```

#### `instructor_onboarding`
```sql
UPDATE instructor_onboarding SET
  cfi_certificate_number = $1,
  cfi_expiration_date = $2,
  cfii_certificate = $3,
  cfii_expiration_date = $4,
  mei_certificate = $5,
  mei_expiration_date = $6
WHERE user_id = $instructor_id
```

#### `instructor_payout_rates`
```sql
-- Deactivate old rates
UPDATE instructor_payout_rates SET
  is_active = false
WHERE instructor_id = $1 AND is_active = true;

-- Create new rate
INSERT INTO instructor_payout_rates (
  instructor_id,
  flight_instruction_payout_cents,
  ground_instruction_payout_cents,
  payout_model,
  effective_date,
  is_active,
  created_by,
  updated_by
) VALUES ($1, $2, $3, 'hourly', CURRENT_DATE, true, $4, $4);
```

#### `student_enrollments`
```sql
-- Update existing enrollment
UPDATE student_enrollments SET
  instructor_id = $new_instructor_id,
  updated_at = NOW()
WHERE student_id = $1 AND status = 'active';

-- OR create new enrollment
INSERT INTO student_enrollments (
  student_id,
  instructor_id,
  syllabus_id,
  status,
  start_date
) VALUES ($1, $2, $3, 'active', CURRENT_DATE);
```

#### `notifications`
```sql
-- Various notification types created for:
-- - Student assignment
-- - Stripe Connect reminders
-- - Instructor approvals
```

---

## Security Considerations

### Authentication
- ✅ All server actions require authentication
- ✅ Admin role verified via middleware
- ✅ User session validated with cookies

### Authorization
- ✅ Only admins can access instructor management
- ✅ All database operations use RLS policies
- ✅ Audit trail maintained (who updated what)

### Data Validation
- ✅ Required fields enforced
- ✅ Data types validated (numbers, dates, etc.)
- ✅ String sanitization on inputs
- ✅ Database constraints enforced

---

## Testing Checklist

### Contact Information Editing
- [ ] Can edit phone number and save successfully
- [ ] Can edit address fields and save successfully
- [ ] Cancel button discards changes
- [ ] Validation works for phone format
- [ ] Page refreshes with new data after save

### Stripe Connect Email
- [ ] Button only shows when onboarding incomplete
- [ ] Email sends successfully
- [ ] Notification created for instructor
- [ ] Email contains correct information
- [ ] Error handling works if send fails

### Certification Editing
- [ ] Can toggle CFI on/off
- [ ] Can toggle CFII on/off
- [ ] Can toggle MEI on/off
- [ ] Fields show/hide based on checkbox state
- [ ] Date pickers work correctly
- [ ] Expiration status updates after save
- [ ] Color-coded badges display correctly

### Student Assignment
- [ ] Dialog opens on button click
- [ ] Student search works in real-time
- [ ] Can select a student
- [ ] Syllabus dropdown populates
- [ ] Warning shows for existing enrollments
- [ ] Assignment succeeds for new students
- [ ] Reassignment succeeds for existing students
- [ ] Notification sent to student
- [ ] Page refreshes after assignment

### Rate Editing
- [ ] Can edit flight instruction rate
- [ ] Can edit ground instruction rate
- [ ] Dollar amounts convert to cents correctly
- [ ] Old rates deactivated on save
- [ ] New rate marked as active
- [ ] Effective date set to today
- [ ] Audit fields populated correctly

---

## Future Enhancements

### Potential Additions
1. **Bulk Operations**: Edit multiple instructors at once
2. **History View**: See all past rate changes
3. **Document Upload**: Allow admins to upload certificates
4. **Quick Actions**: Common tasks as one-click buttons
5. **Validation Rules**: More sophisticated input validation
6. **Conflict Detection**: Warn if scheduling conflicts exist
7. **Performance Metrics**: Show instructor statistics inline

### Suggested Improvements
1. **Optimistic Updates**: Update UI before server confirms
2. **Undo Functionality**: Allow reverting recent changes
3. **Batch Saves**: Save multiple changes at once
4. **Draft Mode**: Save changes as draft before committing
5. **Change Tracking**: Visual diff of what changed

---

## Troubleshooting

### Common Issues

#### "Failed to update contact information"
- **Check**: User has admin permissions
- **Check**: Supabase connection is active
- **Check**: profiles table is accessible
- **Check**: RLS policies allow updates

#### "Failed to send Stripe Connect email"
- **Check**: Email service is configured
- **Check**: Environment variables are set
- **Check**: Instructor email is valid
- **Check**: Email service credentials work

#### "Failed to assign student"
- **Check**: Student exists and is active
- **Check**: Syllabus exists and is active
- **Check**: student_enrollments table accessible
- **Check**: Foreign key constraints satisfied

#### "Failed to update rates"
- **Check**: Rates are positive numbers
- **Check**: instructor_payout_rates table accessible
- **Check**: Admin ID is valid
- **Check**: No duplicate effective_date conflict

---

## Best Practices for Admins

### When Editing Contact Information
- ✅ Verify phone number format
- ✅ Confirm address with instructor if updating
- ✅ Keep emergency contact info updated separately

### When Managing Certifications
- ✅ Double-check expiration dates
- ✅ Verify certificate numbers are correct
- ✅ Set reminders for upcoming expirations
- ✅ Upload certificate documents for verification

### When Assigning Students
- ✅ Confirm with both instructor and student
- ✅ Choose appropriate syllabus for student's goals
- ✅ Consider instructor's current workload
- ✅ Review student's previous progress

### When Updating Rates
- ✅ Communicate rate changes to instructor
- ✅ Document reason for rate change
- ✅ Consider instructor's experience level
- ✅ Review average market rates

---

## Support and Documentation

### Related Documentation
- `ADMIN_INSTRUCTORS_PAGE_DOCUMENTATION.md` - Main page overview
- `INSTRUCTOR_ONBOARDING_WORKFLOW.md` - Onboarding process
- Database schema documentation - Table structures

### Support Contacts
- **Technical Issues**: Development Team
- **Business Logic**: Flight Operations Manager
- **Database Issues**: Database Administrator

---

**Last Updated**: November 13, 2025  
**Version**: 2.0.0 (Fully Editable)  
**Maintained By**: Desert Skies Aviation Development Team

