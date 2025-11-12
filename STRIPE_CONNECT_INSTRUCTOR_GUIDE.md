# 🎯 Stripe Connect for Instructors - Complete Setup Guide

## 🚨 **URGENT: Fix Your Environment Variable Issue**

### **The Problem:**
You're getting `STRIPE_SECRET_KEY not configured` because this environment variable is **missing** from your Vercel deployment.

### **The Confusion:**
- ❌ **`STRIPE_SERVICE_ROLE_KEY`** - This doesn't exist! You may be confusing it with Supabase's `SUPABASE_SERVICE_ROLE_KEY`
- ✅ **`STRIPE_SECRET_KEY`** - This is the **correct** Stripe environment variable

---

## 📝 **STEP 1: Add Missing Environment Variables to Vercel**

### Required Stripe Environment Variables:

```bash
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Or pk_live_... for production
STRIPE_SECRET_KEY=sk_test_...       # Or sk_live_... for production

# Get this from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **How to Add to Vercel:**

1. **Go to Vercel Dashboard**:
   ```
   https://vercel.com/YOUR_TEAM/desertskiesportal/settings/environment-variables
   ```

2. **Add Each Variable**:
   - Name: `STRIPE_SECRET_KEY`
   - Value: `sk_test_...` (from Stripe Dashboard)
   - Environment: **Production, Preview, Development** (check all)
   - Click **Save**

3. **Add All Three Variables** (Publishable, Secret, Webhook)

4. **Redeploy Your Application**:
   ```bash
   # In Vercel Dashboard, go to Deployments
   # Click on the latest deployment
   # Click "Redeploy" button
   ```

---

## ✅ **GOOD NEWS: Stripe Connect is Already Fully Implemented!**

Your codebase already has a complete Stripe Connect implementation for instructors. Here's how it works:

### **Instructor Onboarding Flow (Already Built):**

1. **Invitation Sent** (by admin)
   - Admin invites instructor via `/admin/instructors`
   - Instructor receives email with registration link

2. **Account Creation**
   - Instructor accepts invite and creates account
   - Goes through onboarding steps

3. **Stripe Connect Step** (Step 6 of onboarding)
   - Component: `components/instructor/onboarding/steps/stripe-connect-step.tsx`
   - Instructor clicks "Connect with Stripe"
   - System creates Stripe Express account automatically
   - Instructor completes Stripe onboarding on Stripe's hosted page
   - Returns to Desert Skies with account activated

4. **Automatic Updates via Webhooks**
   - Stripe sends webhooks when account is verified
   - System updates `profiles` table with Connect status
   - Instructor can now receive payments

---

## 🔧 **How Instructors Create Stripe Connect Accounts**

### **Method 1: During Onboarding (Automatic)**

When instructors go through the onboarding flow at:
```
/instructor/onboarding
```

**Step 6: Stripe Connect** appears automatically and:
1. Displays explanation of Stripe Connect
2. Shows "Connect with Stripe" button
3. Creates Express account when clicked
4. Redirects to Stripe's onboarding flow
5. Returns to Desert Skies when complete

### **Method 2: From Settings (Manual - If Skipped During Onboarding)**

Instructors can also set up Stripe Connect from their settings:
```
/instructor/settings?tab=billing
```

---

## 🏗️ **Technical Architecture (Already Implemented)**

### **Key Files:**

1. **Service Layer:**
   - `lib/stripe-connect-service.ts` - Core Stripe Connect logic
     - `createInstructorConnectAccount()` - Creates Express account
     - `getInstructorConnectStatus()` - Checks account status
     - `createInstructorDashboardLink()` - Generates Stripe dashboard access

2. **API Endpoints:**
   - `app/api/instructor/stripe-connect/setup/route.ts` - Initiates Connect setup
   - `app/api/webhooks/stripe/route.ts` - Handles Stripe Connect webhooks

3. **UI Components:**
   - `components/instructor/onboarding/steps/stripe-connect-step.tsx` - Onboarding UI
   - Shows step-by-step instructions
   - Handles button clicks and redirects

4. **Database Schema:**
   - `profiles` table has Stripe Connect fields:
     ```sql
     stripe_connect_account_id
     stripe_connect_onboarding_complete
     stripe_connect_charges_enabled
     stripe_connect_payouts_enabled
     stripe_connect_requirements_pending
     ```

### **Stripe Account Type:**
- **Express Accounts** (not Standard or Custom)
- Pre-built by Stripe, fully compliant
- Instructors are **NOT added as customers**
- They are **payees** (receive money via transfers)

---

## 🎯 **What Happens When an Instructor Gets Paid**

### **Payment Flow:**

1. **Student Pays Desert Skies**
   - Student's card is charged via Stripe
   - Money goes to your **platform account**

2. **Desert Skies Transfers to Instructor**
   - Your system creates a `Transfer` to instructor's Connect account
   - Uses: `lib/stripe-connect-service.ts` → `createInstructorTransfer()`
   - Instructor receives money in their bank account

3. **Webhook Confirmation**
   - Stripe sends `transfer.paid` webhook
   - System marks transaction as completed
   - Instructor sees updated balance in dashboard

---

## 📋 **Checklist: What You Need to Do**

### **Immediate Actions:**

- [ ] **Get Stripe API Keys**
  - Login to [Stripe Dashboard](https://dashboard.stripe.com)
  - Go to: Developers → API Keys
  - Copy `Publishable key` (pk_test_...)
  - Copy `Secret key` (sk_test_...)

- [ ] **Set Up Stripe Connect**
  - In Stripe Dashboard, go to: Connect → Settings
  - Enable Express accounts
  - Set brand colors/logo (optional)

- [ ] **Create Webhook Endpoint**
  - Go to: Developers → Webhooks
  - Add endpoint: `https://desertskiesportal.vercel.app/api/webhooks/stripe`
  - Select events:
    - `payment_intent.succeeded`
    - `payment_intent.payment_failed`
    - `charge.dispute.created`
    - `account.updated` ← **Important for Connect**
    - `transfer.paid` ← **Important for instructor payments**
    - `payout.paid`
    - `payout.failed`
  - Copy the webhook secret (whsec_...)

