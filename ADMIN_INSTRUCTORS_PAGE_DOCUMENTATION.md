# Admin Instructors Page - Comprehensive Documentation

## Overview
The Admin Instructors Page provides a centralized management interface for all flight instructors in the Desert Skies Aviation platform. It allows administrators to view, manage, approve, and monitor instructor activities, certifications, students, and financial information.

## Features

### 1. **Comprehensive Instructor Dashboard**
- Real-time statistics on all instructors
- CFI, CFII, and MEI certification tracking
- Student count and distribution
- Average billing rates overview

### 2. **Pending Approvals System**
- **Notification Card**: Prominently displays instructors awaiting approval
- **Quick Actions**: Approve or reject directly from the card
- **Visual Indicators**: Yellow alert styling for pending items
- **Batch Workflow**: Process multiple approvals efficiently

### 3. **Advanced Filtering**
- **Search**: By name or email
- **Certification Filter**: CFI, CFII, MEI, or all
- **Status Filter**: Active, Pending, Inactive, or all
- **Real-time Updates**: Filters apply instantly

### 4. **Instructor Table View**
Displays comprehensive information at a glance:
- Instructor profile and contact info
- Certifications (CFI, CFII, MEI badges)
- Active student count
- Payout rates
- Total experience (flight hours)
- Status indicators

### 5. **Detailed Instructor Modal**
Multi-tab interface with complete instructor information:

#### Overview Tab
- Contact information (email, phone, address)
- Experience metrics (flight hours, instruction hours)
- Onboarding status
- Stripe Connect payment status

#### Certifications Tab
- CFI details with expiration tracking
- CFII status and expiration
- MEI status and expiration
- Pilot certificate information
- Medical certificate tracking
- **Color-coded expiration warnings** (valid, expiring soon, expired)

#### Students Tab
- Total student count
- Active student count
- Recent students list with contact info
- Visual student distribution

#### Rates Tab
- Flight instruction payout rate
- Ground instruction payout rate
- Average student billing rate
- Rate comparison metrics

#### Activity Tab
- Total missions completed
- Flight hours taught
- Last flight date
- Activity trends

### 6. **Quick Actions**
From any instructor row:
- View detailed profile
- Send email directly
- Make phone calls
- Access student management

## Technical Architecture

### Service Layer: `lib/admin-instructor-service.ts`
Comprehensive data fetching and management:

```typescript
export interface AdminInstructorData {
  // Profile information
  id: string
  email: string
  first_name: string
  last_name: string
  // ... contact details
  
  // Certifications with expiration tracking
  certifications: {
    cfi: boolean
    cfi_number: string | null
    cfi_expiration: string | null
    cfii: boolean
    cfii_expiration: string | null
    mei: boolean
    mei_expiration: string | null
    // ... medical and pilot certificates
  }
  
  // Experience metrics
  experience: {
    total_flight_hours: number
    total_instruction_hours: number
  }
  
  // Financial information
  rates: {
    flight_instruction_payout: number // in cents
    ground_instruction_payout: number
    average_student_rate: number
  }
  
  // Student relationships
  students: {
    total_count: number
    active_count: number
    recent_students: Array<StudentInfo>
  }
  
  // Onboarding and approval
  onboarding: {
    completed: boolean
    admin_approved: boolean
    admin_approved_at: string | null
    completed_at: string | null
  }
  
  // Activity tracking
  recent_activity: {
    last_flight_date: string | null
    total_missions: number
    total_flight_hours_taught: number
  }
  
  // Stripe integration
  stripe_connect: {
    account_id: string | null
    onboarding_complete: boolean
    charges_enabled: boolean
    payouts_enabled: boolean
  }
}
```

### Key Functions

#### `getAdminInstructors()`
- **Cached** to prevent duplicate fetches
- Fetches all profiles and filters by instructor role using RPC
- Parallel data loading for optimal performance
- Comprehensive data aggregation from multiple tables

#### `approveInstructor(instructorId, adminId)`
- Updates profile status to active
- Records approval in instructor_onboarding table
- Creates notification for instructor
- Returns success status

#### `rejectInstructor(instructorId, reason?)`
- Updates profile status to inactive
- Records rejection reason in admin_notes
- Creates notification for instructor
- Provides feedback mechanism

### Component Structure

