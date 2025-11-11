# Instructor Onboarding System - Implementation Guide

## Overview
Complete instructor onboarding system with invitation links, document uploads, Stripe Connect integration, and calendar sync.

## Database Schema
**File**: `database/instructor-onboarding-schema.sql`

### Tables Created:
1. **instructor_onboarding** - Tracks onboarding progress
   - Personal information
   - Aviation credentials (CFI, CFII, MEI certificates)
   - Emergency contact
   - Document uploads
   - Insurance information
   - 1099 contractor agreement
   - Stripe Connect status
   - Calendar integration status

2. **instructor_invitation_tokens** - Manages invitation links
   - Secure token generation
   - Email tracking
   - Expiration (7 days)
   - Role assignment (instructor, admin)
   - Usage tracking

## API Routes

### Admin Routes
**`/api/admin/instructors/invite`**
- POST: Create new invitation
- GET: List all invitations
- Requires admin role
- Sends email with invitation link

### Instructor Routes
**`/api/instructor/onboarding/accept-invite`**
- POST: Accept invitation and create account
- GET: Verify invitation token
- Creates auth user, profile, and onboarding record

## Pages

### Admin Pages
**`/app/admin/instructors/invite/page.tsx`**
- Admin interface to generate invitation links
- View existing invitations
- Copy invitation URLs
- Track invitation status (active, used, expired)

### Instructor Pages
**`/app/instructor/onboarding/accept/page.tsx`**
- Accept invitation
- Create account with password
- Verify token validity
- Auto-redirect to onboarding

**`/app/instructor/onboarding/page.tsx`**
- Main onboarding flow
- Auto-save functionality
- Progress tracking
- Step-by-step wizard

## Onboarding Steps

### 1. Welcome Step
- Overview of onboarding process
- Benefits of the platform
- Estimated time for each step

### 2. Personal Information
- Name, phone, date of birth
- Full address
- Contact information

### 3. Aviation Background
- CFI certificate number and expiration
- CFII/MEI certificates (if applicable)
- Pilot certificate details
- Medical certificate
- Total flight hours
- Total instruction hours

### 4. Emergency Contact
- Emergency contact name
- Phone number
- Relationship

