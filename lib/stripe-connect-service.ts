"use server"

import Stripe from 'stripe'
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// Service client helper
async function createServiceClient() {
  return await createClient(await cookies())
}

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  })
}

/**
 * Create Stripe Connect Express account for instructor
 */
export async function createInstructorConnectAccount(
  instructorId: string,
  email: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; account_id?: string; onboarding_url?: string; error?: string }> {
  try {
    const stripe = getStripe()
    const supabase = await createServiceClient()
    
    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      individual: {
        first_name: firstName,
        last_name: lastName,
        email: email,
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual', // Instructors control when they get paid
          },
        },
      },
    })
    
    // Save to database
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        stripe_connect_account_id: account.id,
        stripe_connect_onboarding_complete: false, // Not complete until webhook confirms
        updated_at: new Date().toISOString()
      })
      .eq('id', instructorId)
    
    if (dbError) throw dbError
    
    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/instructor/settings?tab=billing`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/instructor/settings?tab=billing&onboarding=complete`,
      type: 'account_onboarding',
    })
    
    return {
      success: true,
      account_id: account.id,
      onboarding_url: accountLink.url
    }
  } catch (error) {
    console.error('Error creating Connect account:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * FIX: Enqueue transfer to outbox for idempotent processing
 * Status starts as 'pending', only set to 'paid' on webhook
 */
export async function enqueueInstructorTransfer(params: {
  instructorId: string
  amountCents: number
  flightSessionId: string
  journalId: string
  isInstantPayout: boolean
  instantFeeChargeToDSA: boolean
}): Promise<{ success: boolean; outbox_id?: string; error?: string }> {
  try {
    const supabase = await createServiceClient()
    
    // Generate idempotency key from journal + instructor
    const idempotencyKey = `transfer_${params.journalId}_${params.instructorId}`
    
    // Insert into outbox (idempotent)
    const { data: outbox, error: outboxError } = await supabase
      .from('payment_outbox')
      .insert({
        idempotency_key: idempotencyKey,
        action_type: 'create_transfer',
        instructor_id: params.instructorId,
        amount_cents: params.amountCents,
        journal_id: params.journalId,
        flight_session_id: params.flightSessionId,
        is_instant_payout: params.isInstantPayout,
        instant_fee_charge_to_dsa: params.instantFeeChargeToDSA,
        status: 'pending'
      })
      .select('id')
      .single()
    
    if (outboxError) {
      // Check if already exists (idempotency)
      if (outboxError.code === '23505') { // Unique violation
        console.log('Transfer already enqueued:', idempotencyKey)
        const { data: existing } = await supabase
          .from('payment_outbox')
          .select('id')
          .eq('idempotency_key', idempotencyKey)
          .single()
        return { success: true, outbox_id: existing?.id }
      }
      throw outboxError
    }
    
    return {
      success: true,
      outbox_id: outbox.id
    }
  } catch (error) {
    console.error('Error enqueuing transfer:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Worker function: Process outbox entries (called by cron/queue)
 * FIX: Creates transfer with idempotency key, status starts 'pending'
 */
export async function processOutboxEntry(outboxId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = getStripe()
    const supabase = await createServiceClient()
    
    // Get outbox entry
    const { data: outbox, error: fetchError } = await supabase
      .from('payment_outbox')
      .select('*')
      .eq('id', outboxId)
      .single()
    
    if (fetchError || !outbox) throw new Error('Outbox entry not found')
    
    if (outbox.status !== 'pending') {
      return { success: true } // Already processed
    }
    
    // Mark as processing
    await supabase
      .from('payment_outbox')
      .update({ 
        status: 'processing', 
        last_attempt_at: new Date().toISOString(),
        attempt_count: outbox.attempt_count + 1
      })
      .eq('id', outboxId)
    
    // Get instructor's Connect account
    const { data: instructor } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, first_name, last_name')
      .eq('id', outbox.instructor_id)
      .single()
    
    if (!instructor?.stripe_connect_account_id) {
      throw new Error('Instructor has not completed Stripe Connect onboarding')
    }
    
    // FIX: Create transfer with idempotency key
    const transfer = await stripe.transfers.create({
      amount: outbox.amount_cents,
      currency: outbox.currency,
      destination: instructor.stripe_connect_account_id,
      metadata: {
        flight_session_id: outbox.flight_session_id,
        journal_id: outbox.journal_id,
        instructor_id: outbox.instructor_id,
        outbox_id: outboxId
      },
    }, {
      idempotencyKey: outbox.idempotency_key
    })
    
    // FIX: Create transfer record with status='pending' (webhook will confirm)
    const { error: transferError } = await supabase
      .from('instructor_transfers')
      .insert({
        instructor_id: outbox.instructor_id,
        stripe_transfer_id: transfer.id,
        stripe_connect_account_id: instructor.stripe_connect_account_id,
        amount_cents: outbox.amount_cents,
        currency: outbox.currency,
        transfer_type: outbox.is_instant_payout ? 'instant' : 'standard',
        status: 'pending', // FIX: Not 'paid' until webhook confirms
        flight_session_id: outbox.flight_session_id,
        journal_id: outbox.journal_id,
        outbox_id: outboxId,
        is_clawback_eligible: true,
        clawback_window_ends_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      })
    
    if (transferError) throw transferError
    
    // Mark outbox as completed
    await supabase
      .from('payment_outbox')
      .update({ 
        status: 'completed',
        stripe_object_id: transfer.id,
        completed_at: new Date().toISOString()
      })
      .eq('id', outboxId)
    
    // FIX: Don't programmatically trigger instant payout here
    // Let instructor trigger it from their dashboard
    // This prevents double-payout if they have auto-payouts enabled
    
    return { success: true }
  } catch (error) {
    console.error('Error processing outbox entry:', error)
    
    // Update outbox with failure
    const supabase = await createServiceClient()
    const { data: outbox } = await supabase
      .from('payment_outbox')
      .select('attempt_count, max_attempts')
      .eq('id', outboxId)
      .single()
    
    const shouldRetry = outbox && outbox.attempt_count < outbox.max_attempts
    
    await supabase
      .from('payment_outbox')
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        failure_message: error instanceof Error ? error.message : 'Unknown error',
        last_attempt_at: new Date().toISOString()
      })
      .eq('id', outboxId)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get instructor's Connect account status
 */
export async function getInstructorConnectStatus(instructorId: string): Promise<{
  has_account: boolean
  onboarding_complete: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  requirements_pending: string[]
}> {
  const supabase = await createClient(await cookies())
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_onboarding_complete, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, stripe_connect_requirements_pending')
    .eq('id', instructorId)
    .single()
  
  if (!profile) {
    return {
      has_account: false,
      onboarding_complete: false,
      charges_enabled: false,
      payouts_enabled: false,
      requirements_pending: []
    }
  }
  
  return {
    has_account: !!profile.stripe_connect_account_id,
    onboarding_complete: profile.stripe_connect_onboarding_complete || false,
    charges_enabled: profile.stripe_connect_charges_enabled || false,
    payouts_enabled: profile.stripe_connect_payouts_enabled || false,
    requirements_pending: profile.stripe_connect_requirements_pending || []
  }
}

/**
 * Create dashboard link for instructor to manage their Connect account
 */
export async function createInstructorDashboardLink(instructorId: string): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  try {
    const stripe = getStripe()
    const supabase = await createServiceClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', instructorId)
      .single()
    
    if (!profile?.stripe_connect_account_id) {
      throw new Error('Instructor has not created Connect account')
    }
    
    const loginLink = await stripe.accounts.createLoginLink(
      profile.stripe_connect_account_id
    )
    
    return {
      success: true,
      url: loginLink.url
    }
  } catch (error) {
    console.error('Error creating dashboard link:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}


