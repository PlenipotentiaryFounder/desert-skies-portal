# Desert Skies Aviation - Complete User Flow Documentation

## Overview
This document outlines the complete user journey from initial signup through onboarding completion, including all database operations, RBAC (Role-Based Access Control) setup, and auto-save functionality.

## 1. User Signup Process

### 1.1 Initial Signup (`/signup`)
**Location**: `app/signup/page.tsx`

**What happens**:
1. User fills out signup form with:
   - Email address
   - Password
   - First name
   - Last name
   - Role selection (student/instructor)

2. **Database Operations**:
   ```sql
   -- Creates user in auth.users table
   INSERT INTO auth.users (
     id, email, encrypted_password, email_confirmed_at, 
     created_at, updated_at
   ) VALUES (
     uuid_generate_v4(), 'user@example.com', 'hashed_password', 
     now(), now(), now()
   );
   ```

3. **Profile Creation** (via `/api/auth/create-profile`):
   ```sql
   -- Creates profile in profiles table
   INSERT INTO profiles (
     id, email, first_name, last_name, 
     created_at, updated_at
   ) VALUES (
     'user_id', 'user@example.com', 'John', 'Doe', 
     now(), now()
   );
   
   -- Assigns role in user_roles table
   INSERT INTO user_roles (
     id, user_id, role_id, created_at
   ) VALUES (
     uuid_generate_v4(), 'user_id', 
     (SELECT id FROM roles WHERE name = 'student'), 
     now()
   );
   
   -- Creates onboarding record in student_onboarding table
   INSERT INTO student_onboarding (
     id, user_id, current_step, step_number, 
     first_name, last_name, created_at, updated_at
   ) VALUES (
     uuid_generate_v4(), 'user_id', 'welcome', 1,
     'John', 'Doe', now(), now()
   );
   ```

### 1.2 Email Confirmation
- User receives confirmation email
- Must click link to verify email address
- `email_confirmed_at` field updated in `auth.users`

## 2. Authentication & Middleware

### 2.1 Middleware Logic (`middleware.ts`)
**Checks on every request**:
1. **Authentication**: Validates JWT token
2. **Role Verification**: Checks `user_roles` table
3. **Onboarding Status**: Checks `student_onboarding.completed_at`
4. **Routing Logic**:
   - If not authenticated → `/login`
   - If authenticated but no role → `/signup`
   - If student but onboarding incomplete → `/student/onboarding`
   - If student and onboarding complete → `/student/dashboard`
   - If instructor → `/instructor/dashboard`

### 2.2 Profile Creation (`/api/auth/create-profile`)
**Location**: `app/api/auth/create-profile/route.ts`

**What happens**:
1. **Creates profile record** in `profiles` table with basic user information
2. **Assigns user role** in `user_roles` table (student/instructor)
3. **Creates onboarding record** in `student_onboarding` table for students
4. **Redirects to appropriate dashboard** based on role

**Database Operations**:
```sql
-- Creates profile in profiles table
INSERT INTO profiles (
  id, email, first_name, last_name, role, 
  created_at, updated_at
) VALUES (
  user_id, email, first_name, last_name, role,
  NOW(), NOW()
)

-- Assigns role in user_roles table
INSERT INTO user_roles (user_id, role_id) VALUES (
  user_id, 
  (SELECT id FROM roles WHERE name = 'student' OR name = 'instructor')
)

-- Creates onboarding record for students
INSERT INTO student_onboarding (
  user_id, first_name, last_name, step_number, 
  created_at, updated_at
) VALUES (
  user_id, first_name, last_name, 1, NOW(), NOW()
)
```

**Auto-save**: None - this is a one-time setup process

## 3. Onboarding Flow

### 3.1 Welcome Step (`welcome`)
**Location**: `components/student/onboarding/steps/welcome-step.tsx`

**Auto-save triggers**:
- On component mount (loads existing data)
- When user clicks "Get Started"