### 5. Document Upload
Required documents:
- Government ID (driver's license/passport)
- Pilot certificate
- CFI certificate
- Medical certificate
- Birth certificate or passport

### 6. Insurance Verification
- Acknowledge insurance requirement
- Upload insurance policy
- Provider and policy details
- Expiration date

### 7. 1099 Contractor Agreement
- Review contractor agreement
- Electronic signature
- IP address tracking
- Timestamp recording

### 8. Stripe Connect Setup
- Initiate Stripe Connect account
- Complete Stripe onboarding
- Bank account verification
- Payment setup for direct deposits

### 9. Calendar Integration (Optional)
- Connect Google Calendar
- Connect Outlook Calendar
- OAuth flow
- Permission to add events

## Components

### Admin Components
- `components/admin/instructor-invite-form.tsx` - Invitation creation form

### Instructor Onboarding Components
- `components/instructor/onboarding/onboarding-flow.tsx` - Main flow controller
- `components/instructor/onboarding/steps/welcome-step.tsx`
- `components/instructor/onboarding/steps/personal-info-step.tsx`
- `components/instructor/onboarding/steps/aviation-background-step.tsx`
- `components/instructor/onboarding/steps/emergency-contact-step.tsx`
- `components/instructor/onboarding/steps/document-upload-step.tsx`
- `components/instructor/onboarding/steps/insurance-step.tsx`
- `components/instructor/onboarding/steps/contractor-agreement-step.tsx`
- `components/instructor/onboarding/steps/stripe-connect-step.tsx`
- `components/instructor/onboarding/steps/calendar-integration-step.tsx`
- `components/instructor/onboarding/steps/completion-step.tsx`

## Email Templates
**`app/emails/InstructorInvitationEmail.tsx`**
- Professional invitation email
- Invitation link with expiration
- Benefits overview
- Security notice

## Features

### Auto-Save
- Debounced saving (1 second)
- Saves progress on every step
- Recovers on page refresh
- No data loss

### Security
- Secure token generation (32-byte random)
- 7-day expiration
- One-time use tokens
- RLS policies for data access
- Admin-only invitation creation

### Stripe Connect Integration
- Express account creation
- Onboarding link generation
- Webhook handling for account status
- Direct deposit setup
- Payout management

### Calendar Integration
- Google Calendar OAuth
- Outlook Calendar OAuth
- Permission to add/edit events
- Automatic event sync
- Calendar connection tracking

## Middleware Updates Required

Add to `middleware.ts`:

```typescript
// Check if instructor needs to complete onboarding
if (roles.includes('instructor')) {
  const { data: onboarding } = await supabase
    .from('instructor_onboarding')
    .select('completed_at')
    .eq('user_id', user.id)
    .single()
  
  if (!onboarding?.completed_at && !pathname.startsWith('/instructor/onboarding')) {
    return NextResponse.redirect(new URL('/instructor/onboarding', request.url))
  }
}
```

## Environment Variables Required

```env
# Existing Stripe keys
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Calendar OAuth (if not already set)
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
OUTLOOK_CALENDAR_CLIENT_ID=...
OUTLOOK_CALENDAR_CLIENT_VALUE=...

# App URL for invitation links
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Testing Checklist

### Admin Flow
- [ ] Admin can access invitation page
- [ ] Create invitation with instructor role only
- [ ] Create invitation with instructor + admin roles
- [ ] View list of invitations
- [ ] Copy invitation URL
- [ ] See invitation status (active/used/expired)

### Invitation Flow
- [ ] Receive invitation email
- [ ] Click invitation link
- [ ] Verify token validity
- [ ] Create account with password
- [ ] Auto-sign in after account creation
- [ ] Redirect to onboarding

### Onboarding Flow
- [ ] Complete welcome step
- [ ] Fill personal information
- [ ] Enter aviation credentials
- [ ] Add emergency contact
- [ ] Upload all required documents
- [ ] Acknowledge insurance requirement
- [ ] Sign 1099 contractor agreement
- [ ] Complete Stripe Connect setup
- [ ] Connect calendar (optional)
- [ ] View completion page
- [ ] Redirect to instructor dashboard

### Auto-Save
- [ ] Progress saves automatically
- [ ] Can refresh page without losing data
- [ ] Can log out and resume later
- [ ] Step completion tracked

### Security
- [ ] Non-admin cannot access invitation page
- [ ] Expired tokens are rejected
- [ ] Used tokens cannot be reused
- [ ] Instructor can only view own onboarding
- [ ] Admin can view all onboarding records

## Deployment Steps

1. **Run Database Migration**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: database/instructor-onboarding-schema.sql
   ```

2. **Deploy Code Changes**
   - Push to GitHub (triggers Vercel deployment)
   - Or use MCP GitHub tools to push changes

3. **Configure Stripe Webhooks**
   - Add `account.updated` event handler
   - Verify webhook endpoint is accessible

4. **Test Invitation Flow**
   - Create test invitation as admin
   - Accept invitation in incognito window
   - Complete onboarding process

5. **Update Middleware**
   - Add instructor onboarding redirect logic
   - Test with new instructor account

## Future Enhancements

1. **Admin Approval Workflow**
   - Admin reviews completed onboarding
   - Approve/reject with notes
   - Email notifications

2. **Document Verification**
   - Admin can mark documents as verified
   - Request re-upload if needed
   - Expiration date tracking and reminders

3. **Onboarding Analytics**
   - Track completion rates
   - Identify drop-off points
   - Average completion time

4. **Bulk Invitations**
   - Upload CSV of instructors
   - Send multiple invitations at once
   - Track batch invitation status

5. **Onboarding Reminders**
   - Email reminders for incomplete onboarding
   - Expiration warnings
   - Document expiration alerts

## Support

For questions or issues:
- Check this documentation
- Review error logs in Supabase
- Test with Stripe test mode first
- Verify webhook configuration

