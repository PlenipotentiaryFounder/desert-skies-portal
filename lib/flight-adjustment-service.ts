"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { postJournalEntries, getOrCreateWallet } from "./ledger-service"

/**
 * Flight Adjustment and Clawback Service
 * Handles billing corrections when flight details change after completion
 */

type AdjustmentType = 'overpayment' | 'underpayment' | 'bonus' | 'penalty' | 'clawback'
type SettlementMethod = 'future_payout_offset' | 'manual_check' | 'stripe_reversal' | 'forgiven' | 'written_off'

/**
 * Adjust a completed flight session with proper ledger reversal
 * This creates reversing journal entries and instructor adjustments
 */
export async function adjustFlightSession(params: {
  flightSessionId: string
  newFlightHours?: number
  newGroundHours?: number
  adjustmentReason: string
  adjustedBy: string
}): Promise<{
  success: boolean
  adjustment_id?: string
  amount_difference_cents?: number
  error?: string
}> {
  try {
    const supabase = await createClient(await cookies())
    
    // 1. Get original flight session and billing data
    const { data: session } = await supabase
      .from('flight_sessions')
      .select('student_id, instructor_id')
      .eq('id', params.flightSessionId)
      .single()
    
    if (!session) {
      throw new Error('Flight session not found')
    }
    
    // 2. Get original ledger entries for this flight
    const { data: originalEntries } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('ref_type', 'flight_completion')
      .eq('ref_id', params.flightSessionId)
    
    if (!originalEntries || originalEntries.length === 0) {
      throw new Error('No ledger entries found for this flight')
    }
    
    // 3. Calculate original and new amounts
    const instructorEntry = originalEntries.find(e => e.description.includes('payout'))
    if (!instructorEntry) {
      throw new Error('Instructor payout entry not found')
    }
    
    const originalInstructorPayout = instructorEntry.amount_cents
    
    // Calculate new payout if hours changed
    let newInstructorPayout = originalInstructorPayout
    
    if (params.newFlightHours !== undefined || params.newGroundHours !== undefined) {
      // Get payout rates
      const { data: payoutRate } = await supabase
        .from('instructor_payout_rates')
        .select('flight_instruction_payout_cents, ground_instruction_payout_cents')
        .eq('instructor_id', session.instructor_id)
        .eq('is_active', true)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single()
      
      if (!payoutRate) {
        throw new Error('No active payout rate found')
      }
      
      // Extract hours from metadata
      const originalHours = instructorEntry.metadata?.flight_hours || 0
      const originalGroundHours = instructorEntry.metadata?.ground_hours || 0
      
      const newFlightHours = params.newFlightHours ?? originalHours
      const newGroundHours = params.newGroundHours ?? originalGroundHours
      
      // Calculate new payout
      const flightPayout = Math.round(newFlightHours * payoutRate.flight_instruction_payout_cents)
      const groundPayout = Math.round(newGroundHours * payoutRate.ground_instruction_payout_cents)
      newInstructorPayout = flightPayout + groundPayout
    }
    
    const amountDifference = newInstructorPayout - originalInstructorPayout
    
    // 4. If no change, return early
    if (amountDifference === 0) {
      return {
        success: true,
        amount_difference_cents: 0
      }
    }
    
    // 5. Determine adjustment type
    const adjustmentType: AdjustmentType = amountDifference > 0 ? 'underpayment' : 'overpayment'
    
    // 6. Get original transfer record
    const { data: transfer } = await supabase
      .from('instructor_transfers')
      .select('*')
      .eq('flight_session_id', params.flightSessionId)
      .single()
    
    // 7. Create instructor adjustment record
    const { data: adjustment, error: adjustmentError } = await supabase
      .from('instructor_adjustments')
      .insert({
        instructor_id: session.instructor_id,
        adjustment_type: adjustmentType,
        amount_cents: amountDifference, // Positive = owed TO instructor, negative = owed BY instructor
        original_flight_session_id: params.flightSessionId,
        original_transfer_id: transfer?.id,
        adjustment_reason: params.adjustmentReason,
        settlement_status: 'pending',
        requires_approval: Math.abs(amountDifference) > 5000, // Require approval for amounts > $50
        adjusted_by: params.adjustedBy
      })
      .select()
      .single()
    
    if (adjustmentError) throw adjustmentError
    
    // 8. If within clawback window (T+72h), mark transfer for potential clawback
    if (transfer && transfer.is_clawback_eligible) {
      const now = new Date()
      const clawbackDeadline = new Date(transfer.clawback_window_ends_at)
      
      if (now < clawbackDeadline && amountDifference < 0) {
        // Overpayment within clawback window - can reverse the transfer
        await supabase
          .from('instructor_transfers')
          .update({
            is_clawback_eligible: true,
            clawback_reason: params.adjustmentReason,
            updated_at: new Date().toISOString()
          })
          .eq('id', transfer.id)
      }
    }
    
    return {
      success: true,
      adjustment_id: adjustment.id,
      amount_difference_cents: amountDifference
    }
  } catch (error) {
    console.error('Error adjusting flight session:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Settle an instructor adjustment (pay or collect the difference)
 */
export async function settleInstructorAdjustment(params: {
  adjustmentId: string
  settlementMethod: SettlementMethod
  settledBy: string
  notes?: string
}): Promise<{
  success: boolean
  journal_id?: string
  error?: string
}> {
  try {
    const supabase = await createClient(await cookies())
    
    // 1. Get adjustment details
    const { data: adjustment } = await supabase
      .from('instructor_adjustments')
      .select('*')
      .eq('id', params.adjustmentId)
      .single()
    
    if (!adjustment) {
      throw new Error('Adjustment not found')
    }
    
    if (adjustment.settlement_status !== 'pending') {
      throw new Error('Adjustment already settled')
    }
    
    // 2. Get wallets
    const instructorWalletId = await getOrCreateWallet('instructor', adjustment.instructor_id)
    const platformWalletId = await getOrCreateWallet('platform', null)
    
    if (!instructorWalletId || !platformWalletId) {
      throw new Error('Failed to get wallets')
    }
    
    // 3. Create settlement journal entries
    const { success, journal_id } = await postJournalEntries(
      'adjustment_settlement',
      params.adjustmentId,
      [
        {
          wallet_id: instructorWalletId,
          amount_cents: adjustment.amount_cents, // Positive for underpayment (credit instructor), negative for overpayment (debit instructor)
          ref_type: 'adjustment_settlement',
          ref_id: params.adjustmentId,
          description: `Adjustment settlement: ${adjustment.adjustment_reason}`,
          metadata: {
            original_flight_session_id: adjustment.original_flight_session_id,
            settlement_method: params.settlementMethod,
            notes: params.notes
          }
        },
        {
          wallet_id: platformWalletId,
          amount_cents: -adjustment.amount_cents, // Opposite of instructor
          ref_type: 'adjustment_settlement',
          ref_id: params.adjustmentId,
          description: `Platform adjustment: ${adjustment.adjustment_reason}`,
          metadata: {
            original_flight_session_id: adjustment.original_flight_session_id,
            settlement_method: params.settlementMethod
          }
        }
      ],
      'USD',
      true
    )
    
    if (!success || !journal_id) {
      throw new Error('Failed to post settlement journal')
    }
    
    // 4. Update adjustment status
    const { error: updateError } = await supabase
      .from('instructor_adjustments')
      .update({
        settlement_status: 'settled',
        settlement_method: params.settlementMethod,
        settlement_journal_id: journal_id,
        settled_at: new Date().toISOString()
      })
      .eq('id', params.adjustmentId)
    
    if (updateError) throw updateError
    
    return {
      success: true,
      journal_id
    }
  } catch (error) {
    console.error('Error settling adjustment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Execute clawback on a transfer (reverse within T+72h window)
 */
export async function executeClawback(params: {
  transferId: string
  clawbackReason: string
  executedBy: string
}): Promise<{
  success: boolean
  clawed_back_amount_cents?: number
  error?: string
}> {
  try {
    const supabase = await createClient(await cookies())
    
    // 1. Get transfer details
    const { data: transfer } = await supabase
      .from('instructor_transfers')
      .select('*')
      .eq('id', params.transferId)
      .single()
    
    if (!transfer) {
      throw new Error('Transfer not found')
    }
    
    if (!transfer.is_clawback_eligible) {
      throw new Error('Transfer is not eligible for clawback')
    }
    
    // 2. Check if still within clawback window
    const now = new Date()
    const clawbackDeadline = new Date(transfer.clawback_window_ends_at)
    
    if (now > clawbackDeadline) {
      throw new Error('Clawback window has expired (T+72h)')
    }
    
    if (transfer.status !== 'paid') {
      throw new Error('Can only claw back paid transfers')
    }
    
    // 3. Create clawback adjustment
    const { data: adjustment } = await supabase
      .from('instructor_adjustments')
      .insert({
        instructor_id: transfer.instructor_id,
        adjustment_type: 'clawback',
        amount_cents: -transfer.amount_cents, // Negative because we're taking money back
        original_flight_session_id: transfer.flight_session_id,
        original_transfer_id: transfer.id,
        adjustment_reason: params.clawbackReason,
        settlement_status: 'pending',
        requires_approval: true, // Clawbacks always require approval
        adjusted_by: params.executedBy
      })
      .select()
      .single()
    
    if (!adjustment) throw new Error('Failed to create clawback adjustment')
    
    // 4. Mark transfer as clawed back
    const { error: updateError } = await supabase
      .from('instructor_transfers')
      .update({
        is_clawback_eligible: false,
        clawback_reason: params.clawbackReason,
        clawed_back_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.transferId)
    
    if (updateError) throw updateError
    
    // 5. Note: Actual Stripe reversal would happen separately via Stripe API
    // This would be handled by an admin action to initiate the reversal
    
    return {
      success: true,
      clawed_back_amount_cents: transfer.amount_cents
    }
  } catch (error) {
    console.error('Error executing clawback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get pending adjustments for an instructor
 */
export async function getInstructorPendingAdjustments(instructorId: string) {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('instructor_adjustments')
    .select('*')
    .eq('instructor_id', instructorId)
    .eq('settlement_status', 'pending')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching pending adjustments:', error)
    return []
  }
  
  return data
}

/**
 * Get all adjustments requiring approval
 */
export async function getAdjustmentsRequiringApproval() {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('instructor_adjustments')
    .select(`
      *,
      profiles!instructor_id(first_name, last_name, email)
    `)
    .eq('requires_approval', true)
    .is('approved_at', null)
    .eq('settlement_status', 'pending')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching adjustments requiring approval:', error)
    return []
  }
  
  return data
}

/**
 * Approve an adjustment
 */
export async function approveAdjustment(params: {
  adjustmentId: string
  approvedBy: string
  approvalNotes?: string
}): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient(await cookies())
    
    const { error } = await supabase
      .from('instructor_adjustments')
      .update({
        approved_by: params.approvedBy,
        approved_at: new Date().toISOString(),
        adjustment_reason: params.approvalNotes 
          ? `${params.approvalNotes}` 
          : undefined
      })
      .eq('id', params.adjustmentId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error approving adjustment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

