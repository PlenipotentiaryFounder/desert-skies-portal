# Apple Pay Setup Guide for Desert Skies Portal

## Overview

Apple Pay integration is now implemented in your purchase hours flow. This guide will help you configure Apple Pay in your Stripe dashboard to enable seamless payments for your students.

## Prerequisites

1. **Stripe Account**: Must be activated and verified
2. **Domain**: Your production domain must be verified with Apple
3. **SSL Certificate**: Valid SSL certificate on your domain

## Step 1: Enable Apple Pay in Stripe Dashboard

1. **Login to Stripe Dashboard**: Go to [dashboard.stripe.com](https://dashboard.stripe.com)

2. **Navigate to Apple Pay Settings**:
   - Go to **Settings** → **Payment methods**
   - Find **Apple Pay** in the list
   - Click **"Set up Apple Pay"**

3. **Domain Verification**:
   - Stripe will provide you with a verification file
   - Download the verification file (`.txt` format)
   - Host this file at: `https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association`

4. **Configure Business Details**:
   - **Merchant Name**: "Desert Skies Aviation" (or your business name)
   - **Country**: United States
   - **Currency**: USD

## Step 2: Domain Verification

1. **Download Verification File**:
   - From Stripe dashboard, download the domain verification file
   - The file will be named something like `apple-developer-merchantid-domain-association.txt`

2. **Host the File**:
   - Upload the file to your web server at:
     ```
     https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
     ```
   - Ensure the file is accessible via HTTPS
   - The `.well-known` directory should be at your domain root

3. **Verify in Stripe**:
   - Return to Stripe dashboard
   - Click **"Verify domain"**
   - Stripe will check if the file is accessible

## Step 3: Configure Payment Processing

1. **Payment Methods**:
   - Apple Pay will automatically appear as a payment option
   - It's included in the `paymentMethodOrder` in your code: `['apple_pay', 'google_pay', 'card']`

2. **Supported Devices**:
   - iPhone (Safari)
   - iPad (Safari)
   - Mac (Safari with Touch ID)

3. **Transaction Limits**:
   - Apple Pay transactions follow the same limits as regular card payments
   - No additional limits specific to Apple Pay

## Step 4: Testing Apple Pay

### Test Environment Setup

1. **Sandbox Testing**:
   - Use Stripe's test mode for Apple Pay testing
   - Apple Pay works in test mode with test cards

2. **Test Cards for Apple Pay**:
   - **Success**: `4000000000000002` (generates successful payment)
   - **Decline**: `4000000000000127` (generates declined payment)

3. **Testing Steps**:
   1. Add a test card to your Apple Wallet (via Safari)
   2. Go to your purchase hours page
   3. Select hours and click "Proceed to Payment"
   4. Apple Pay should appear as a payment option
   5. Complete payment with test credentials

## Step 5: Production Deployment

1. **Switch to Live Mode**:
   - Update your Stripe keys to live mode (`pk_live_...`, `sk_live_...`)
   - Update webhook endpoints to production domain

2. **Domain Verification (Production)**:
   - Repeat domain verification process with production domain
   - Use live verification file from Stripe

3. **Final Testing**:
   - Test Apple Pay with real cards in production
   - Verify webhook delivery
   - Check that payments appear correctly in Stripe dashboard

## Troubleshooting

### Common Issues

1. **Apple Pay Not Appearing**:
   - Ensure domain is properly verified
   - Check that you're on HTTPS
   - Verify browser/device supports Apple Pay

2. **Domain Verification Failed**:
   - Ensure file is at correct path: `/.well-known/apple-developer-merchantid-domain-association`
   - File must be accessible via HTTPS
   - No redirects allowed

3. **Payment Processing Issues**:
   - Check Stripe dashboard for error details
   - Verify webhook delivery
   - Check application logs

### Debugging Tools

1. **Stripe Dashboard**:
   - Monitor **Payments** section for Apple Pay transactions
   - Check **Events & webhooks** for payment confirmations

2. **Browser Developer Tools**:
   - Check console for JavaScript errors
   - Verify PaymentElement is loading correctly

3. **Network Tab**:
   - Monitor requests to Stripe API
   - Check for domain verification file access

## Security Considerations

1. **Domain Verification**: Only verified domains can use Apple Pay
2. **HTTPS Required**: All Apple Pay transactions must use HTTPS
3. **PCI Compliance**: Stripe handles all sensitive card data
4. **Tokenization**: Apple Pay uses payment tokens, not raw card data

## Support Resources

- **Stripe Apple Pay Documentation**: [stripe.com/docs/apple-pay](https://stripe.com/docs/apple-pay)
- **Apple Pay Guidelines**: [developer.apple.com/apple-pay](https://developer.apple.com/apple-pay/)
- **Testing Guide**: [stripe.com/docs/testing#apple-pay](https://stripe.com/docs/testing#apple-pay)

## Implementation Details

Your current implementation includes:

✅ **Payment Intent Creation**: Server-side payment intent creation
✅ **Stripe Elements Integration**: Client-side payment form
✅ **Apple Pay Support**: Built-in Apple Pay payment method
✅ **Error Handling**: Comprehensive error handling and user feedback
✅ **Webhook Integration**: Automatic payment confirmation via webhooks
✅ **Responsive Design**: Works on all devices that support Apple Pay

The Apple Pay integration is now ready to use once you complete the Stripe dashboard configuration!