```
app/admin/instructors/
├── page.tsx                          # Server component (data fetching)
├── instructors-page-client.tsx       # Main client component
├── pending-approvals-card.tsx        # Approval workflow UI
└── instructor-details-modal.tsx      # Detailed view modal
```

## Database Tables Used

### Primary Tables
1. **profiles** - Core instructor information
2. **instructor_onboarding** - Certifications, experience, approval status
3. **instructor_payout_rates** - Compensation rates
4. **student_instructor_rates** - Student billing rates
5. **student_enrollments** - Student-instructor relationships
6. **missions** - Flight activity tracking
7. **user_roles** - Role-based access control

### Relationships
- Instructor → Students (via student_enrollments)
- Instructor → Missions (via assigned_instructor_id)
- Instructor → Payout Rates (via instructor_payout_rates)
- Instructor → Student Rates (via student_instructor_rates)

## Statistics Dashboard

### Real-time Metrics
1. **Total Instructors**: Count with active/pending breakdown
2. **Certifications**: CFI, CFII, MEI counts
3. **Total Students**: Sum of all active students across instructors
4. **Average Rate**: Mean student billing rate

## Approval Workflow

### Process Flow
1. **Instructor Completes Onboarding**
   - Fills out personal information
   - Uploads required documents
   - Provides certification details
   - Signs contractor agreement
   - Completes Stripe Connect

2. **Pending State**
   - Appears in "Pending Approvals" card
   - Yellow warning indicator
   - Visible in main table with "Pending Approval" badge

3. **Admin Review**
   - View all onboarding information
   - Check certifications and documents
   - Verify Stripe Connect status
   - Review experience and qualifications

4. **Approval/Rejection**
   - **Approve**: 
     - Status → Active
     - admin_approved → true
     - Sends approval notification
     - Grants full platform access
   
   - **Reject**:
     - Status → Inactive
     - Logs reason in admin_notes
     - Sends rejection notification
     - Can provide feedback for reapplication

## Certification Tracking

### Expiration Monitoring
- **Valid**: > 30 days until expiration (Green badge)
- **Expiring Soon**: < 30 days (Yellow badge)
- **Expired**: Past expiration date (Red badge)

### Tracked Certifications
1. **CFI** (Certified Flight Instructor)
   - Certificate number
   - Expiration date
   - Renewal tracking

2. **CFII** (Instrument Rating)
   - Expiration date
   - Status indicator

3. **MEI** (Multi-Engine Instructor)
   - Expiration date
   - Status indicator

4. **Medical Certificate**
   - Class (First, Second, Third)
   - Expiration date
   - Status tracking

5. **Pilot Certificate**
   - Type (ATP, Commercial, etc.)
   - Number tracking

## Financial Information

### Instructor Payout Rates
- **Flight Instruction**: Amount instructor receives per flight hour (in cents)
- **Ground Instruction**: Amount instructor receives per ground hour (in cents)
- **Stored in cents** for precision
- **Active rate tracking** with effective dates

### Student Billing Rates
- **Average Rate**: Mean of all student rates for this instructor
- **Individual Rates**: Per-student custom rates
- **Rate History**: Track rate changes over time

### Stripe Connect Integration
- **Onboarding Status**: Track completion
- **Charges Enabled**: Can receive payments
- **Payouts Enabled**: Can withdraw funds
- **Account ID**: Stripe Connect account reference

## Student Management

### Student Metrics
- **Total Count**: All students ever enrolled
- **Active Count**: Currently active enrollments
- **Recent Students**: Last 5 enrolled students

### Student Information Display
- Full name and email
- Enrollment status
- Quick access to student profile

## Activity Tracking

### Metrics
1. **Total Missions**: Count of completed flight sessions
2. **Flight Hours Taught**: Sum of actual flight time taught
3. **Last Flight Date**: Most recent flight session
4. **Activity Trends**: Historical performance

## User Actions

### From Table Row
- **View Details**: Open comprehensive modal
- **Send Email**: mailto: link to instructor
- **Call**: tel: link if phone provided
- **Quick Actions**: Contextual menu

### From Pending Approvals
- **Approve**: Single-click approval
- **Reject**: Single-click rejection with optional reason
- **Batch Processing**: Handle multiple approvals

### From Details Modal
- **Contact**: Direct email link
- **Review**: Browse all tabs for comprehensive info
- **Export**: (Future) Generate instructor report

## Data Flow

### On Page Load
1. Server component fetches instructor data
2. `getAdminInstructors()` called (cached)
3. Parallel queries to multiple tables
4. Data aggregation and transformation
5. Props passed to client component

