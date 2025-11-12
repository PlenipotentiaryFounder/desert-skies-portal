# 🛩️ Discovery Flight System - Complete Documentation

## Overview

The Discovery Flight System is a comprehensive, mobile-optimized onboarding workflow designed to convert discovery flight customers into full students with minimal friction. The entire onboarding process takes approximately **30 seconds** and includes payment processing, document collection, liability waivers, and automated follow-ups.

---

## 🎯 Key Features

### ✅ **Lightning-Fast Onboarding (30 seconds)**
- Mobile-optimized, progressive web app experience
- 4-step process: Personal Info → ID Upload → Waiver → Payment
- Auto-save and resume capability
- Real-time progress tracking

### 💳 **Dual Payment Support**
- **Stripe Integration**: Full payment processing with customer creation
- **Groupon Integration**: Code validation and redemption tracking
- Automatic payment status tracking
- Webhook support for payment confirmation

### 📧 **Automated Email Workflows**
- **Confirmation Email**: Sent immediately after signup
- **24-Hour Reminder**: Sent day before flight
- **1-Hour Reminder**: Sent hour before flight
- **Follow-Up Emails**: Immediate, 3-day, and 7-day follow-ups
- **Conversion Offers**: Targeted emails for student enrollment

### 👨‍✈️ **Admin/Instructor Dashboard**
- View all discovery flights by status
- Assign instructors to flights
- Schedule flights with calendar integration
- Track conversion metrics
- One-click student conversion

### 🔄 **CRM Integration**
- **Outlook People API**: Automatic contact sync
- **Apple Contacts**: CardDAV integration (configurable)
- Bi-directional sync on updates
- Custom notes and metadata

### 📊 **Analytics & Tracking**
- Conversion rate tracking
- Booking source attribution (website, Groupon, Cal.com, referral)
- UTM parameter capture
- Activity logging for all actions

---

## 🏗️ System Architecture

### Database Schema

#### **`discovery_flights` Table**
Primary table storing all discovery flight customer information:

```sql
- id (UUID)
- email, first_name, last_name, phone
- booking_source (website, groupon, cal_com, referral, other)
- payment_status (pending, paid, groupon_verified, refunded, failed)
- onboarding_status (pending, in_progress, completed, expired)
- flight_status (not_scheduled, scheduled, completed, cancelled, no_show, rescheduled)
- stripe_customer_id, stripe_payment_intent_id
- groupon_code, groupon_verified
- steps_completed (JSONB: personal_info, id_upload, liability_waiver, payment)
- id_document_path, waiver_signature_data
- scheduled_date, scheduled_time, scheduled_instructor_id, scheduled_aircraft_id
- converted_to_student, student_profile_id
- outlook_contact_id, apple_contact_id
- Email tracking flags (confirmation_sent, reminder_sent, follow_up_sent)
```

#### **`groupon_codes` Table**
Tracks Groupon voucher codes:

```sql
- id (UUID)
- code (TEXT, UNIQUE)
- status (active, redeemed, expired, invalid, refunded)
- redeemed_by_discovery_flight_id
- valid_from, valid_until
- value_cents
```

#### **`discovery_flight_activity_log` Table**
Comprehensive audit trail:

```sql
- id (UUID)
- discovery_flight_id
- activity_type (created, onboarding_started, payment_received, etc.)
- activity_description
- activity_metadata (JSONB)
- performed_by, performed_by_role
```

#### **`discovery_flight_email_queue` Table**
Email scheduling and tracking:

```sql
- id (UUID)
- discovery_flight_id
- email_type (confirmation, reminder_24h, reminder_1h, follow_up_*, etc.)
- status (pending, sending, sent, failed, cancelled)
- scheduled_send_at
- sent_at, opened_at, clicked_at
- attempt_count, max_attempts
```

---

## 🚀 User Workflows

### **Customer Journey**

1. **Booking**
   - Customer books via website, Groupon, or Cal.com
   - Receives unique onboarding link: `/discovery/{base64_email}`
   
2. **Onboarding** (30 seconds)
   - **Step 1**: Enter name, phone, special requests
   - **Step 2**: Upload driver's license/passport photo
   - **Step 3**: Read and sign liability waiver (canvas signature)
   - **Step 4**: Pay via Stripe OR enter Groupon code
   
3. **Confirmation**
   - Receives confirmation email immediately
   - Sees success page with next steps
   
4. **Scheduling**
   - Admin/instructor schedules flight
   - Customer receives schedule confirmation
   - Automated reminders (24h and 1h before)
   
