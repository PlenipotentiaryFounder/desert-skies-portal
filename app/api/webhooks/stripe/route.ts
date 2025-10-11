import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Initialize Stripe with webhook secret for verification
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Webhook endpoint secret for signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)

  try {
    const supabase = await createClient()

    // Get invoice ID from metadata
    const invoiceId = paymentIntent.metadata?.invoice_id

    if (!invoiceId) {
      console.error('No invoice ID in payment intent metadata')
      return
    }

    // Update invoice status
    const { error } = await supabase
      .from('instructor_invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (error) {
      console.error('Error updating invoice:', error)
      return
    }

    // Get invoice details for notification
    const { data: invoice } = await supabase
      .from('instructor_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoice) {
      // Record the payment transaction
      await supabase
        .from('instructor_billing_transactions')
        .insert({
          student_id: invoice.student_id,
          instructor_id: invoice.instructor_id,
          transaction_type: 'cash_credit',
          cash_amount: invoice.total_amount,
          description: `Payment for Invoice #${invoice.invoice_number}`,
          reference_type: 'invoice_payment',
          reference_id: invoiceId,
          metadata: {
            payment_intent_id: paymentIntent.id,
            payment_method: 'stripe',
            stripe_fee: paymentIntent.application_fee_amount || 0
          }
        })

      // Send payment confirmation notification
      await import('@/lib/notification-service').then(({ notifyPaymentReceived }) =>
        notifyPaymentReceived(invoice.student_id, invoice.total_amount, invoice.invoice_number)
      )
    }

    console.log(`Payment processed successfully for invoice ${invoiceId}`)
  } catch (error) {
    console.error('Error processing payment webhook:', error)
  }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id)

  try {
    const supabase = await createClient()

    // Get invoice ID from metadata
    const invoiceId = paymentIntent.metadata?.invoice_id

    if (!invoiceId) {
      console.error('No invoice ID in payment intent metadata')
      return
    }

    // Log the failed payment attempt
    await supabase
      .from('instructor_billing_transactions')
      .insert({
        student_id: paymentIntent.metadata?.student_id,
        instructor_id: paymentIntent.metadata?.instructor_id,
        transaction_type: 'adjustment',
        cash_amount: 0, // No money was actually transferred
        description: `Payment attempt failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
        reference_type: 'payment_attempt',
        reference_id: paymentIntent.id,
        metadata: {
          payment_intent_id: paymentIntent.id,
          error_message: paymentIntent.last_payment_error?.message,
          error_code: paymentIntent.last_payment_error?.code
        }
      })

    // Send failure notification
    if (paymentIntent.metadata?.student_id) {
      await import('@/lib/notification-service').then(({ notifyPaymentFailed }) =>
        notifyPaymentFailed(
          paymentIntent.metadata.student_id,
          paymentIntent.amount / 100, // Convert from cents
          paymentIntent.last_payment_error?.message
        )
      )
    }

    console.log(`Payment failure logged for invoice ${invoiceId}`)
  } catch (error) {
    console.error('Error processing payment failure webhook:', error)
  }
}

// Handle charge disputes
async function handleChargeDispute(dispute: Stripe.Dispute) {
  console.log('Charge dispute created:', dispute.id)

  try {
    const supabase = await createClient()

    // Find the related payment intent and invoice
    const paymentIntent = await stripe.paymentIntents.retrieve(dispute.payment_intent as string)

    if (paymentIntent.metadata?.invoice_id) {
      // Log the dispute
      await supabase
        .from('instructor_billing_transactions')
        .insert({
          student_id: paymentIntent.metadata.student_id,
          instructor_id: paymentIntent.metadata.instructor_id,
          transaction_type: 'adjustment',
          cash_amount: -(dispute.amount / 100), // Negative amount for dispute
          description: `Charge dispute created: ${dispute.reason}`,
          reference_type: 'charge_dispute',
          reference_id: dispute.id,
          metadata: {
            payment_intent_id: dispute.payment_intent,
            dispute_reason: dispute.reason,
            dispute_status: dispute.status
          }
        })

      // Update invoice status if needed
      await supabase
        .from('instructor_invoices')
        .update({
          status: 'disputed',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', dispute.payment_intent)

      console.log(`Dispute logged for payment intent ${dispute.payment_intent}`)
    }
  } catch (error) {
    console.error('Error processing dispute webhook:', error)
  }
}
