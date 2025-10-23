"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getPlatformBalance } from "./ledger-service"
import Stripe from 'stripe'

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
 * FIX: Check platform reserve with proper reconciliation (NOT summation)
 * Assert: platform_wallet_balance == stripe_available + bank - unsettled - pending_payouts
 */
export async function checkPlatformReserve(): Promise<{
  current_reserve_cents: number
  minimum_required_cents: number
  status: 'healthy' | 'warning' | 'critical'
  should_block_transfers: boolean
  message: string
  drift_cents?: number
}> {
  const supabase = await createServiceClient()
  
  // Get reserve config
  const { data: config } = await supabase
    .from('platform_reserve_config')
    .select('*')
    .single()
  
  if (!config) {
    return {
      current_reserve_cents: 0,
      minimum_required_cents: 0,
      status: 'warning',
      should_block_transfers: false,
      message: 'Reserve monitoring not configured'
    }
  }
  
  // Get current platform balance (from ledger - source of truth)
  const platformBalanceCents = await getPlatformBalance()
  
  // Get Stripe available balance (for reconciliation comparison, not summation)
  const stripe = getStripe()
  const balance = await stripe.balance.retrieve()
  const stripeAvailableCents = balance.available[0]?.amount || 0
  
  // FIX: Reconcile, don't sum
  // The platform wallet should approximately equal Stripe available (minus pending)
  // Any drift indicates a reconciliation issue
  const stripePendingCents = balance.pending[0]?.amount || 0
  const expectedPlatformBalance = stripeAvailableCents // Simplified for now
  const driftCents = platformBalanceCents - expectedPlatformBalance
  
  // Log drift if significant (> $10)
  if (Math.abs(driftCents) > 1000) {
    console.warn(`Reserve drift detected: Platform wallet: ${platformBalanceCents} cents, Stripe available: ${stripeAvailableCents} cents, Drift: ${driftCents} cents`)
    
    await supabase
      .from('reserve_alerts')
      .insert({
        alert_type: 'drift_detected',
        severity: Math.abs(driftCents) > 10000 ? 'critical' : 'warning',
        platform_balance_cents: platformBalanceCents,
        drift_cents: driftCents,
        message: `Reserve drift: Platform ledger shows ${(platformBalanceCents / 100).toFixed(2)}, Stripe shows ${(stripeAvailableCents / 100).toFixed(2)}, drift of ${(driftCents / 100).toFixed(2)}`
      })
  }
  
  // Use platform wallet balance as current reserve (ledger is source of truth)
  const currentReserveCents = platformBalanceCents
  
  // Determine status based on thresholds
  let status: 'healthy' | 'warning' | 'critical' = 'healthy'
  let shouldBlock = false
  let message = 'Platform reserve is healthy'
  
  if (currentReserveCents < config.critical_threshold_cents) {
    status = 'critical'
    shouldBlock = config.block_transfers_when_critical
    message = `CRITICAL: Platform reserve at $${(currentReserveCents / 100).toFixed(2)}, below threshold of $${(config.critical_threshold_cents / 100).toFixed(2)}`
    
    // Log critical alert
    await supabase
      .from('reserve_alerts')
      .insert({
        alert_type: 'critical_threshold',
        severity: 'critical',
        platform_balance_cents: currentReserveCents,
        threshold_cents: config.critical_threshold_cents,
        message: message
      })
  } else if (currentReserveCents < config.warning_threshold_cents) {
    status = 'warning'
    message = `WARNING: Platform reserve at $${(currentReserveCents / 100).toFixed(2)}, below threshold of $${(config.warning_threshold_cents / 100).toFixed(2)}`
    
    // Log warning alert
    await supabase
      .from('reserve_alerts')
      .insert({
        alert_type: 'warning_threshold',
        severity: 'warning',
        platform_balance_cents: currentReserveCents,
        threshold_cents: config.warning_threshold_cents,
        message: message
      })
  }
  
  return {
    current_reserve_cents: currentReserveCents,
    minimum_required_cents: config.minimum_reserve_cents,
    status,
    should_block_transfers: shouldBlock,
    message,
    drift_cents: driftCents
  }
}

/**
 * Daily reconciliation job: Compare ledger to external cash
 * FIX: This is the proper way to verify reserve math
 */