5. **Flight Day**
   - Customer arrives and flies!
   - Instructor completes mission
   
6. **Follow-Up**
   - Immediate follow-up email
   - 3-day and 7-day nurture emails
   - Conversion offers to become full student

### **Admin/Instructor Workflow**

1. **Dashboard View**
   - See all discovery flights by status
   - Filter by onboarding, ready, scheduled, completed
   - View conversion metrics
   
2. **Assignment**
   - Assign instructor to flight
   - Select aircraft
   - Set date and time
   
3. **Scheduling**
   - Pick date/time from calendar
   - Automated email notifications sent
   - Reminders scheduled automatically
   
4. **Flight Completion**
   - Mark flight as completed
   - Add notes and feedback
   
5. **Conversion**
   - One-click convert to student
   - Creates user account automatically
   - Enrolls in selected syllabus
   - Transfers all data (waiver, ID, etc.)

---

## 🔌 API Endpoints

### **Public Onboarding APIs**

#### `POST /api/discovery/onboarding`
Create or update discovery flight during onboarding.

**Request:**
```json
{
  "action": "create_or_update",
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "(555) 123-4567",
  "special_requests": "Morning flight preferred",
  "booking_source": "website",
  "groupon_code": "ABC123"
}
```

**Response:**
```json
{
  "discovery_flight": { /* full discovery flight object */ }
}
```

#### `POST /api/discovery/upload-id`
Upload government-issued ID photo.

**Request:** FormData with `file` and `discovery_flight_id`

**Response:**
```json
{
  "discovery_flight": { /* updated object */ },
  "file_path": "discovery-flights/{id}/{filename}"
}
```

#### `POST /api/discovery/sign-waiver`
Submit electronic signature for liability waiver.

**Request:**
```json
{
  "discovery_flight_id": "uuid",
  "signature_name": "John Doe",
  "signature_data": "data:image/png;base64,..."
}
```

#### `POST /api/discovery/verify-groupon`
Verify and redeem Groupon code.

**Request:**
```json
{
  "discovery_flight_id": "uuid",
  "groupon_code": "ABC123"
}
```

#### `POST /api/discovery/create-payment-intent`
Create Stripe checkout session.

**Request:**
```json
{
  "discovery_flight_id": "uuid"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_..."
}
```

### **Admin APIs**

#### `POST /api/admin/discovery-flights/schedule`
Schedule a discovery flight.

**Request:**
```json
{
  "discovery_flight_id": "uuid",
  "scheduled_date": "2025-01-30",
  "scheduled_time": "10:00",
  "scheduled_instructor_id": "uuid",
  "scheduled_aircraft_id": "uuid"
}
```

#### `POST /api/admin/discovery-flights/assign-instructor`
Assign instructor to flight.

**Request:**
```json
{
  "discovery_flight_id": "uuid",
  "instructor_id": "uuid"
}
```

#### `POST /api/admin/discovery-flights/convert-to-student`
Convert discovery flight customer to full student.

**Request:**
```json
{
  "discovery_flight_id": "uuid",
  "syllabus_id": "uuid" // optional
}
```

**Response:**
```json
{
  "discovery_flight": { /* updated object */ },
  "student_profile_id": "uuid"
}
```

### **Webhook Endpoints**

#### `POST /api/discovery/webhook/stripe`
Stripe webhook handler for payment events.

**Events Handled:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### **Cron Jobs**

#### `GET /api/cron/process-email-queue`
Process pending emails in queue.

**Authorization:** Bearer token via `CRON_SECRET`

**Recommended Schedule:** Every 5 minutes

---

## 📧 Email Templates

### **Confirmation Email**
- **Subject:** "Welcome to Desert Skies Aviation, {first_name}!"
- **Content:** Welcome message, what to expect, next steps
- **Sent:** Immediately after onboarding completion

### **24-Hour Reminder**
- **Subject:** "Reminder: Your Discovery Flight is Tomorrow!"
- **Content:** Flight details, what to bring, arrival instructions
- **Sent:** 24 hours before scheduled flight

### **1-Hour Reminder**
- **Subject:** "Reminder: Your Discovery Flight is in 1 Hour!"
- **Content:** Last-minute reminders, contact info
- **Sent:** 1 hour before scheduled flight

### **Follow-Up Email**
- **Subject:** "How Was Your Discovery Flight, {first_name}?"
- **Content:** Feedback request, conversion offer, program details
- **Sent:** After flight completion (immediate, 3-day, 7-day variants)

---

## 🔐 Security & Compliance

