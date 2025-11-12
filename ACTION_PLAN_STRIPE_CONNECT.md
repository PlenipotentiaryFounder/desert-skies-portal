# ✅ ACTION PLAN: Fix Stripe Connect & Get Instructors Paid

## 🎯 **Summary of Findings**

### ✅ **GOOD NEWS:**
1. **Stripe Connect is ALREADY FULLY IMPLEMENTED** in your codebase
2. **Instructors are correctly set up as Express Connect accounts** (NOT customers)
3. **All webhooks, APIs, and UI components are in place**
4. **Payment flow is ready to go**

### ❌ **THE ONLY PROBLEM:**
**Missing environment variable:** `STRIPE_SECRET_KEY` is not configured in Vercel

### ✅ **THE SOLUTION:**
Add 3 Stripe environment variables to Vercel (takes 5 minutes)

---

## 🚀 **IMMEDIATE ACTION ITEMS (Do This Now)**

### **Action 1: Get Stripe Keys (2 minutes)**

1. Open: https://dashboard.stripe.com/test/apikeys
2. Copy TWO keys:
   - **Publishable key**: starts with `pk_test_...`
   - **Secret key**: starts with `sk_test_...` (click "Reveal test key")

### **Action 2: Create Stripe Webhook (2 minutes)**

1. Open: https://dashboard.stripe.com/test/webhooks
2. Click: **+ Add endpoint**
3. **Endpoint URL**: `https://desertskiesportal.vercel.app/api/webhooks/stripe`
4. **Description**: "Desert Skies - Payment & Connect Webhooks"
5. **Events to send**: Click "Select events" and choose:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `account.updated` ← **CRITICAL for Connect**
   - ✅ `transfer.paid` ← **CRITICAL for instructor payments**
   - ✅ `transfer.failed`
   - ✅ `charge.dispute.created`
   - ✅ `payout.paid`
   - ✅ `payout.failed`
6. Click: **Add endpoint**
7. **Copy the Webhook signing secret**: starts with `whsec_...`

### **Action 3: Add to Vercel (2 minutes)**

1. Open: https://vercel.com/YOUR_TEAM/desertskiesportal/settings/environment-variables
2. Add THREE environment variables:

| Variable Name | Value | Environments |
|---------------|-------|--------------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | ✅ Production, ✅ Preview, ✅ Development |
| `STRIPE_SECRET_KEY` | `sk_test_...` | ✅ Production, ✅ Preview, ✅ Development |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ✅ Production, ✅ Preview, ✅ Development |

3. Click **Save** after each one

### **Action 4: Redeploy Vercel (1 minute)**

1. Go to: https://vercel.com/YOUR_TEAM/desertskiesportal/deployments
2. Click on the **latest deployment**
3. Click **⋯** (three dots) → **Redeploy**
4. Wait ~2 minutes for completion

### **Action 5: Test Instructor Onboarding (5 minutes)**

1. **Create a Test Instructor:**
   - Login as admin
   - Go to: `/admin/instructors`
   - Click "Invite Instructor"
   - Use your personal email (e.g., `yourname+testinstructor@gmail.com`)
   - Send invitation

2. **Accept Invitation:**
   - Check your email
   - Click the invitation link
   - Create password
   - Complete onboarding steps

3. **Verify Stripe Connect (Step 8):**
   - When you reach "Payment Setup" step
   - Click "Connect with Stripe"
   - You'll be redirected to Stripe's onboarding
   - Complete the test Express account setup
   - Return to Desert Skies
   - **✅ SUCCESS** if no errors!

4. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/connect/accounts
   - You should see the test Express account

---

## 📊 **How Instructor Payments Work**

### **For Future Reference:**

```
1. Student pays you (Desert Skies) → Money enters YOUR Stripe account
                                      
2. You transfer to instructor → Your system creates a Stripe Transfer
                                
3. Instructor receives funds → Money arrives in their bank account
                               
4. Webhook confirms → System marks transaction as "paid"
```

### **Where to View Instructor Accounts:**

**In Stripe Dashboard:**
- Connect → Accounts → View all Express accounts

**In Your Database:**
```sql
SELECT 
  email,
  first_name || ' ' || last_name as name,
  stripe_connect_account_id,
  stripe_connect_onboarding_complete,
  stripe_connect_charges_enabled,
  stripe_connect_payouts_enabled
FROM profiles
WHERE stripe_connect_account_id IS NOT NULL
```

**In Your Code:**
```typescript
import { getInstructorConnectStatus } from '@/lib/stripe-connect-service'

const status = await getInstructorConnectStatus(instructorId)
// Returns: has_account, onboarding_complete, charges_enabled, payouts_enabled
```

