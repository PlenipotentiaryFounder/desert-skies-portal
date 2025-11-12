# 🎯 Stripe Webhook Setup - Step by Step

## ⚡ **Quick Answer:**
You need **ONE webhook** that handles BOTH instructors and students!

---

## 📋 **STEP-BY-STEP WEBHOOK SETUP**

### **Step 1: Go to Stripe Dashboard**
1. Open: https://dashboard.stripe.com/test/webhooks
2. Click: **"+ Add endpoint"** button (top right)

---

### **Step 2: Configure the Endpoint**

**Endpoint URL:**
```
https://desertskiesportal.vercel.app/api/webhooks/stripe
```

**Description:**
```
Desert Skies - All Payment & Connect Events
```

---

### **Step 3: Select Events to Listen For**

Click **"Select events"** and check these boxes:

#### **💳 Student Payment Events:**
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `payment_intent.canceled`
- ✅ `charge.succeeded`
- ✅ `charge.failed`
- ✅ `charge.refunded`
- ✅ `charge.dispute.created`
- ✅ `charge.dispute.closed`

#### **👨‍✈️ Instructor Connect Events:**
- ✅ `account.updated` ← **CRITICAL**
- ✅ `account.application.authorized`
- ✅ `account.application.deauthorized`

#### **💸 Instructor Payout Events:**
- ✅ `transfer.created`
- ✅ `transfer.paid` ← **CRITICAL**
- ✅ `transfer.failed`
- ✅ `transfer.reversed`
- ✅ `payout.created`
- ✅ `payout.paid`
- ✅ `payout.failed`

#### **📊 Invoice Events (if you use invoices):**
- ✅ `invoice.created`
- ✅ `invoice.finalized`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`

**OR** just click **"Select all events"** if you want to be safe!

---

### **Step 4: Save and Get Your Signing Secret**

1. Click: **"Add endpoint"**
2. You'll see a screen with your webhook details
3. **Copy the Signing secret** - it starts with `whsec_...`
4. **This is your `STRIPE_WEBHOOK_SECRET`!**

---

### **Step 5: Add to Your Environment Variables**

#### **A. Local Development (.env.local):**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### **B. Vercel (Production):**
1. Go to: https://vercel.com/YOUR_TEAM/desertskiesportal/settings/environment-variables
2. Add variable:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_...` (paste the secret from Stripe)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
3. Click **Save**
4. **Redeploy** your application

---

## 🔍 **How to Verify It's Working**

### **Step 1: Test the Webhook**
1. In Stripe Dashboard, go to your webhook
2. Click **"Send test webhook"**
3. Choose event: `payment_intent.succeeded`
4. Click **"Send test webhook"**

### **Step 2: Check Webhook Logs**
1. In Stripe Dashboard, click on your webhook
2. Go to **"Recent deliveries"** tab
3. You should see:
   - ✅ Status: `200` (success)
   - ❌ Status: `4xx` or `5xx` (error - check logs)

### **Step 3: Check Vercel Logs**
1. Go to: https://vercel.com/YOUR_TEAM/desertskiesportal/logs
2. Filter by: `/api/webhooks/stripe`
3. Look for webhook events being processed

---

## 📊 **What This Webhook Does**

### **For Students:**
```
Student pays → payment_intent.succeeded → Webhook fires
              → System records payment
              → Student gets receipt email
              → Balance updated
```

### **For Instructors:**
```
Instructor completes onboarding → account.updated → Webhook fires
                                → Profile updated with Connect status
                                → Instructor can now receive payments

You transfer money → transfer.paid → Webhook fires
                   → System marks payout as complete
                   → Instructor balance updated
```

---

## ⚠️ **IMPORTANT: One Webhook = Everything**

Your existing webhook handler at `/api/webhooks/stripe` **ALREADY** handles all these events!

**File:** `app/api/webhooks/stripe/route.ts`

It includes handlers for:
- ✅ `payment_intent.succeeded` → `handlePaymentIntentSucceeded()`
- ✅ `payment_intent.payment_failed` → `handlePaymentIntentFailed()`
- ✅ `charge.dispute.created` → `handleChargeDispute()`
- ✅ `account.updated` → `handleConnectAccountUpdated()` ← For instructors
- ✅ `transfer.paid` → `handleTransferPaid()` ← For instructor payouts

**You don't need separate webhooks for students vs instructors!**

---

## 🔐 **Security Note**

Your webhook endpoint verifies signatures using `STRIPE_WEBHOOK_SECRET`:

```typescript
const sig = request.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

This ensures only real Stripe events are processed (not fake ones).

---

## ✅ **Checklist**

After setup, verify:

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Endpoint URL: `https://desertskiesportal.vercel.app/api/webhooks/stripe`
- [ ] All required events selected (or "Select all events")
- [ ] Webhook signing secret copied (`whsec_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` added to `.env.local`
- [ ] `STRIPE_WEBHOOK_SECRET` added to Vercel
- [ ] Application redeployed on Vercel
- [ ] Test webhook sent successfully (200 response)
- [ ] Vercel logs show webhook being processed

---

## 🎯 **Summary**

**Question:** Do I need separate webhooks for instructors and students?
**Answer:** ❌ **NO!** One webhook handles everything.

**Question:** What URL do I use?
**Answer:** `https://desertskiesportal.vercel.app/api/webhooks/stripe`

**Question:** What events do I need?
**Answer:** All payment, Connect, and transfer events (or just "Select all")

**Question:** Where do I get the webhook secret?
**Answer:** After creating the endpoint in Stripe Dashboard

**Question:** Does my code support this?
**Answer:** ✅ **YES!** Already fully implemented in `app/api/webhooks/stripe/route.ts`

---

## 🆘 **Need Help?**

If webhook delivery fails:
1. Check Vercel logs for errors
2. Verify `STRIPE_WEBHOOK_SECRET` is correct
3. Make sure app is deployed (webhook URL must be live)
4. Check Stripe Dashboard → Webhooks → Recent deliveries for error details

---

**Now go set it up! It takes 5 minutes.** ⚡

