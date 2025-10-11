"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { InstructorInvoice } from "@/lib/instructor-billing-service"

export interface PaymentIntent {
  id: string
  client_secret: string
  amount: number
  currency: string
  status: string
  metadata?: Record<string, string>
}

export interface PaymentResult {
  success: boolean
  payment_intent_id?: string
  error?: string
  message: string
}

export interface StripePaymentData {
  amount: number // in cents
  currency: string
  customer_email: string
  description: string
  metadata?: Record<string, string>
}

// Stripe Payment Processing
export async function createPaymentIntent(
  invoiceId: string,
  paymentData: StripePaymentData
): Promise<{ success: boolean; client_secret?: string; error?: string }> {
  try {
    // Import Stripe dynamically to avoid issues if STRIPE_SECRET_KEY is not set
    const Stripe = (await import('stripe')).default

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount,
      currency: paymentData.currency,
      customer_email: paymentData.customer_email,
      description: paymentData.description,
      metadata: {
        invoice_id: invoiceId,
        ...paymentData.metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log('Payment intent created:', {
      id: paymentIntent.id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      invoice_id: invoiceId
    })

    return {
      success: true,
      client_secret: paymentIntent.client_secret!
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function processInvoicePayment(
  invoiceId: string,
  paymentIntentId: string,
  paymentMethod: string = 'stripe'
): Promise<PaymentResult> {
  try {
    const supabase = await createClient(await cookies())

    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('instructor_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Verify the payment with Stripe
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not completed. Status: ${paymentIntent.status}`)
    }

    // Verify the amount matches (security check)
    if (paymentIntent.amount !== Math.round(invoice.total_amount * 100)) {
      throw new Error('Payment amount does not match invoice amount')
    }

    // Update invoice status to paid
    const { error: updateError } = await supabase
      .from('instructor_invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        stripe_payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (updateError) {
      throw new Error('Failed to update invoice status')
    }

    // Record the payment transaction
    const { error: transactionError } = await supabase
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
          payment_intent_id: paymentIntentId,
          payment_method: paymentMethod,
          stripe_fee: paymentIntent.application_fee_amount || 0
        }
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // Don't fail the payment if transaction recording fails
    }

    // Send payment confirmation notification
    await import('./notification-service').then(({ notifyPaymentReceived }) =>
      notifyPaymentReceived(invoice.student_id, invoice.total_amount, invoice.invoice_number)
    )

    return {
      success: true,
      payment_intent_id: paymentIntentId,
      message: `Payment of $${invoice.total_amount.toFixed(2)} processed successfully`
    }
  } catch (error) {
    console.error('Error processing payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Payment processing failed'
    }
  }
}

export async function refundPayment(
  invoiceId: string,
  amount?: number,
  reason?: string
): Promise<PaymentResult> {
  try {
    const supabase = await createClient(await cookies())

    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('instructor_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    if (invoice.status !== 'paid') {
      throw new Error('Invoice is not paid and cannot be refunded')
    }

    if (!invoice.stripe_payment_intent_id) {
      throw new Error('No payment intent found for refund')
    }

    const refundAmount = amount || invoice.total_amount

    // Process the refund with Stripe
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    })

    const refund = await stripe.refunds.create({
      payment_intent: invoice.stripe_payment_intent_id,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: reason || 'requested_by_customer',
      metadata: {
        invoice_id: invoiceId,
        original_amount: invoice.total_amount
      }
    })

    // Update invoice status
    const newStatus = refundAmount >= invoice.total_amount ? 'cancelled' : 'paid'
    const { error: updateError } = await supabase
      .from('instructor_invoices')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (updateError) {
      throw new Error('Failed to update invoice status')
    }

    // Record the refund transaction
    const { error: transactionError } = await supabase
      .from('instructor_billing_transactions')
      .insert({
        student_id: invoice.student_id,
        instructor_id: invoice.instructor_id,
        transaction_type: 'refund',
        cash_amount: refundAmount,
        description: `Refund for Invoice #${invoice.invoice_number}${reason ? ` - ${reason}` : ''}`,
        reference_type: 'invoice_refund',
        reference_id: invoiceId,
        metadata: {
          original_payment_intent_id: invoice.stripe_payment_intent_id,
          refund_reason: reason,
          stripe_refund_id: refund.id
        }
      })

    if (transactionError) {
      console.error('Error recording refund transaction:', transactionError)
    }

    // Send refund notification
    await import('./notification-service').then(({ notifySessionAdjusted }) =>
      notifySessionAdjusted(invoice.student_id, invoiceId, 'refund', refundAmount, reason || 'Refund processed')
    )

    return {
      success: true,
      message: `Refund of $${refundAmount.toFixed(2)} processed successfully`
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Refund processing failed'
    }
  }
}

// Account Balance Payments
export async function payFromAccountBalance(
  invoiceId: string,
  studentId: string,
  instructorId: string
): Promise<PaymentResult> {
  try {
    const supabase = await createClient(await cookies())

    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('instructor_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Get student account balance
    const { data: account, error: accountError } = await supabase
      .from('student_instructor_accounts')
      .select('*')
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)
      .single()

    if (accountError || !account) {
      throw new Error('Student account not found')
    }

    if (account.account_balance < invoice.total_amount) {
      return {
        success: false,
        error: 'Insufficient account balance',
        message: `Account balance ($${account.account_balance.toFixed(2)}) is less than invoice amount ($${invoice.total_amount.toFixed(2)})`
      }
    }

    // Deduct from account balance
    const newBalance = account.account_balance - invoice.total_amount
    const { error: balanceUpdateError } = await supabase
      .from('student_instructor_accounts')
      .update({
        account_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)

    if (balanceUpdateError) {
      throw new Error('Failed to update account balance')
    }

    // Update invoice status
    const { error: invoiceUpdateError } = await supabase
      .from('instructor_invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: 'account_balance',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (invoiceUpdateError) {
      throw new Error('Failed to update invoice status')
    }

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('instructor_billing_transactions')
      .insert({
        student_id: studentId,
        instructor_id: instructorId,
        transaction_type: 'cash_credit',
        cash_amount: invoice.total_amount,
        description: `Payment for Invoice #${invoice.invoice_number} from account balance`,
        reference_type: 'invoice_payment',
        reference_id: invoiceId,
        cash_balance_after: newBalance,
        metadata: {
          payment_method: 'account_balance',
          previous_balance: account.account_balance
        }
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
    }

    return {
      success: true,
      message: `Payment of $${invoice.total_amount.toFixed(2)} processed from account balance. New balance: $${newBalance.toFixed(2)}`
    }
  } catch (error) {
    console.error('Error processing account balance payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Account balance payment failed'
    }
  }
}

// Prepaid Hours Payments
export async function payFromPrepaidHours(
  invoiceId: string,
  studentId: string,
  instructorId: string
): Promise<PaymentResult> {
  try {
    const supabase = await createClient(await cookies())

    // Get the invoice with line items
    const { data: invoice, error: invoiceError } = await supabase
      .from('instructor_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Get student account
    const { data: account, error: accountError } = await supabase
      .from('student_instructor_accounts')
      .select('*')
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)
      .single()

    if (accountError || !account) {
      throw new Error('Student account not found')
    }

    // Check if there are enough prepaid hours
    const requiredFlightHours = invoice.flight_hours
    const requiredGroundHours = invoice.ground_hours

    if (account.prepaid_flight_hours < requiredFlightHours || 
        account.prepaid_ground_hours < requiredGroundHours) {
      return {
        success: false,
        error: 'Insufficient prepaid hours',
        message: `Not enough prepaid hours. Need ${requiredFlightHours} flight + ${requiredGroundHours} ground hours`
      }
    }

    // Deduct hours
    const newFlightHours = account.prepaid_flight_hours - requiredFlightHours
    const newGroundHours = account.prepaid_ground_hours - requiredGroundHours

    const { error: hoursUpdateError } = await supabase
      .from('student_instructor_accounts')
      .update({
        prepaid_flight_hours: newFlightHours,
        prepaid_ground_hours: newGroundHours,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)

    if (hoursUpdateError) {
      throw new Error('Failed to update prepaid hours')
    }

    // Update invoice status
    const { error: invoiceUpdateError } = await supabase
      .from('instructor_invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: 'prepaid_hours',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)

    if (invoiceUpdateError) {
      throw new Error('Failed to update invoice status')
    }

    // Record transactions for both flight and ground hours
    const transactions = []
    
    if (requiredFlightHours > 0) {
      transactions.push({
        student_id: studentId,
        instructor_id: instructorId,
        transaction_type: 'flight_debit' as const,
        flight_hours: requiredFlightHours,
        cash_amount: 0,
        description: `Flight hours used for Invoice #${invoice.invoice_number}`,
        reference_type: 'invoice_payment',
        reference_id: invoiceId,
        flight_hours_balance_after: newFlightHours
      })
    }

    if (requiredGroundHours > 0) {
      transactions.push({
        student_id: studentId,
        instructor_id: instructorId,
        transaction_type: 'ground_debit' as const,
        ground_hours: requiredGroundHours,
        cash_amount: 0,
        description: `Ground hours used for Invoice #${invoice.invoice_number}`,
        reference_type: 'invoice_payment',
        reference_id: invoiceId,
        ground_hours_balance_after: newGroundHours
      })
    }

    if (transactions.length > 0) {
      const { error: transactionError } = await supabase
        .from('instructor_billing_transactions')
        .insert(transactions)

      if (transactionError) {
        console.error('Error recording transactions:', transactionError)
      }
    }

    return {
      success: true,
      message: `Payment processed using prepaid hours. Remaining: ${newFlightHours.toFixed(1)} flight, ${newGroundHours.toFixed(1)} ground hours`
    }
  } catch (error) {
    console.error('Error processing prepaid hours payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Prepaid hours payment failed'
    }
  }
}