---

## 🔍 **Technical Details (Already Implemented)**

### **Key Files:**

1. **`lib/stripe-connect-service.ts`**
   - `createInstructorConnectAccount()` - Creates Express account
   - `createInstructorTransfer()` - Sends payment to instructor
   - `getInstructorConnectStatus()` - Checks account status
   - `createInstructorDashboardLink()` - Stripe dashboard access

2. **`app/api/instructor/stripe-connect/setup/route.ts`**
   - POST endpoint to initiate Connect setup
   - Authenticates user
   - Creates Express account
   - Returns onboarding URL

3. **`components/instructor/onboarding/steps/stripe-connect-step.tsx`**
   - Step 8 of 10 in instructor onboarding
   - UI for "Connect with Stripe" button
   - Handles redirects to/from Stripe

4. **`app/api/webhooks/stripe/route.ts`**
   - Handles `account.updated` - Updates Connect account status
   - Handles `transfer.paid` - Marks instructor payments as complete
   - Handles payment events - Processes student payments

### **Database Schema:**

Instructors have these Stripe Connect fields in `profiles`:
```sql
stripe_connect_account_id            -- Stripe Express account ID (acct_...)
stripe_connect_onboarding_complete   -- true/false
stripe_connect_charges_enabled       -- Can process payments
stripe_connect_payouts_enabled       -- Can receive payouts
stripe_connect_requirements_pending  -- Any missing requirements
stripe_connect_requirements_due_date -- Deadline for requirements
```

---

## ✅ **Verification Checklist**

After completing the actions above, verify:

- [ ] No more `STRIPE_SECRET_KEY not configured` errors
- [ ] Instructor onboarding completes successfully
- [ ] Stripe Connect step (Step 8) redirects to Stripe
- [ ] Express account appears in Stripe Dashboard → Connect → Accounts
- [ ] `profiles` table has `stripe_connect_account_id` populated
- [ ] Webhook receives `account.updated` events (check Stripe logs)

---

## 🆘 **Troubleshooting**

### **If you still get "STRIPE_SECRET_KEY not configured":**
1. Double-check the environment variable name is EXACTLY: `STRIPE_SECRET_KEY`
2. Verify it's saved in ALL environments (Production, Preview, Development)
3. Redeploy the application after adding variables
4. Check Vercel logs: View function logs for the error

### **If Stripe Connect step doesn't appear:**
1. Verify instructor is going through onboarding (not logged in to existing account)
2. Check `components/instructor/onboarding/onboarding-flow.tsx` line 102-108
3. Check the onboarding is not already completed

### **If webhook events aren't received:**
1. Check webhook URL is correct: `https://desertskiesportal.vercel.app/api/webhooks/stripe`
2. Verify webhook secret matches environment variable
3. Check Stripe Dashboard → Webhooks → View logs
4. Ensure `account.updated` and `transfer.paid` events are selected

---

## 📚 **Additional Documentation**

I've created two comprehensive guides for you:

1. **`STRIPE_CONNECT_INSTRUCTOR_GUIDE.md`**
   - Complete technical architecture
   - How Stripe Connect works
   - Payment flow diagrams
   - Webhook details

2. **`STRIPE_ENVIRONMENT_VARIABLES_FIX.md`**
   - Quick reference for environment variables
   - Common mistakes and fixes

---

## 🎉 **Final Notes**

### **You Do NOT Need To:**
- ❌ Create instructor accounts manually in Stripe
- ❌ Add instructors as Stripe customers
- ❌ Write any new code
- ❌ Modify the database schema

### **The System Will Automatically:**
- ✅ Create Express accounts when instructors click "Connect with Stripe"
- ✅ Update account status via webhooks
- ✅ Handle transfers when you pay instructors
- ✅ Manage payouts to instructor bank accounts

### **Instructors Control:**
- ✅ Their own payout schedule (manual by default)
- ✅ Their bank account details (via Stripe dashboard)
- ✅ Their tax information (W-9 via Stripe)

---

## ⏱️ **Time Estimate**

- **Total Time**: ~10-15 minutes
- **Complexity**: Very easy (just configuration)
- **Coding Required**: Zero
- **Result**: Fully functional Stripe Connect for all instructors

---

## 🚀 **Next Steps After Setup**

Once working with test keys:

1. **Test with multiple instructors** to ensure it scales
2. **Test a transfer** to an instructor's Connect account
3. **Switch to live keys** when ready for production:
   - Use `pk_live_...` and `sk_live_...`
   - Update webhook to use live keys
   - Instructors will create real accounts with real bank details

---

**Questions?** Check the other documentation files or test in Stripe's test mode first!