**Database updates**:
```sql
UPDATE student_onboarding SET
  current_step = 'welcome',
  step_number = 1,
  welcome_completed = true,
  updated_at = now()
WHERE user_id = 'user_id';
```

### 3.1 Personal Information Step
**Location**: `components/student/onboarding/steps/personal-info-step.tsx`

**What happens**:
1. User fills out personal information form
2. **Auto-saves to `student_onboarding` table** with debounced saving (500ms delay)
3. **Updates `profiles` table** with first_name, last_name, phone_number, date_of_birth, and address fields
4. Progress is tracked in the UI with green completion indicators

**Database Operations**:
```sql
-- Updates student_onboarding table
UPSERT INTO student_onboarding (
  user_id, first_name, last_name, phone_number, 
  date_of_birth, address_line1, address_line2, 
  city, state, zip_code, country, step_number,
  updated_at
) VALUES (
  user_id, first_name, last_name, phone_number,
  date_of_birth, address_line1, address_line2,
  city, state, zip_code, country, 2, NOW()
)

-- Updates profiles table
UPDATE profiles SET
  first_name = ?, last_name = ?, phone_number = ?,
  date_of_birth = ?, address_line1 = ?, address_line2 = ?,
  city = ?, state = ?, zip_code = ?, country = ?,
  updated_at = NOW()
WHERE id = user_id
```

**Auto-save**: 500ms debounced saving after user input changes

### 3.3 Document Upload Step (`document-upload`)
**Location**: `components/student/onboarding/steps/document-upload-step.tsx`

**Documents required**:
- Medical certificate
- Student pilot certificate
- Government ID

**Auto-save triggers**:
- After each document upload
- When user clicks "Save & Continue"

**Database updates**:
```sql
UPDATE student_onboarding SET
  medical_certificate_uploaded = true,
  student_pilot_certificate_uploaded = true,
  government_id_uploaded = true,
  uploaded_documents = '[{"name": "medical.pdf", "url": "..."}]',
  current_step = 'document-upload',
  step_number = 3,
  document_upload_completed = true,
  updated_at = now()
WHERE user_id = 'user_id';
```

### 3.4 Program Selection Step (`program-selection`)
**Location**: `components/student/onboarding/steps/program-selection-step.tsx`

**Data collected**:
- Desired program (PPL, IR, CPL, etc.)
- Pilot certificate type
- Medical certificate class
- TSA citizenship status

**Auto-save triggers**:
- On selection changes
- When user clicks "Save & Continue"

**Database updates**:
```sql
UPDATE student_onboarding SET
  desired_program = 'private_pilot',
  pilot_certificate_type = 'student',
  medical_certificate_class = 'class_3',
  tsa_citizenship_status = 'us_citizen',
  current_step = 'program-selection',
  step_number = 4,
  updated_at = now()
WHERE user_id = 'user_id';
```

### 3.8 Completion Step (`completion`)
**Location**: `components/student/onboarding/steps/completion-step.tsx`

**What happens**:
1. Displays congratulatory message with user's first name
2. **Sets `completed_at` timestamp** in `student_onboarding` table
3. **Updates `profiles` table** with all onboarding data (first_name, last_name, address, etc.)
4. Redirects to student dashboard

**Database Operations**:
```sql
-- Marks onboarding as completed
UPDATE student_onboarding SET
  completed_at = NOW(),
  updated_at = NOW()
WHERE user_id = 'user_id';

-- Final profile update with all onboarding data
UPDATE profiles SET
  first_name = ?, last_name = ?, phone_number = ?,
  date_of_birth = ?, address_line1 = ?, address_line2 = ?,
  city = ?, state = ?, zip_code = ?, country = ?,
  updated_at = NOW()
WHERE id = user_id
```

**Auto-save**: None - triggered by user clicking "Finish Onboarding"

## 4. Auto-Save Mechanism

### 4.1 Debouncing Implementation
**Location**: `components/student/onboarding/onboarding-flow.tsx`

**Features**:
- 1-second debounce to prevent rapid calls
- 500ms delay before actual save
- Automatic cleanup on component unmount

