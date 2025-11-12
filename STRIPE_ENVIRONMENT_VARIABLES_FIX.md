# 🚨 URGENT FIX: Stripe Environment Variables

## ❌ **THE PROBLEM**

You're getting this error:
```
Internal server error: STRIPE_SECRET_KEY not configured
```

## ✅ **THE SOLUTION**

### **Correct Environment Variable Names:**

```bash
# ✅ CORRECT (Stripe variables)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ❌ WRONG (This doesn't exist!)
STRIPE_SERVICE_ROLE_KEY=...  # <- You mentioned this - IT'S WRONG!
```

### **You're Confusing It With:**

```bash
# ✅ This is a Supabase variable (different service!)
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 🔧 **QUICK FIX (5 minutes)**

### **Step 1: Get Your Stripe Keys**

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy these TWO keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (click "Reveal" to see it)

### **Step 2: Add to Vercel**

1. Go to: https://vercel.com (your project)
2. Click: **Settings** → **Environment Variables**
3. Add these THREE variables:

| Name | Value | Environments |
|------|-------|--------------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | *(see step 3)* | Production, Preview, Development |

### **Step 3: Create Webhook (for STRIPE_WEBHOOK_SECRET)**

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click: **Add endpoint**
3. Enter URL: `https://desertskiesportal.vercel.app/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` ← **IMPORTANT for Stripe Connect**
   - `transfer.paid` ← **IMPORTANT for instructor payments**
   - `charge.dispute.created`
5. Click **Add endpoint**
6. **Copy the webhook secret** (`whsec_...`)
7. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`

### **Step 4: Redeploy**

In Vercel:
1. Go to: **Deployments**
2. Click the latest deployment
3. Click: **⋯** (three dots) → **Redeploy**
4. Wait ~2 minutes for deployment to complete

---

## ✅ **Verification**

After redeploying, test:
1. Go to your instructor onboarding: `/instructor/onboarding`
2. You should NO LONGER see the error
3. Stripe Connect step should work

---

## 📋 **Complete Environment Variables Checklist**

Make sure ALL of these are in Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # ← This is Supabase, not Stripe!

# Stripe ← YOU'RE MISSING THESE
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Config
NEXT_PUBLIC_APP_URL=https://desertskiesportal.vercel.app
```

---

## 🎯 **Bottom Line**

**Problem:** You're missing `STRIPE_SECRET_KEY` in Vercel
**Solution:** Add it (see Step 2 above)
**Time:** 5 minutes
**Result:** Error will disappear, Stripe Connect will work!

