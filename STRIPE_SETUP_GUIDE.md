# Stripe Integration Setup Guide

## Prerequisites

1. **Stripe Account**: You need a Stripe account. If you don't have one, sign up at [stripe.com](https://stripe.com)

2. **Environment Variables**: Add the following to your `.env.local` file:
   ```bash
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

## Step 1: Get Your Stripe Keys

1. **Login to Stripe Dashboard**: Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Get API Keys**:
   - Go to **Developers** → **API Keys**
   - Copy your **Publishable Key** (`pk_test_...`) → `STRIPE_PUBLISHABLE_KEY`
   - Copy your **Secret Key** (`sk_test_...`) → `STRIPE_SECRET_KEY`

## Step 2: Set Up Webhooks (Required)

Webhooks are essential for handling payment confirmations asynchronously.

1. **Create Webhook Endpoint**:
   - Go to **Developers** → **Webhooks**
   - Click **"Add endpoint"**
   - **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
   - **Events to listen for**:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.dispute.created`

2. **Get Webhook Secret**:
   - After creating the endpoint, Stripe will show you the **Webhook signing secret**
   - Copy this → `STRIPE_WEBHOOK_SECRET`

## Step 3: Configure Your Application

1. **Update Environment Variables**:
   ```bash
   # In your .env.local file
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Deploy Webhook Endpoint**:
   - Make sure your application is deployed and accessible at the webhook URL you specified
   - The webhook endpoint is at `/api/webhooks/stripe`

## Step 4: Test the Integration

1. **Test Payment Flow**:
   - Create a test invoice in your application
   - Use Stripe's test card numbers:
     - **Success**: `4242424242424242`
     - **Decline**: `4000000000000002`
     - **Insufficient Funds**: `4000000000009995`

2. **Verify Webhook Delivery**:
   - Check your application logs for webhook events
   - Verify that payments are processed correctly
   - Check that notifications are sent

## Step 5: Go Live (Production)

1. **Switch to Live Keys**:
   - Replace `pk_test_` and `sk_test_` with `pk_live_` and `sk_live_`
   - Update webhook URL to your production domain

2. **Enable Webhooks in Production**:
   - Update webhook endpoint URL to production domain
   - Test with live payments

## Security Considerations

1. **Environment Variables**: Never commit Stripe keys to version control
2. **Webhook Verification**: The webhook endpoint verifies signatures to ensure requests are from Stripe
3. **Amount Verification**: Payment amounts are verified against invoice amounts
4. **Error Handling**: All payment operations include proper error handling

## Troubleshooting

### Common Issues:

1. **"Invalid signature" errors**:
   - Check that `STRIPE_WEBHOOK_SECRET` is correct
   - Verify webhook endpoint URL is accessible

2. **Payment not processing**:
   - Check application logs for errors
   - Verify Stripe dashboard shows successful payments
   - Check that webhooks are being delivered

3. **Environment variable issues**:
   - Ensure variables are set in `.env.local`
   - Restart development server after adding variables

### Debugging:

1. **Check logs**: Monitor your application logs for webhook events
2. **Test webhooks**: Use Stripe's webhook testing in the dashboard
3. **Verify configuration**: Double-check all environment variables

## Features Implemented

✅ **Payment Intent Creation**: Secure payment processing with Stripe
✅ **Webhook Handling**: Asynchronous payment confirmations
✅ **Amount Verification**: Security checks for payment amounts
✅ **Transaction Logging**: Complete audit trail of all payments
✅ **Error Handling**: Comprehensive error handling and logging
✅ **Notification System**: Real-time notifications for payment events
✅ **Refund Processing**: Full refund capabilities through Stripe
✅ **Dispute Handling**: Automatic dispute tracking and logging

## Support

For additional help:
- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: Contact Stripe support through your dashboard
- **Webhook Testing**: Use [webhook.site](https://webhook.site) for testing
