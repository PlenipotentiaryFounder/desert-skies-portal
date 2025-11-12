# 🔍 How to Check Your Stripe Webhook Status

## Quick Check:

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Look for these two URLs:

### ✅ **What You SHOULD Have:**

```
Endpoint 1: https://desertskiesportal.vercel.app/api/webhooks/stripe
Status: Active
Events: payment_intent.succeeded, account.updated, transfer.paid, etc.
→ This is for your PRODUCTION app on Vercel

Endpoint 2: https://686c4c0fd0a2.ngrok-free.app/api/webhooks/stripe
Status: Active (or inactive if ngrok stopped)
Events: Same as above
→ This is for LOCAL TESTING only
```

### ❌ **Problem Scenarios:**

**Scenario A: Only have ngrok webhook**
```
Endpoint: https://686c4c0fd0a2.ngrok-free.app/...
→ MISSING production webhook!
→ Instructors on live site will have issues!
→ ACTION: Add production webhook immediately
```

**Scenario B: Have production webhook but wrong secret in Vercel**
```
Endpoint: https://desertskiesportal.vercel.app/... ✅
But: STRIPE_WEBHOOK_SECRET in Vercel doesn't match
→ Webhooks will fail with signature errors
→ ACTION: Update Vercel env var with correct secret
```

**Scenario C: Perfect setup**
```
Endpoint 1: https://desertskiesportal.vercel.app/... ✅
Endpoint 2: https://686c4c0fd0a2.ngrok-free.app/... ✅
Vercel env var: STRIPE_WEBHOOK_SECRET = whsec_... ✅
→ Everything working!
```

---

## 🎯 **Action Items Based on What You Have:**

### **If you DON'T see `desertskiesportal.vercel.app` webhook:**

1. **Add production webhook:**
   - Click "+ Add endpoint"
   - URL: `https://desertskiesportal.vercel.app/api/webhooks/stripe`
   - Events: Select all payment, account, and transfer events
   - Save and copy the webhook secret

2. **Add to Vercel:**
   - Settings → Environment Variables
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...`
   - Save and redeploy

3. **Test it:**
   - In Stripe, send test webhook
   - Check Vercel logs for webhook received

### **If you DO see `desertskiesportal.vercel.app` webhook:**

1. **Copy the webhook secret**
2. **Verify it's in Vercel environment variables**
3. **Test the webhook** (send test event in Stripe)
4. **You're all set!** ✅

---

## 🆘 **Common Issues:**

### **Issue 1: "Webhook signature verification failed"**
**Cause:** Wrong `STRIPE_WEBHOOK_SECRET` in Vercel
**Fix:** 
1. Get correct secret from Stripe Dashboard (click on webhook)
2. Update in Vercel
3. Redeploy

### **Issue 2: "Webhook endpoint returned 404"**
**Cause:** App not deployed or wrong URL
**Fix:**
1. Verify app is deployed on Vercel
2. Check URL is exactly: `https://desertskiesportal.vercel.app/api/webhooks/stripe`
3. No trailing slash!

### **Issue 3: "Webhook not receiving events"**
**Cause:** Webhook not created or wrong events selected
**Fix:**
1. Verify webhook exists in Stripe Dashboard
2. Check events include: `account.updated`, `transfer.paid`, `payment_intent.succeeded`
3. Test with "Send test webhook" button

---

## ✅ **Verification Checklist:**

After setup, verify:

- [ ] Production webhook exists: `https://desertskiesportal.vercel.app/api/webhooks/stripe`
- [ ] Events include: `payment_intent.*`, `account.updated`, `transfer.paid`
- [ ] Webhook signing secret copied (starts with `whsec_`)
- [ ] `STRIPE_WEBHOOK_SECRET` added to Vercel (all environments)
- [ ] Application redeployed on Vercel
- [ ] Test webhook sent successfully (200 response in Stripe logs)
- [ ] Vercel function logs show webhook events being processed

---

## 🎯 **Next Steps:**

1. **Tell me what you see in your Stripe Dashboard** (do you have the production webhook?)
2. I'll help you verify or add it
3. We'll test it to make sure everything works
4. Then your instructor onboarding will be fully functional!

---

**Need the exact steps? Check `STRIPE_WEBHOOK_SETUP_INSTRUCTIONS.md` for detailed setup guide.**

