"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from 'uuid'

// Service client helper (will be created separately)
async function createServiceClient() {
  // For now, use regular client - will upgrade to service role client
  return await createClient(await cookies())
}

export type WalletType = 'student' | 'instructor' | 'platform' | 'aircraft_owner' | 'liability'

export type LedgerEntry = {
  wallet_id: string
  amount_cents: number
  ref_type: string
  ref_id?: string
  description: string
  metadata?: Record<string, any>
}

/**
 * Core double-entry ledger service
 * FIX: Ensures all transactions balance to zero with transaction-level enforcement
 * FIX: Uses advisory locks for concurrency control on wallet operations
 */
export async function postJournalEntries(
  eventType: string,
  eventId: string,
  entries: LedgerEntry[],
  currency: string = 'USD',
  useServiceRole: boolean = false
): Promise<{ success: boolean; journal_id?: string; error?: string }> {
  const supabase = useServiceRole 
    ? await createServiceClient()
    : await createClient(await cookies())
  
  // Validate: entries must balance to zero
  const totalCents = entries.reduce((sum, e) => sum + e.amount_cents, 0)
  if (totalCents !== 0) {
    return { 
      success: false, 
      error: `Journal entries do not balance. Total: ${totalCents} cents (must be 0)` 
    }
  }
  
  // Validate: all entries exist
  if (entries.length === 0) {
    return { success: false, error: 'Cannot post empty journal' }
  }
  
  const journalId = uuidv4()
  
  try {
    // FIX: Use database function with advisory locks for concurrency control
    const { error: txError } = await supabase.rpc('post_journal_with_locks', {
      p_journal_id: journalId,
      p_event_type: eventType,
      p_event_id: eventId,
      p_currency: currency,
      p_entries: entries
    })
    
    if (txError) throw txError
    
    return { success: true, journal_id: journalId }
  } catch (error) {
    console.error('Error posting journal entries:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get or create a wallet for an owner
 * FIX: Supports liability wallets with subtypes
 */
export async function getOrCreateWallet(
  ownerType: WalletType,
  ownerId: string | null,
  liabilitySubtype?: string
): Promise<string | null> {
  const supabase = await createServiceClient() // Service role to bypass RLS
  
  // Check if wallet exists
  let query = supabase
    .from('wallets')
    .select('id')
    .eq('owner_type', ownerType)
  
  if (ownerId) {
    query = query.eq('owner_id', ownerId)
  } else {
    query = query.is('owner_id', null)
  }
  
  if (liabilitySubtype) {
    query = query.eq('liability_subtype', liabilitySubtype)
  } else {
    query = query.is('liability_subtype', null)
  }
  
  const { data: existing } = await query.single()
  
  if (existing) return existing.id
  
  // Create wallet
  const { data, error } = await supabase
    .from('wallets')
    .insert({
      owner_type: ownerType,
      owner_id: ownerId,
      liability_subtype: liabilitySubtype
    })
    .select('id')
    .single()
  
  if (error) {
    console.error('Error creating wallet:', error)
    return null
  }
  
  return data.id
}

/**
 * Get wallet balance in cents
 */
export async function getWalletBalance(walletId: string): Promise<number> {
  const supabase = await createServiceClient()
  
  const { data } = await supabase
    .from('wallet_balances')
    .select('balance_cents')
    .eq('wallet_id', walletId)
    .single()
  
  return data?.balance_cents || 0
}

/**
 * Get student balance in cents
 */
export async function getStudentBalance(studentId: string): Promise<number> {
  const walletId = await getOrCreateWallet('student', studentId)
  if (!walletId) return 0
  return await getWalletBalance(walletId)
}

/**
 * Get instructor balance in cents
 */
export async function getInstructorBalance(instructorId: string): Promise<number> {
  const walletId = await getOrCreateWallet('instructor', instructorId)
  if (!walletId) return 0
  return await getWalletBalance(walletId)
}

/**
 * Get platform balance in cents
 */
export async function getPlatformBalance(): Promise<number> {
  const walletId = await getOrCreateWallet('platform', null)
  if (!walletId) return 0
  return await getWalletBalance(walletId)
}

/**
 * Get ledger entries for a wallet (transaction history)
 */
export async function getWalletLedgerEntries(
  walletId: string,
  limit: number = 50,
  offset: number = 0
): Promise<any[]> {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('ledger_entries')
    .select(`
      *,
      journals (
        event_type,
        event_id,
        created_at
      )
    `)
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) {
    console.error('Error fetching ledger entries:', error)
    return []
  }
  
  return data || []
}

/**
 * Get journal details with all entries
 */
export async function getJournalDetails(journalId: string): Promise<any | null> {
  const supabase = await createClient(await cookies())
  
  const { data, error } = await supabase
    .from('journals')
    .select(`
      *,
      ledger_entries (
        *,
        wallets (
          owner_type,
          owner_id
        )
      )
    `)
    .eq('id', journalId)
    .single()
  
  if (error) {
    console.error('Error fetching journal:', error)
    return null
  }
  
  return data
}

/**
 * Verify journal balances to zero (for reconciliation)
 */
export async function verifyJournalBalance(journalId: string): Promise<{
  balanced: boolean
  total_cents: number
  entry_count: number
}> {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('amount_cents')
    .eq('journal_id', journalId)
  
  if (error || !data) {
    return { balanced: false, total_cents: 0, entry_count: 0 }
  }
  
  const totalCents = data.reduce((sum, entry) => sum + entry.amount_cents, 0)
  
  return {
    balanced: totalCents === 0,
    total_cents: totalCents,
    entry_count: data.length
  }
}