- [ ] **Add Environment Variables to Vercel**
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

- [ ] **Redeploy Vercel Application**

- [ ] **Test Instructor Onboarding**
  - Create a test instructor via admin panel
  - Go through onboarding as that instructor
  - Verify Stripe Connect step works
  - Check that Connect account is created in Stripe Dashboard

---

## 🧪 **Testing Stripe Connect**

### **Test Mode (Recommended First):**

1. Use `sk_test_...` keys (NOT `sk_live_...`)
2. Create a test instructor
3. Go through onboarding
4. Check Stripe Dashboard → Connect → Accounts
5. You should see the test Express account

### **Production Mode:**

1. Switch to `sk_live_...` keys
2. Update webhook endpoint to use live keys
3. Instructors will create real Connect accounts
4. Real payouts will be made

---

## 🔍 **How to View Instructor Connect Accounts**

### **In Stripe Dashboard:**
1. Go to: **Connect** → **Accounts**
2. You'll see all instructor Express accounts
3. Click on an account to see details
4. View payouts, transfers, and activity

### **In Your Application:**
You already have this data in the `profiles` table:
```sql
SELECT 
  first_name,
  last_name,
  email,
  stripe_connect_account_id,
  stripe_connect_onboarding_complete,
  stripe_connect_charges_enabled,
  stripe_connect_payouts_enabled
FROM profiles
WHERE role = 'instructor'
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "STRIPE_SECRET_KEY not configured"**
**Solution:** Add the environment variable to Vercel (see Step 1 above)

### **Issue 2: "Instructor can't see Stripe Connect step"**
**Solution:** 
- Check that `stripe-connect-step.tsx` is in the onboarding flow
- Verify instructor is going through onboarding, not logged in already
- Check `components/instructor/onboarding/onboarding-flow.tsx` includes the step

### **Issue 3: "Webhook not receiving Connect updates"**
**Solution:**
- Verify webhook URL is correct in Stripe Dashboard
- Check that `account.updated` event is selected
- View webhook logs in Stripe Dashboard for errors

### **Issue 4: "Instructor added as customer instead of Connect account"**
**Solution:** 
- You're already doing this correctly!
- The code creates Express accounts via `createInstructorConnectAccount()`
- Instructors are NOT added to `stripe.customers.create()`

---

## 📞 **Need Help?**

1. **Stripe Documentation:**
   - [Connect Express Accounts](https://stripe.com/docs/connect/express-accounts)
   - [Connect Webhooks](https://stripe.com/docs/connect/webhooks)

2. **Test Your Setup:**
   - Use [Stripe Webhook Testing](https://dashboard.stripe.com/test/webhooks)
   - Use test API keys first

3. **Check Your Logs:**
   - Vercel: View function logs for API errors
   - Stripe: View webhook delivery logs

---

## ✨ **Summary**

**You're 95% done!** Your Stripe Connect implementation is already complete. You just need to:

1. ✅ Add `STRIPE_SECRET_KEY` to Vercel (NOT `STRIPE_SERVICE_ROLE_KEY`)
2. ✅ Create webhook endpoint in Stripe Dashboard
3. ✅ Redeploy your application
4. ✅ Test with a new instructor going through onboarding

**Instructors will NOT be added as customers** - they'll be created as Express Connect accounts and can receive transfers/payouts automatically. 🎉

