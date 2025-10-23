import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  })
}

function getWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }
  return process.env.STRIPE_WEBHOOK_SECRET
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const sig = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      // Verify webhook signature
      const stripe = getStripe()
      const endpointSecret = getWebhookSecret()
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

      // Stripe Connect events
      case 'account.updated':
        await handleConnectAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'transfer.paid':
        await handleTransferPaid(event.data.object as Stripe.Transfer)
        break

      case 'transfer.failed':
        await handleTransferFailed(event.data.object as Stripe.Transfer)
        break

      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout)
        break

      case 'payout.failed':
        await handlePayoutFailed(event.data.object as Stripe.Payout)
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
    const stripe = getStripe()
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

// ========================================
// STRIPE CONNECT EVENT HANDLERS
// ========================================

// Handle Stripe Connect account updates
async function handleConnectAccountUpdated(account: Stripe.Account) {
  console.log('Connect account updated:', account.id)

  try {
    const supabase = await createClient()

    // Update instructor profile with Connect account status
    const { error } = await supabase
      .from('profiles')
      .update({
        stripe_connect_onboarding_complete: account.charges_enabled && account.payouts_enabled,
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
        stripe_connect_requirements_pending: account.requirements?.currently_due || [],
        stripe_connect_requirements_due_date: account.requirements?.current_deadline 
          ? new Date(account.requirements.current_deadline * 1000).toISOString().split('T')[0]
          : null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_connect_account_id', account.id)

    if (error) {
      console.error('Error updating Connect account status:', error)
      return
    }

    console.log(`Connect account ${account.id} updated successfully`)
  } catch (error) {
    console.error('Error processing Connect account update:', error)
  }
}

// Handle successful instructor transfer
async function handleTransferPaid(transfer: Stripe.Transfer) {
  console.log('Transfer paid:', transfer.id)

  try {
    const supabase = await createClient()

    // Update transfer status to paid
    const { error } = await supabase
      .from('instructor_transfers')
      .update({
        status: 'paid',
        paid_at: new Date(transfer.created * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_transfer_id', transfer.id)

    if (error) {
      console.error('Error updating transfer status:', error)
      return
    }

    // Get transfer details for notification
    const { data: transferData } = await supabase
      .from('instructor_transfers')
      .select('*, profiles!instructor_id(first_name, last_name, email)')
      .eq('stripe_transfer_id', transfer.id)
      .single()

    if (transferData) {
      // Send payout notification to instructor
      await import('@/lib/notification-service').then(({ notifyInstructorPayout }) =>
        notifyInstructorPayout(
          transferData.instructor_id,
          transferData.amount_cents / 100,
          transfer.id
        )
      )
    }

    console.log(`Transfer ${transfer.id} marked as paid`)
  } catch (error) {
    console.error('Error processing transfer paid webhook:', error)
  }
}

// Handle failed instructor transfer
async function handleTransferFailed(transfer: Stripe.Transfer) {
  console.log('Transfer failed:', transfer.id)

  try {
    const supabase = await createClient()

    // Update transfer status to failed
    const { error } = await supabase
      .from('instructor_transfers')
      .update({
        status: 'failed',
        failure_code: (transfer as any).failure_code || 'unknown',
        failure_message: (transfer as any).failure_message || 'Transfer failed',
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_transfer_id', transfer.id)

    if (error) {
      console.error('Error updating transfer failure status:', error)
      return
    }

    // Get transfer details for notification
    const { data: transferData } = await supabase
      .from('instructor_transfers')
      .select('*, profiles!instructor_id(first_name, last_name, email)')
      .eq('stripe_transfer_id', transfer.id)
      .single()

    if (transferData) {
      // Send failure notification to admin
      await import('@/lib/notification-service').then(({ notifyAdminTransferFailed }) =>
        notifyAdminTransferFailed(
          transferData.instructor_id,
          transferData.amount_cents / 100,
          (transfer as any).failure_message || 'Transfer failed'
        )
      )
    }

    // Mark outbox entry for retry
    const { error: outboxError } = await supabase
      .from('payment_outbox')
      .update({
        status: 'failed',
        failure_message: (transfer as any).failure_message || 'Transfer failed',
        last_attempt_at: new Date().toISOString()
      })
      .eq('stripe_object_id', transfer.id)

    if (outboxError) {
      console.error('Error updating outbox status:', outboxError)
    }

    console.log(`Transfer ${transfer.id} marked as failed`)
  } catch (error) {
    console.error('Error processing transfer failed webhook:', error)
  }
}

// Handle successful payout (instant payout confirmation)
async function handlePayoutPaid(payout: Stripe.Payout) {
  console.log('Payout paid:', payout.id)

  try {
    // Log instant payout completion if it was an instant payout
    if (payout.type === 'bank_account' && payout.method === 'instant') {
      const supabase = await createClient()

      // Record instant payout fee if applicable
      await supabase
        .from('instructor_transfers')
        .update({
          instant_payout_fee_cents: Math.round((payout.amount * 0.01)), // 1% fee
          updated_at: new Date().toISOString()
        })
        .eq('stripe_connect_account_id', payout.destination)
        .eq('transfer_type', 'instant')
        .is('instant_payout_fee_cents', null)
    }

    console.log(`Payout ${payout.id} completed successfully`)
  } catch (error) {
    console.error('Error processing payout paid webhook:', error)
  }
}

// Handle failed payout
async function handlePayoutFailed(payout: Stripe.Payout) {
  console.log('Payout failed:', payout.id)

  try {
    const supabase = await createClient()

    // Log payout failure for monitoring
    await supabase
      .from('reserve_alerts')
      .insert({
        alert_type: 'warning_threshold',
        severity: 'warning',
        platform_balance_cents: 0, // Will be updated by reserve monitoring
        message: `Instructor payout failed: ${payout.failure_message || 'Unknown error'}`,
        metadata: {
          payout_id: payout.id,
          failure_code: payout.failure_code,
          failure_message: payout.failure_message
        }
      })

    console.log(`Payout failure logged: ${payout.id}`)
  } catch (error) {
    console.error('Error processing payout failed webhook:', error)
  }
}