**Code structure**:
```typescript
const [lastSaveTime, setLastSaveTime] = useState(0)
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

const saveProgress = async (stepId: string, data: any, isComplete: boolean = false) => {
  const now = Date.now()
  if (now - lastSaveTime < 1000) {
    console.log('🔄 Debouncing saveProgress call')
    return
  }
  
  // ... save logic with setTimeout
}
```

### 4.2 Progress Persistence
**Data stored**:
- Current step and step number
- All form data for each step
- Completion status for each step
- Timestamps for tracking

**Recovery mechanism**:
- On component mount, loads existing data
- Restores user to last completed step
- Prevents data loss on refresh/logout

## 5. Database Schema Updates

### 5.1 Recent Changes
**Added columns to `student_onboarding`**:
```sql
ALTER TABLE student_onboarding 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;
```

**Fixed column references**:
- Changed `onboarding_completed_at` to `completed_at`
- Removed non-existent `onboarding_completed` field

### 5.2 Key Tables
**`student_onboarding`**:
- `user_id` (UUID, unique)
- `current_step` (TEXT)
- `step_number` (INTEGER, NOT NULL)
- `first_name`, `last_name` (TEXT)
- `full_name` (TEXT, legacy)
- `address`, `date_of_birth`, `phone_number` (TEXT/DATE)
- `emergency_contact_*` fields
- `*_uploaded` boolean flags
- `uploaded_documents` (JSONB)
- `*_completed` boolean flags
- `completed_steps` (JSONB)
- `completed_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**`profiles`**:
- `id` (UUID, references auth.users)
- `email` (TEXT, unique)
- `first_name`, `last_name` (TEXT)
- `phone_number`, `date_of_birth` (TEXT/DATE)
- `address`, `city`, `state`, `zip_code` (TEXT)
- `status` (TEXT, default 'active')
- `created_at`, `updated_at` (TIMESTAMPTZ)

**`user_roles`**:
- `id` (UUID)
- `user_id` (UUID, references auth.users)
- `role_id` (UUID, references roles)
- `created_at` (TIMESTAMPTZ)

## 6. Error Handling

### 6.1 Common Issues
**Database constraint violations**:
- Missing `step_number` (NOT NULL constraint)
- Invalid column references
- Foreign key violations

**Network issues**:
- Retry mechanism for failed saves
- Offline state handling
- User feedback for errors

### 6.2 Debugging
**Console logging**:
- Save progress attempts
- Database responses
- Error details
- Debouncing events

## 7. Security Considerations

### 7.1 Row Level Security (RLS)
**Policies implemented**:
- Users can only access their own data
- Instructors can access assigned student data
- Admins have full access

### 7.2 Data Validation
**Client-side**:
- Form validation before submission
- File type and size checks
- Required field validation

**Server-side**:
- Database constraints
- API route validation
- Authentication checks

## 8. Performance Optimizations

### 8.1 Caching
- Next.js cache clearing on schema changes
- Supabase client caching
- Component state management

### 8.2 Database Queries
- Efficient joins for dashboard data
- Indexed foreign keys
- Optimized select statements

## 9. Testing Scenarios

### 9.1 User Journey Tests
1. **Complete signup** → Verify all tables populated
2. **Partial onboarding** → Verify progress saved
3. **Refresh page** → Verify state restored
4. **Logout/login** → Verify redirects correctly
5. **Complete onboarding** → Verify enrollment created

### 9.2 Error Scenarios
1. **Network failure** → Verify error handling
2. **Invalid data** → Verify validation
3. **Database errors** → Verify user feedback
4. **Concurrent saves** → Verify debouncing

## 10. Monitoring & Analytics

### 10.1 Key Metrics
- Onboarding completion rate
- Step abandonment points
- Save operation success rate
- Error frequency by step

### 10.2 Logging
- User actions tracked
- Error events logged
- Performance metrics collected
- Security events monitored

This documentation provides a comprehensive overview of the user flow from signup through onboarding completion, ensuring all team members understand the system's behavior and can effectively maintain and extend it. 