export async function performDailyReconciliation(): Promise<{
  success: boolean
  balanced: boolean
  drift_cents: number
  error?: string
}> {
  try {
    const supabase = await createServiceClient()
    const stripe = getStripe()
    
    // Get all wallet balances
    const { data: platformWallet } = await supabase
      .from('wallet_balances')
      .select('balance_cents')
      .eq('wallet_id', (await supabase
        .from('wallets')
        .select('id')
        .eq('owner_type', 'platform')
        .is('owner_id', null)
        .single()
      ).data?.id)
      .single()
    
    const platformBalanceCents = platformWallet?.balance_cents || 0
    
    // Get all student wallet balances (total A/R)
    const { data: studentWallets } = await supabase.rpc('get_total_student_balances')
    const studentWalletsTotalCents = studentWallets || 0
    
    // Get all instructor wallet balances (total A/P)
    const { data: instructorWallets } = await supabase.rpc('get_total_instructor_balances')
    const instructorWalletsTotalCents = instructorWallets || 0
    
    // Get all liability wallet balances
    const { data: liabilityWallets } = await supabase.rpc('get_total_liability_balances')
    const liabilityWalletsTotalCents = liabilityWallets || 0
    
    // Double-entry check: sum of all balances should = 0
    const ledgerSumCents = platformBalanceCents + studentWalletsTotalCents + instructorWalletsTotalCents + liabilityWalletsTotalCents
    
    // Get external cash positions
    const balance = await stripe.balance.retrieve()
    const stripeAvailableCents = balance.available[0]?.amount || 0
    const stripePendingCents = balance.pending[0]?.amount || 0
    
    // FIX: Reconciliation formula (not summation!)
    // Expected platform balance = Stripe available + bank - unsettled - pending payouts
    // For now, simplified: expected = Stripe available (bank account not integrated yet)
    const expectedPlatformBalanceCents = stripeAvailableCents
    const actualPlatformBalanceCents = platformBalanceCents
    const driftCents = actualPlatformBalanceCents - expectedPlatformBalanceCents
    
    // Determine status
    const balanced = Math.abs(ledgerSumCents) < 100 && Math.abs(driftCents) < 1000 // Allow $10 drift tolerance
    const status = balanced ? 'balanced' : (Math.abs(driftCents) > 10000 ? 'critical_error' : 'drift_detected')
    
    // Record reconciliation
    const { error: insertError } = await supabase
      .from('reserve_reconciliations')
      .insert({
        reconciliation_date: new Date().toISOString().split('T')[0],
        platform_wallet_balance_cents: platformBalanceCents,
        student_wallets_total_cents: studentWalletsTotalCents,
        instructor_wallets_total_cents: instructorWalletsTotalCents,
        liability_wallets_total_cents: liabilityWalletsTotalCents,
        ledger_sum_cents: ledgerSumCents,
        stripe_available_cents: stripeAvailableCents,
        stripe_pending_cents: stripePendingCents,
        expected_platform_balance_cents: expectedPlatformBalanceCents,
        actual_platform_balance_cents: actualPlatformBalanceCents,
        drift_cents: driftCents,
        status: status,
        notes: balanced ? 'Reconciliation passed' : `Drift detected: ${(driftCents / 100).toFixed(2)}`
      })
    
    if (insertError) {
      console.error('Error recording reconciliation:', insertError)
    }
    
    return {
      success: true,
      balanced,
      drift_cents: driftCents
    }
  } catch (error) {
    console.error('Error performing reconciliation:', error)
    return {
      success: false,
      balanced: false,
      drift_cents: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get unacknowledged reserve alerts
 */
export async function getUnacknowledgedAlerts(): Promise<any[]> {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from('reserve_alerts')
    .select('*')
    .is('acknowledged_at', null)
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('Error fetching alerts:', error)
    return []
  }
  
  return data || []
}

/**
 * Acknowledge reserve alert
 */
export async function acknowledgeAlert(alertId: string, userId: string, notes?: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createServiceClient()
    
    const { error } = await supabase
      .from('reserve_alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
        resolution_notes: notes
      })
      .eq('id', alertId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Database functions needed for reconciliation (add to migration)
/*
CREATE OR REPLACE FUNCTION get_total_student_balances() RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(wb.balance_cents), 0)::INTEGER
  FROM wallet_balances wb
  JOIN wallets w ON w.id = wb.wallet_id
  WHERE w.owner_type = 'student';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_total_instructor_balances() RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(wb.balance_cents), 0)::INTEGER
  FROM wallet_balances wb
  JOIN wallets w ON w.id = wb.wallet_id
  WHERE w.owner_type = 'instructor';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_total_liability_balances() RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(wb.balance_cents), 0)::INTEGER
  FROM wallet_balances wb
  JOIN wallets w ON w.id = wb.wallet_id
  WHERE w.owner_type = 'liability';
$$ LANGUAGE SQL STABLE;
*/


