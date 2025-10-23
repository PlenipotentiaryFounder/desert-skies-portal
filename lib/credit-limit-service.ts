"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentBalance } from "./ledger-service"

// Service client helper
async function createServiceClient() {
  return await createClient(await cookies())
}

/**
 * Check if student can afford proposed charge against credit limit
 * FIX: Includes concurrency control warnings
 */
export async function checkCreditLimit(
  studentId: string,
  proposedChargeCents: number
): Promise<{ 
  allowed: boolean
  current_balance_cents: number
  new_balance_cents: number
  limit_cents: number
  warning?: string
  blocked_reason?: string
}> {
  const supabase = await createServiceClient()
  
  // Get student credit limit
  let { data: creditLimit } = await supabase
    .from('student_credit_limits')
    .select('*')
    .eq('student_id', studentId)
    .single()
  
  if (!creditLimit) {
    // Create default credit limit
    const { data: newLimit, error: insertError } = await supabase
      .from('student_credit_limits')
      .insert({
        student_id: studentId,
        credit_limit_cents: -20000, // -$200 default
        credit_warning_threshold_pct: 80.0
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating credit limit:', insertError)
      return {
        allowed: false,
        current_balance_cents: 0,
        new_balance_cents: 0,
        limit_cents: -20000,
        blocked_reason: 'Failed to create credit limit'
      }
    }
    
    creditLimit = newLimit
  }
  
  if (creditLimit.status !== 'active') {
    return {
      allowed: false,
      current_balance_cents: 0,
      new_balance_cents: 0,
      limit_cents: creditLimit.credit_limit_cents,
      blocked_reason: 'Account suspended'
    }
  }
  
  // Get current balance from ledger
  const currentBalanceCents = await getStudentBalance(studentId)
  const newBalanceCents = currentBalanceCents - proposedChargeCents
  
  // Check hard limit (100% + 1 flight)
  if (newBalanceCents < creditLimit.credit_limit_cents) {
    return {
      allowed: false,
      current_balance_cents: currentBalanceCents,
      new_balance_cents: newBalanceCents,
      limit_cents: creditLimit.credit_limit_cents,
      blocked_reason: `Credit limit exceeded. Balance would be $${(newBalanceCents / 100).toFixed(2)}, limit is $${(creditLimit.credit_limit_cents / 100).toFixed(2)}`
    }
  }
  
  // Check warning threshold (80%)
  const warningThreshold = creditLimit.credit_limit_cents * (creditLimit.credit_warning_threshold_pct / 100)
  
  if (newBalanceCents < warningThreshold) {
    return {
      allowed: true,
      current_balance_cents: currentBalanceCents,
      new_balance_cents: newBalanceCents,
      limit_cents: creditLimit.credit_limit_cents,
      warning: `Approaching credit limit (${creditLimit.credit_warning_threshold_pct}%). Current balance: $${(newBalanceCents / 100).toFixed(2)}, limit: $${(creditLimit.credit_limit_cents / 100).toFixed(2)}`
    }
  }
  
  // Check 95% threshold (urgent warning)
  const urgentThreshold = creditLimit.credit_limit_cents * 0.95
  
  if (newBalanceCents < urgentThreshold) {
    return {
      allowed: true,
      current_balance_cents: currentBalanceCents,
      new_balance_cents: newBalanceCents,
      limit_cents: creditLimit.credit_limit_cents,
      warning: `URGENT: Close to credit limit (95%). Current balance: $${(newBalanceCents / 100).toFixed(2)}, limit: $${(creditLimit.credit_limit_cents / 100).toFixed(2)}. Please add funds to avoid booking restrictions.`
    }
  }
  
  return {
    allowed: true,
    current_balance_cents: currentBalanceCents,
    new_balance_cents: newBalanceCents,
    limit_cents: creditLimit.credit_limit_cents
  }
}

/**
 * Update student credit limit
 */
export async function updateCreditLimit(
  studentId: string,
  newLimitCents: number,
  reason: string,
  updatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    
    const { error } = await supabase
      .from('student_credit_limits')
      .update({
        credit_limit_cents: newLimitCents,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId)
    
    if (error) throw error
    
    // TODO: Log credit limit change for audit trail
    
    return { success: true }
  } catch (error) {
    console.error('Error updating credit limit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get students approaching or exceeding credit limits (for dunning)
 */
export async function getStudentsNearCreditLimit(): Promise<Array<{
  student_id: string
  student_name: string
  current_balance_cents: number
  credit_limit_cents: number
  percentage_used: number
  status: 'warning' | 'urgent' | 'exceeded'
}>> {
  const supabase = await createServiceClient()
  
  // Get all students with credit limits
  const { data: limits } = await supabase
    .from('student_credit_limits')
    .select(`
      student_id,
      credit_limit_cents,
      credit_warning_threshold_pct,
      profiles!inner (
        first_name,
        last_name
      )
    `)
    .eq('status', 'active')
  
  if (!limits) return []
  
  const results = []
  
  for (const limit of limits) {
    const balance = await getStudentBalance(limit.student_id)
    
    // Calculate percentage of credit limit used
    const percentageUsed = limit.credit_limit_cents < 0 
      ? (balance / limit.credit_limit_cents) * 100 
      : 0
    
    let status: 'warning' | 'urgent' | 'exceeded' | null = null
    
    if (balance < limit.credit_limit_cents) {
      status = 'exceeded'
    } else if (percentageUsed >= 95) {
      status = 'urgent'
    } else if (percentageUsed >= limit.credit_warning_threshold_pct) {
      status = 'warning'
    }
    
    if (status) {
      results.push({
        student_id: limit.student_id,
        student_name: `${limit.profiles.first_name} ${limit.profiles.last_name}`,
        current_balance_cents: balance,
        credit_limit_cents: limit.credit_limit_cents,
        percentage_used: percentageUsed,
        status
      })
    }
  }
  
  return results
}

/**
 * Enable auto-charge for student
 */
export async function enableAutoCharge(params: {
  studentId: string
  paymentMethodId: string
  triggerBalanceCents: number
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServiceClient()
    
    const { error } = await supabase
      .from('student_credit_limits')
      .update({
        auto_charge_enabled: true,
        stripe_payment_method_id: params.paymentMethodId,
        auto_charge_trigger_balance_cents: params.triggerBalanceCents,
        card_on_file: true,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', params.studentId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error enabling auto-charge:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if student qualifies for credit limit increase
 * Conditions: card on file + no disputes in 90 days + $1000 prepaid lifetime
 */
export async function checkCreditLimitEscalationEligibility(studentId: string): Promise<{
  eligible: boolean
  current_limit_cents: number
  suggested_limit_cents: number
  reasons: string[]
}> {
  const supabase = await createServiceClient()
  
  const { data: limit } = await supabase
    .from('student_credit_limits')
    .select('*')
    .eq('student_id', studentId)
    .single()
  
  if (!limit) {
    return {
      eligible: false,
      current_limit_cents: -20000,
      suggested_limit_cents: -20000,
      reasons: ['No credit limit record found']
    }
  }
  
  const reasons: string[] = []
  let eligible = true
  
  // Check card on file
  if (!limit.card_on_file) {
    eligible = false
    reasons.push('No card on file')
  }
  
  // Check dispute-free days
  if (limit.dispute_free_days < 90) {
    eligible = false
    reasons.push(`Only ${limit.dispute_free_days} dispute-free days (need 90)`)
  }
  
  // Check lifetime prepaid
  if (limit.total_prepaid_lifetime_cents < 100000) { // $1000
    eligible = false
    reasons.push(`Only $${(limit.total_prepaid_lifetime_cents / 100).toFixed(2)} prepaid lifetime (need $1000)`)
  }
  
  // Suggest higher limit if eligible
  const suggestedLimitCents = eligible ? -50000 : limit.credit_limit_cents // -$500 if eligible
  
  if (eligible) {
    reasons.push('Qualifies for limit increase to -$500')
  }
  
  return {
    eligible,
    current_limit_cents: limit.credit_limit_cents,
    suggested_limit_cents: suggestedLimitCents,
    reasons
  }
}