### **Data Protection**
- All PII encrypted at rest
- Secure file storage in Supabase Storage
- Row-level security (RLS) policies enforced
- HTTPS-only communication

### **Payment Security**
- PCI-compliant via Stripe
- No credit card data stored locally
- Webhook signature verification
- Idempotent payment processing

### **TSA Compliance**
- Government ID collection and verification
- Secure document storage
- Admin verification workflow
- Audit trail for all ID verifications

### **Legal Compliance**
- Electronic signature capture with metadata
- IP address and timestamp logging
- Full waiver text storage
- Legally binding digital signatures

---

## 🛠️ Setup & Configuration

### **Environment Variables**

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...

# Cron Jobs
CRON_SECRET=your_secure_random_string

# CRM (Optional)
OUTLOOK_ACCESS_TOKEN=...
APPLE_CARDDAV_USERNAME=...
APPLE_CARDDAV_PASSWORD=...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **Database Migration**

Run the discovery flight schema:

```bash
# Via Supabase CLI
supabase db push database/discovery-flights-schema.sql

# Or via SQL editor in Supabase Dashboard
```

### **Stripe Webhook Setup**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/discovery/webhook/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### **Cron Job Setup (Vercel)**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-email-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### **Email Setup (Resend)**

1. Sign up at resend.com
2. Verify your domain
3. Get API key
4. Add to `RESEND_API_KEY`

---

## 📱 Mobile Optimization

### **Design Principles**
- Touch-friendly UI (48px minimum touch targets)
- Large, clear buttons
- Progressive disclosure (one step at a time)
- Minimal typing required
- Camera integration for ID upload
- Canvas signature pad optimized for touch

### **Performance**
- Lazy loading of components
- Optimized images
- Minimal JavaScript bundle
- Fast page loads (<2s)

### **Accessibility**
- WCAG 2.1 AA compliant
- Screen reader friendly
- Keyboard navigation
- High contrast mode support

---

## 📊 Analytics & Metrics

### **Key Metrics Tracked**

1. **Conversion Funnel**
   - Onboarding started
   - Each step completed
   - Payment completed
   - Flight scheduled
   - Flight completed
   - Converted to student

2. **Booking Sources**
   - Website direct
   - Groupon
   - Cal.com
   - Referral
   - UTM parameters

3. **Time Metrics**
   - Onboarding completion time
   - Time to schedule
   - Time to conversion

4. **Email Performance**
   - Open rates
   - Click rates
   - Bounce rates

### **Dashboard Stats**

- Total bookings
- Pending onboarding
- Ready to schedule
- Scheduled flights
- Completed flights
- Converted students
- **Conversion rate** (converted / completed)

---

## 🎨 Customization

### **Branding**
- Update colors in Tailwind config
- Replace logo in email templates
- Customize waiver text
- Update company information

### **Pricing**
- Modify amount in `create-payment-intent` API
- Update display price in onboarding flow
- Configure Groupon code values

### **Workflows**
- Add/remove onboarding steps
- Customize email templates
- Modify reminder schedules
- Add custom fields

---

## 🐛 Troubleshooting

### **Common Issues**

**Emails not sending**
- Check `RESEND_API_KEY` is set
- Verify domain in Resend
- Check email queue: `SELECT * FROM discovery_flight_email_queue WHERE status = 'failed'`

**Stripe payments failing**
- Verify webhook secret
- Check Stripe dashboard for errors
- Ensure test mode keys for development

**ID upload not working**
- Check Supabase Storage bucket permissions
- Verify file size limits
- Check browser console for errors

**Groupon codes not validating**
- Ensure code exists in `groupon_codes` table
- Check `status` is 'active'
- Verify `valid_until` date

---

## 🚀 Future Enhancements

### **Planned Features**
- [ ] SMS notifications via Twilio
- [ ] Video onboarding walkthrough
- [ ] Multi-language support
- [ ] Gift certificate system
- [ ] Referral program tracking
- [ ] Advanced scheduling with instructor availability
- [ ] Weather integration for automatic rescheduling
- [ ] Customer portal for flight history
- [ ] Mobile app (React Native)

---

## 📞 Support

For questions or issues:
- **Email:** thomas@desertskiesaviationaz.com
- **Documentation:** This file
- **Database Schema:** `database/discovery-flights-schema.sql`
- **Service Layer:** `lib/discovery-flight-service.ts`

---

## 📄 License

Proprietary - Desert Skies Aviation Training LLC

---

**Built with ❤️ by Desert Skies Aviation**