### Client-Side Filtering
1. User inputs search or selects filter
2. `useMemo` recalculates filtered list
3. UI updates instantly
4. Statistics recalculate

### Modal Interaction
1. User clicks "View Details"
2. Selected instructor data passed to modal
3. Modal renders with complete information
4. Tabs allow navigation through sections

## Performance Optimizations

### Caching
- **React cache()**: Prevents duplicate fetches
- **Request deduplication**: Single render cycle
- **Memoized calculations**: Statistics and filters

### Parallel Data Loading
- Multiple database queries run concurrently
- Promise.all for batch operations
- Optimized query structure

### Efficient Rendering
- Client component for interactivity
- Server component for data fetching
- Lazy loading of modal content

## Security Considerations

### Role-Based Access
- **Admin Only**: Entire page requires admin role
- **Middleware Protection**: Route-level security
- **RPC Functions**: Database-level security

### Data Privacy
- Sensitive data properly scoped
- Approval actions logged
- Audit trail maintained

## Future Enhancements

### Planned Features
1. **Bulk Actions**: Approve/reject multiple instructors
2. **Advanced Analytics**: Performance dashboards
3. **Communication Tools**: In-app messaging
4. **Document Viewer**: Inline document review
5. **Rating System**: Student feedback integration
6. **Scheduling Integration**: View instructor availability
7. **Export Reports**: PDF/CSV generation

### Suggested Improvements
1. **Real-time Updates**: WebSocket for live data
2. **Advanced Filters**: More granular filtering options
3. **Saved Views**: Custom filter presets
4. **Calendar View**: Visual schedule representation
5. **Mobile Optimization**: Responsive improvements

## Integration Points

### Related Pages
- `/admin/students` - Student management (cross-reference)
- `/admin/schedule` - Flight scheduling
- `/admin/billing` - Financial management
- `/admin/reports` - Analytics and reporting

### External Services
- **Supabase**: Database and authentication
- **Stripe Connect**: Payment processing
- **Email Service**: Notification delivery

## Testing Checklist

### Functional Testing
- [ ] Page loads with correct data
- [ ] Filters work correctly
- [ ] Search functions properly
- [ ] Modal opens and displays data
- [ ] Approval workflow functions
- [ ] Rejection workflow functions
- [ ] Statistics calculate correctly
- [ ] No duplicate fetches (check logs)

### Edge Cases
- [ ] No instructors in system
- [ ] No pending approvals
- [ ] Instructor with no certifications
- [ ] Instructor with no students
- [ ] Expired certifications display correctly
- [ ] Missing optional data handled gracefully

### Performance
- [ ] Page loads in < 2 seconds
- [ ] Filters respond instantly
- [ ] Modal opens quickly
- [ ] No console errors
- [ ] Proper cache utilization

## Maintenance Notes

### Regular Tasks
1. **Monitor Certification Expirations**: Weekly review
2. **Audit Approval Times**: Monthly metrics
3. **Review Inactive Instructors**: Quarterly cleanup
4. **Update Payout Rates**: As needed
5. **Verify Stripe Integration**: Monthly checks

### Database Maintenance
- Index optimization on frequently queried fields
- Archive old instructor data
- Clean up pending applications > 60 days

## Support and Troubleshooting

### Common Issues

#### "No instructors found"
- Check database for users with instructor role
- Verify role assignment in user_roles table
- Confirm RPC function works correctly

#### Pending approvals not showing
- Check instructor_onboarding.completed_at is set
- Verify admin_approved is false
- Confirm profile status

#### Rates not displaying
- Check instructor_payout_rates table
- Verify is_active = true
- Confirm effective_date is set

### Debug Mode
Enable detailed logging:
```typescript
// In admin-instructor-service.ts
console.log('[getAdminInstructors] Starting fetch...')
// Multiple log points track data flow
```

## Changelog

### Version 1.0.0 (Current)
- Initial implementation
- Complete instructor management
- Approval workflow
- Detailed modal views
- Certification tracking
- Financial information display
- Activity metrics

---

**Last Updated**: November 13, 2025  
**Maintained By**: Desert Skies Aviation Development Team  
**Related Documentation**: 
- INSTRUCTOR_ONBOARDING_WORKFLOW.md
- ADMIN_STUDENTS_PAGE_DOCUMENTATION.md
- Database Schema Documentation

