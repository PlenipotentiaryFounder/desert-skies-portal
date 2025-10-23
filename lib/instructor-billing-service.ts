"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export type StudentInstructorRate = {
  id: string
  student_id: string
  instructor_id: string
  flight_instruction_rate: number
  ground_instruction_rate: number
  effective_date: string
  is_active: boolean
  notes?: string
  student?: {
    first_name: string
    last_name: string
    email: string
  }
  instructor?: {
    first_name: string
    last_name: string
    email: string
  }
}

export type StudentInstructorAccount = {
  id: string
  student_id: string
  instructor_id: string
  // Flexible account balance that can be used for any instruction type
  account_balance: number
  // Legacy fields for backward compatibility (will be deprecated)
  prepaid_flight_hours: number
  prepaid_ground_hours: number
  // New flexible system: total hours available (calculated from balance)
  available_hours: number
  auto_charge_enabled: boolean
  low_balance_threshold: number
  status: 'active' | 'suspended' | 'closed'
  // Account preferences
  account_type: 'flexible' | 'hours_only' | 'legacy'
  student?: {
    first_name: string
    last_name: string
    email: string
  }
  instructor?: {
    first_name: string
    last_name: string
    email: string
  }
}

export type FlightSessionBilling = {
  id: string
  flight_session_id: string
  student_id: string
  instructor_id: string
  flight_hours: number
  prebrief_hours: number
  postbrief_hours: number
  flight_instruction_rate: number
  ground_instruction_rate: number
  flight_cost: number
  ground_cost: number
  total_cost: number
  billing_status: 'pending' | 'invoiced' | 'paid'
  payment_method?: string
  instructor_approved: boolean
  student_acknowledged: boolean
  paid_at?: string
  flight_session?: {
    date: string
    lesson?: { title: string }
    custom_lesson?: { name: string }
  }
}

export type InstructorBillingTransaction = {
  id: string
  created_at: string
  student_id: string
  instructor_id: string
  transaction_type: 'flight_debit' | 'ground_debit' | 'cash_credit' | 'hours_credit' | 'refund' | 'adjustment'
  flight_hours: number
  ground_hours: number
  cash_amount: number
  description: string
  reference_type?: string
  reference_id?: string
  flight_hours_balance_after: number
  ground_hours_balance_after: number
  cash_balance_after: number
}

export type InstructorInvoice = {
  id: string
  invoice_number: string
  student_id: string
  instructor_id: string
  flight_hours: number
  ground_hours: number
  flight_rate: number
  ground_rate: number
  flight_amount: number
  ground_amount: number
  total_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  paid_date?: string
  payment_method?: string
  stripe_payment_intent_id?: string
  notes?: string
  student?: {
    first_name: string
    last_name: string
    email: string
  }
  instructor?: {
    first_name: string
    last_name: string
    email: string
  }
  line_items?: InstructorInvoiceItem[]
}

export type InstructorInvoiceItem = {
  id: string
  description: string
  item_type: 'flight_instruction' | 'ground_instruction' | 'prebrief' | 'postbrief'
  hours: number
  rate: number
  amount: number
  date: string
  flight_session_id?: string
}

export type InstructorHoursPurchase = {
  id: string
  created_at: string
  student_id: string
  instructor_id: string
  flight_hours_purchased: number
  ground_hours_purchased: number
  flight_rate: number
  ground_rate: number
  total_amount: number
  payment_method: string
  stripe_payment_intent_id?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  expires_at?: string
  notes?: string
}

export type LessonCostEstimate = {
  id: string
  lesson_id: string
  estimated_flight_hours: number
  estimated_ground_hours: number
  estimated_total_cost: number
  notes?: string
  lesson?: {
    title: string
    description: string
  }
}

// Student-Instructor Rate Management
export async function getStudentInstructorRates(
  studentId?: string, 
  instructorId?: string,
  filters?: { is_active?: boolean }
): Promise<StudentInstructorRate[]> {
  const supabase = await createClient(await cookies())
  
  let query = supabase
    .from('student_instructor_rates')
    .select(`
      *,
      student:student_id(first_name, last_name, email),
      instructor:instructor_id(first_name, last_name, email)
    `)
    .order('effective_date', { ascending: false })

  if (studentId) query = query.eq('student_id', studentId)
  if (instructorId) query = query.eq('instructor_id', instructorId)
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching student instructor rates:', error)
    throw new Error('Failed to fetch instructor rates')
  }

  return data as StudentInstructorRate[]
}

export async function createStudentInstructorRate(rate: Omit<StudentInstructorRate, 'id'>): Promise<StudentInstructorRate> {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('student_instructor_rates')
    .insert(rate)
    .select(`
      *,
      student:student_id(first_name, last_name, email),
      instructor:instructor_id(first_name, last_name, email)
    `)
    .single()

  if (error) {
    console.error('Error creating instructor rate:', error)
    throw new Error('Failed to create instructor rate')
  }

  return data as StudentInstructorRate
}

export async function updateStudentInstructorRate(
  id: string, 
  updates: Partial<StudentInstructorRate>
): Promise<StudentInstructorRate> {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('student_instructor_rates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      student:student_id(first_name, last_name, email),
      instructor:instructor_id(first_name, last_name, email)
    `)
    .single()

  if (error) {
    console.error('Error updating instructor rate:', error)
    throw new Error('Failed to update instructor rate')
  }

  return data as StudentInstructorRate
}

// Student-Instructor Account Management
export async function getStudentInstructorAccount(
  studentId: string,
  instructorId: string
): Promise<StudentInstructorAccount | null> {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('student_instructor_accounts')
    .select(`
      *,
      student:student_id(first_name, last_name, email),
      instructor:instructor_id(first_name, last_name, email)
    `)
    .eq('student_id', studentId)
    .eq('instructor_id', instructorId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No account exists, create one with flexible system as default
      return await createStudentInstructorAccount(studentId, instructorId, 'flexible')
    }
    console.error('Error fetching student instructor account:', error)
    throw new Error('Failed to fetch instructor account')
  }

  return data as StudentInstructorAccount
}

export async function createStudentInstructorAccount(
  studentId: string,
  instructorId: string,
  accountType: 'flexible' | 'hours_only' | 'legacy' = 'flexible'
): Promise<StudentInstructorAccount> {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('student_instructor_accounts')
    .insert({
      student_id: studentId,
      instructor_id: instructorId,
      prepaid_flight_hours: 0.0,
      prepaid_ground_hours: 0.0,
      account_balance: 0.00,
      available_hours: 0.0,
      account_type: accountType,
      low_balance_threshold: 50.00
    })
    .select(`
      *,
      student:student_id(first_name, last_name, email),
      instructor:instructor_id(first_name, last_name, email)
    `)
    .single()

  if (error) {
    console.error('Error creating student instructor account:', error)
    throw new Error('Failed to create instructor account')
  }

  return data as StudentInstructorAccount
}

// Flight Session Billing
export async function getFlightSessionBilling(
  sessionId?: string,
  studentId?: string,
  instructorId?: string,
  filters?: { billing_status?: string }
): Promise<FlightSessionBilling[]> {
  const supabase = await createClient(await cookies())

  let query = supabase
    .from('flight_session_billing')
    .select('*')
    .order('created_at', { ascending: false })

  if (sessionId) query = query.eq('flight_session_id', sessionId)
  if (studentId) query = query.eq('student_id', studentId)
  if (instructorId) query = query.eq('instructor_id', instructorId)
  if (filters?.billing_status) query = query.eq('billing_status', filters.billing_status)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching flight session billing:', error)
    throw new Error('Failed to fetch session billing')
  }

  return data as FlightSessionBilling[]
}

export async function approveFlightSessionBilling(
  billingId: string,
  instructorId: string
): Promise<void> {
  const supabase = await createClient(await cookies())

  const { error } = await supabase
    .from('flight_session_billing')
    .update({
      instructor_approved: true,
      instructor_approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', billingId)
    .eq('instructor_id', instructorId)

  if (error) {
    console.error('Error approving flight session billing:', error)
    throw new Error('Failed to approve session billing')
  }
}

export async function acknowledgeFlightSessionBilling(
  billingId: string,
  studentId: string
): Promise<void> {
  const supabase = await createClient(await cookies())

  const { error } = await supabase
    .from('flight_session_billing')
    .update({
      student_acknowledged: true,
      student_acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', billingId)
    .eq('student_id', studentId)

  if (error) {
    console.error('Error acknowledging flight session billing:', error)
    throw new Error('Failed to acknowledge session billing')
  }
}

// Billing Transactions
export async function addInstructorBillingTransaction(
  studentId: string,
  instructorId: string,
  transactionType: InstructorBillingTransaction['transaction_type'],
  flightHours: number = 0,
  groundHours: number = 0,
  cashAmount: number = 0,
  description: string,
  referenceType?: string,
  referenceId?: string,
  processedBy?: string
): Promise<InstructorBillingTransaction> {
  const supabase = await createClient(await cookies())

  // Get current account balances
  const account = await getStudentInstructorAccount(studentId, instructorId)
  if (!account) {
    throw new Error('Student instructor account not found')
  }

  // Calculate new balances
  let newFlightHours = account.prepaid_flight_hours
  let newGroundHours = account.prepaid_ground_hours
  let newCashBalance = account.account_balance

  switch (transactionType) {
    case 'flight_debit':
      newFlightHours -= flightHours
      break
    case 'ground_debit':
      newGroundHours -= groundHours
      break
    case 'cash_credit':
      newCashBalance += cashAmount
      break
    case 'hours_credit':
      newFlightHours += flightHours
      newGroundHours += groundHours
      break
  }

  // Record transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('instructor_billing_transactions')
    .insert({
      student_id: studentId,
      instructor_id: instructorId,
      transaction_type: transactionType,
      flight_hours: flightHours,
      ground_hours: groundHours,
      cash_amount: cashAmount,
      description,
      reference_type: referenceType,
      reference_id: referenceId,
      flight_hours_balance_after: newFlightHours,
      ground_hours_balance_after: newGroundHours,
      cash_balance_after: newCashBalance,
      processed_by: processedBy
    })
    .select()
    .single()

  if (transactionError) {
    console.error('Error recording transaction:', transactionError)
    throw new Error('Failed to record transaction')
  }

  // Update account balances
  const { error: updateError } = await supabase
    .from('student_instructor_accounts')
    .update({
      prepaid_flight_hours: newFlightHours,
      prepaid_ground_hours: newGroundHours,
      account_balance: newCashBalance,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId)
    .eq('instructor_id', instructorId)

  if (updateError) {
    console.error('Error updating account balances:', updateError)
    throw new Error('Failed to update account balances')
  }

  return transaction as InstructorBillingTransaction
}

// Invoice Management
export async function createInstructorInvoiceFromSessions(
  studentId: string,
  instructorId: string,
  sessionIds: string[],
  dueDate: string,
  notes?: string
): Promise<InstructorInvoice> {
  const supabase = await createClient(await cookies())

  // Get session billing records
  const { data: billingRecords, error: billingError } = await supabase
    .from('flight_session_billing')
    .select(`
      *,
      flight_sessions(date, syllabus_lessons(title), custom_lessons(name))
    `)
    .in('flight_session_id', sessionIds)
    .eq('student_id', studentId)
    .eq('instructor_id', instructorId)
    .eq('billing_status', 'pending')

  if (billingError) {
    throw new Error('Failed to fetch session billing records')
  }

  if (!billingRecords || billingRecords.length === 0) {
    throw new Error('No unbilled sessions found')
  }

  // Calculate totals
  const totalFlightHours = billingRecords.reduce((sum, record) => sum + record.flight_hours, 0)
  const totalGroundHours = billingRecords.reduce((sum, record) => sum + (record.prebrief_hours + record.postbrief_hours), 0)
  const flightRate = billingRecords[0].flight_instruction_rate // Assuming same rate for all sessions
  const groundRate = billingRecords[0].ground_instruction_rate
  const flightAmount = totalFlightHours * flightRate
  const groundAmount = totalGroundHours * groundRate
  const totalAmount = flightAmount + groundAmount

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('instructor_invoices')
    .insert({
      invoice_number: invoiceNumber,
      student_id: studentId,
      instructor_id: instructorId,
      flight_hours: totalFlightHours,
      ground_hours: totalGroundHours,
      flight_rate: flightRate,
      ground_rate: groundRate,
      flight_amount: flightAmount,
      ground_amount: groundAmount,
      total_amount: totalAmount,
      due_date: dueDate,
      notes: notes,
      status: 'draft'
    })
    .select()
    .single()

  if (invoiceError) {
    throw new Error('Failed to create invoice')
  }

  // Create line items
  const lineItems = billingRecords.flatMap(record => {
    const items = []
    
    if (record.flight_hours > 0) {
      items.push({
        invoice_id: invoice.id,
        flight_session_id: record.flight_session_id,
        description: `Flight Instruction - ${record.flight_session?.syllabus_lessons?.title || record.flight_session?.custom_lessons?.name || 'Training Session'}`,
        item_type: 'flight_instruction' as const,
        hours: record.flight_hours,
        rate: record.flight_instruction_rate,
        amount: record.flight_cost,
        date: record.flight_session?.date || new Date().toISOString().split('T')[0]
      })
    }

    if (record.prebrief_hours > 0) {
      items.push({
        invoice_id: invoice.id,
        flight_session_id: record.flight_session_id,
        description: `Pre-brief - ${record.flight_session?.syllabus_lessons?.title || record.flight_session?.custom_lessons?.name || 'Training Session'}`,
        item_type: 'prebrief' as const,
        hours: record.prebrief_hours,
        rate: record.ground_instruction_rate,
        amount: record.prebrief_hours * record.ground_instruction_rate,
        date: record.flight_session?.date || new Date().toISOString().split('T')[0]
      })
    }

    if (record.postbrief_hours > 0) {
      items.push({
        invoice_id: invoice.id,
        flight_session_id: record.flight_session_id,
        description: `Post-brief - ${record.flight_session?.syllabus_lessons?.title || record.flight_session?.custom_lessons?.name || 'Training Session'}`,
        item_type: 'postbrief' as const,
        hours: record.postbrief_hours,
        rate: record.ground_instruction_rate,
        amount: record.postbrief_hours * record.ground_instruction_rate,
        date: record.flight_session?.date || new Date().toISOString().split('T')[0]
      })
    }

    return items
  })

  const { error: lineItemsError } = await supabase
    .from('instructor_invoice_items')
    .insert(lineItems)

  if (lineItemsError) {
    throw new Error('Failed to create invoice line items')
  }

  // Update session billing status
  const { error: updateBillingError } = await supabase
    .from('flight_session_billing')
    .update({ 
      billing_status: 'invoiced',
      invoice_id: invoice.id,
      updated_at: new Date().toISOString()
    })
    .in('flight_session_id', sessionIds)

  if (updateBillingError) {
    throw new Error('Failed to update session billing status')
  }

  return invoice as InstructorInvoice
}

export async function getInstructorInvoices(
  studentId?: string,
  instructorId?: string,
  filters?: { status?: string }
): Promise<InstructorInvoice[]> {
  const supabase = await createClient(await cookies())

  let query = supabase
    .from('instructor_invoices')
    .select(`
      *,
      student:student_id(first_name, last_name, email),
      instructor:instructor_id(first_name, last_name, email),
      instructor_invoice_items(*)
    `)
    .order('created_at', { ascending: false })

  if (studentId) query = query.eq('student_id', studentId)
  if (instructorId) query = query.eq('instructor_id', instructorId)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching instructor invoices:', error)
    throw new Error('Failed to fetch invoices')
  }

  return data as InstructorInvoice[]
}

// Flexible Account System Functions

/**
 * Calculate available hours from account balance using current rates
 */
export async function calculateAvailableHours(
  studentId: string,
  instructorId: string
): Promise<{ flight_hours: number, ground_hours: number, total_hours: number }> {
  const supabase = await createClient(await cookies())

  const account = await getStudentInstructorAccount(studentId, instructorId)
  if (!account) {
    return { flight_hours: 0, ground_hours: 0, total_hours: 0 }
  }

  // Get current rates
  const rates = await getStudentInstructorRates(studentId, instructorId, { is_active: true })
  if (!rates || rates.length === 0) {
    return { flight_hours: 0, ground_hours: 0, total_hours: 0 }
  }

  const currentRate = rates[0]

  // For flexible accounts, calculate hours from balance
  if (account.account_type === 'flexible') {
    // Convert account balance to hours (assuming equal rate for simplicity)
    // In a more sophisticated system, this could be weighted differently
    const avgRate = (currentRate.flight_instruction_rate + currentRate.ground_instruction_rate) / 2
    const totalHours = account.account_balance / avgRate

    // Split evenly between flight and ground for flexibility
    return {
      flight_hours: totalHours / 2,
      ground_hours: totalHours / 2,
      total_hours: totalHours
    }
  }

  // For legacy accounts, use the old system
  return {
    flight_hours: account.prepaid_flight_hours,
    ground_hours: account.prepaid_ground_hours,
    total_hours: account.prepaid_flight_hours + account.prepaid_ground_hours
  }
}

/**
 * Add funds to account (flexible system)
 */
export async function addAccountFunds(
  studentId: string,
  instructorId: string,
  amount: number,
  paymentMethod: string,
  description: string,
  processedBy?: string
): Promise<{ success: boolean, transaction_id?: string }> {
  const supabase = await createClient(await cookies())

  // Record the payment transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('instructor_billing_transactions')
    .insert({
      student_id: studentId,
      instructor_id: instructorId,
      transaction_type: 'cash_credit',
      cash_amount: amount,
      description,
      processed_by: processedBy
    })
    .select()
    .single()

  if (transactionError) {
    console.error('Error recording fund addition:', transactionError)
    return { success: false }
  }

  // Update account balance
  const account = await getStudentInstructorAccount(studentId, instructorId)
  if (!account) {
    return { success: false }
  }

  const newBalance = account.account_balance + amount
  const { error: updateError } = await supabase
    .from('student_instructor_accounts')
    .update({
      account_balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId)
    .eq('instructor_id', instructorId)

  if (updateError) {
    console.error('Error updating account balance:', updateError)
    return { success: false }
  }

  return { success: true, transaction_id: transaction.id }
}

/**
 * Process flexible payment from account balance
 */
export async function processFlexiblePayment(
  studentId: string,
  instructorId: string,
  flightHours: number,
  groundHours: number,
  description: string
): Promise<{ success: boolean, amount_deducted: number, remaining_balance: number }> {
  const supabase = await createClient(await cookies())

  // Get current rates
  const rates = await getStudentInstructorRates(studentId, instructorId, { is_active: true })
  if (!rates || rates.length === 0) {
    return { success: false, amount_deducted: 0, remaining_balance: 0 }
  }

  const currentRate = rates[0]
  const flightCost = flightHours * currentRate.flight_instruction_rate
  const groundCost = groundHours * currentRate.ground_instruction_rate
  const totalCost = flightCost + groundCost

  // Get current account
  const account = await getStudentInstructorAccount(studentId, instructorId)
  if (!account) {
    return { success: false, amount_deducted: 0, remaining_balance: 0 }
  }

  if (account.account_balance < totalCost) {
    return { success: false, amount_deducted: 0, remaining_balance: account.account_balance }
  }

  // Deduct from account balance
  const newBalance = account.account_balance - totalCost
  const { error: updateError } = await supabase
    .from('student_instructor_accounts')
    .update({
      account_balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId)
    .eq('instructor_id', instructorId)

  if (updateError) {
    console.error('Error updating account balance:', updateError)
    return { success: false, amount_deducted: 0, remaining_balance: account.account_balance }
  }

  // Record the transaction
  const { error: transactionError } = await supabase
    .from('instructor_billing_transactions')
    .insert({
      student_id: studentId,
      instructor_id: instructorId,
      transaction_type: 'flight_debit',
      flight_hours: flightHours,
      ground_hours: groundHours,
      cash_amount: totalCost,
      description,
      flight_hours_balance_after: 0, // Legacy field
      ground_hours_balance_after: 0, // Legacy field
      cash_balance_after: newBalance
    })

  if (transactionError) {
    console.error('Error recording payment transaction:', transactionError)
  }

  return {
    success: true,
    amount_deducted: totalCost,
    remaining_balance: newBalance
  }
}

// Hours Purchase Management (Legacy system)
export async function purchaseInstructorHours(
  studentId: string,
  instructorId: string,
  flightHours: number,
  groundHours: number,
  paymentMethod: string,
  stripePaymentIntentId?: string,
  expiresAt?: string
): Promise<InstructorHoursPurchase> {
  const supabase = await createClient(await cookies())

  // Get current rates
  const rates = await getStudentInstructorRates(studentId, instructorId, { is_active: true })
  if (!rates || rates.length === 0) {
    throw new Error('No active instructor rates found')
  }

  const currentRate = rates[0]
  const totalAmount = (flightHours * currentRate.flight_instruction_rate) + (groundHours * currentRate.ground_instruction_rate)

  // Create purchase record
  const { data: purchase, error: purchaseError } = await supabase
    .from('instructor_hours_purchases')
    .insert({
      student_id: studentId,
      instructor_id: instructorId,
      flight_hours_purchased: flightHours,
      ground_hours_purchased: groundHours,
      flight_rate: currentRate.flight_instruction_rate,
      ground_rate: currentRate.ground_instruction_rate,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      stripe_payment_intent_id: stripePaymentIntentId,
      expires_at: expiresAt,
      status: 'completed'
    })
    .select()
    .single()

  if (purchaseError) {
    console.error('Error creating hours purchase:', purchaseError)
    throw new Error('Failed to create hours purchase')
  }

  // Add hours to account (legacy system)
  await addInstructorBillingTransaction(
    studentId,
    instructorId,
    'hours_credit',
    flightHours,
    groundHours,
    0,
    `Purchased ${flightHours} flight hours + ${groundHours} ground hours`,
    'purchase',
    purchase.id
  )

  return purchase as InstructorHoursPurchase
}

// Flight Session Adjustment System

/**
 * Adjust a completed flight session and handle billing corrections
 */
export async function adjustFlightSession(
  sessionId: string,
  newFlightHours: number,
  newGroundHours: number,
  adjustmentReason: string,
  processedBy: string
): Promise<{
  success: boolean,
  adjustments: {
    flight_hours_diff: number,
    ground_hours_diff: number,
    amount_diff: number,
    refund_amount?: number,
    additional_charge?: number
  }
}> {
  const supabase = await createClient(await cookies())

  // Get the original flight session
  const { data: session, error: sessionError } = await supabase
    .from('flight_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    throw new Error('Flight session not found')
  }

  if (session.status !== 'completed') {
    throw new Error('Can only adjust completed flight sessions')
  }

  // Get the associated billing record
  const { data: billingRecord, error: billingError } = await supabase
    .from('flight_session_billing')
    .select('*')
    .eq('flight_session_id', sessionId)
    .single()

  if (billingError || !billingRecord) {
    throw new Error('No billing record found for this session')
  }

  // Get current rates
  const rates = await getStudentInstructorRates(session.student_id, session.instructor_id, { is_active: true })
  if (!rates || rates.length === 0) {
    throw new Error('No active instructor rates found')
  }

  const currentRate = rates[0]

  // Calculate cost differences
  const originalFlightCost = billingRecord.flight_hours * currentRate.flight_instruction_rate
  const originalGroundCost = (billingRecord.prebrief_hours + billingRecord.postbrief_hours) * currentRate.ground_instruction_rate
  const originalTotalCost = originalFlightCost + originalGroundCost

  const newFlightCost = newFlightHours * currentRate.flight_instruction_rate
  const newGroundCost = newGroundHours * currentRate.ground_instruction_rate
  const newTotalCost = newFlightCost + newGroundCost

  const amountDiff = newTotalCost - originalTotalCost

  const adjustments = {
    flight_hours_diff: newFlightHours - billingRecord.flight_hours,
    ground_hours_diff: newGroundHours - (billingRecord.prebrief_hours + billingRecord.postbrief_hours),
    amount_diff: amountDiff,
    refund_amount: amountDiff < 0 ? Math.abs(amountDiff) : undefined,
    additional_charge: amountDiff > 0 ? amountDiff : undefined
  }

  // Update the billing record
  const { error: updateBillingError } = await supabase
    .from('flight_session_billing')
    .update({
      flight_hours: newFlightHours,
      prebrief_hours: newGroundHours, // Assuming ground hours are split between pre/post brief
      postbrief_hours: 0, // For simplicity, putting all ground hours in prebrief
      total_cost: newTotalCost,
      updated_at: new Date().toISOString()
    })
    .eq('id', billingRecord.id)

  if (updateBillingError) {
    throw new Error('Failed to update billing record')
  }

  // Handle account balance adjustments
  if (amountDiff !== 0) {
    const account = await getStudentInstructorAccount(session.student_id, session.instructor_id)
    if (!account) {
      throw new Error('Student account not found')
    }

    let newBalance = account.account_balance

    if (amountDiff < 0) {
      // Refund (credit to account)
      newBalance += Math.abs(amountDiff)
    } else {
      // Additional charge (debit from account)
      newBalance -= amountDiff
    }

    // Update account balance
    const { error: balanceUpdateError } = await supabase
      .from('student_instructor_accounts')
      .update({
        account_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', session.student_id)
      .eq('instructor_id', session.instructor_id)

    if (balanceUpdateError) {
      throw new Error('Failed to update account balance')
    }

    // Record adjustment transaction
    const { error: transactionError } = await supabase
      .from('instructor_billing_transactions')
      .insert({
        student_id: session.student_id,
        instructor_id: session.instructor_id,
        transaction_type: amountDiff < 0 ? 'refund' : 'adjustment',
        cash_amount: Math.abs(amountDiff),
        description: `Session adjustment: ${adjustmentReason}`,
        reference_type: 'session_adjustment',
        reference_id: sessionId,
        flight_hours_balance_after: 0,
        ground_hours_balance_after: 0,
        cash_balance_after: newBalance,
        processed_by: processedBy
      })

    if (transactionError) {
      console.error('Error recording adjustment transaction:', transactionError)
    }
  }

  return { success: true, adjustments }
}

/**
 * Get adjustment history for a flight session
 */
export async function getSessionAdjustments(sessionId: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('instructor_billing_transactions')
    .select('*')
    .eq('reference_type', 'session_adjustment')
    .eq('reference_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching session adjustments:', error)
    return []
  }

  return data
}

// Lesson Cost Estimates
export async function getLessonCostEstimates(lessonId?: string): Promise<LessonCostEstimate[]> {
  const supabase = await createClient(await cookies())

  let query = supabase
    .from('lesson_cost_estimates')
    .select(`
      *,
      syllabus_lessons(title, description)
    `)

  if (lessonId) query = query.eq('lesson_id', lessonId)

  const { data, error} = await query

  if (error) {
    console.error('Error fetching lesson cost estimates:', error)
    throw new Error('Failed to fetch lesson estimates')
  }

  return data as LessonCostEstimate[]
}

// ========================================
// ENHANCED BILLING WITH LEDGER INTEGRATION  
// ========================================

import { getOrCreateWallet, postJournalEntries } from './ledger-service'
import { enqueueInstructorTransfer } from './stripe-connect-service'

/**
 * Process complete flight billing with margin calculation and ledger entries
 * This is the NEW billing system that integrates with the double-entry ledger
 */
export async function processFlightCompletionBilling(params: {
  flightSessionId: string
  studentId: string
  instructorId: string
  flightHours: number
  groundHours: number
  isInstantPayout?: boolean
}): Promise<{ 
  success: boolean
  margin_cents?: number
  student_charge_cents?: number
  instructor_payout_cents?: number
  journal_id?: string
  error?: string 
}> {
  const supabase = await createClient(await cookies())
  
  try {
    // 1. Get student billing rate
    const { data: studentRate } = await supabase
      .from('student_instructor_rates')
      .select('flight_instruction_rate, ground_instruction_rate')
      .eq('student_id', params.studentId)
      .eq('instructor_id', params.instructorId)
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()
    
    if (!studentRate) {
      throw new Error('No active billing rate found for student')
    }
    
    // 2. Get instructor payout rate
    const { data: payoutRate } = await supabase
      .from('instructor_payout_rates')
      .select('flight_instruction_payout_cents, ground_instruction_payout_cents, instant_payout_enabled, instant_payout_fee_covered_by_dsa')
      .eq('instructor_id', params.instructorId)
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()
    
    if (!payoutRate) {
      throw new Error('No active payout rate found for instructor')
    }
    
    // 3. Calculate amounts in cents
    const studentFlightChargeCents = Math.round(params.flightHours * studentRate.flight_instruction_rate * 100)
    const studentGroundChargeCents = Math.round(params.groundHours * studentRate.ground_instruction_rate * 100)
    const studentTotalCents = studentFlightChargeCents + studentGroundChargeCents
    
    const instructorFlightPayoutCents = Math.round(params.flightHours * (payoutRate.flight_instruction_payout_cents / 100) * 100)
    const instructorGroundPayoutCents = Math.round(params.groundHours * (payoutRate.ground_instruction_payout_cents / 100) * 100)
    const instructorTotalCents = instructorFlightPayoutCents + instructorGroundPayoutCents
    
    const marginCents = studentTotalCents - instructorTotalCents
    
    // 4. Get/create wallets
    const studentWalletId = await getOrCreateWallet('student', params.studentId)
    const instructorWalletId = await getOrCreateWallet('instructor', params.instructorId)
    const platformWalletId = await getOrCreateWallet('platform', null)
    
    if (!studentWalletId || !instructorWalletId || !platformWalletId) {
      throw new Error('Failed to create wallets')
    }
    
    // 5. Post double-entry ledger (three-way split)
    const { success: ledgerSuccess, journal_id } = await postJournalEntries(
      'flight_completion',
      params.flightSessionId,
      [
        // Student pays (debit)
        {
          wallet_id: studentWalletId,
          amount_cents: -studentTotalCents,
          ref_type: 'flight_completion',
          ref_id: params.flightSessionId,
          description: `Flight instruction ${params.flightHours}hr + ground ${params.groundHours}hr`,
          metadata: {
            flight_hours: params.flightHours,
            ground_hours: params.groundHours,
            student_rate_flight: studentRate.flight_instruction_rate,
            student_rate_ground: studentRate.ground_instruction_rate
          }
        },
        // Instructor receives (credit)
        {
          wallet_id: instructorWalletId,
          amount_cents: instructorTotalCents,
          ref_type: 'flight_completion',
          ref_id: params.flightSessionId,
          description: `Flight instruction payout ${params.flightHours}hr + ground ${params.groundHours}hr`,
          metadata: {
            flight_hours: params.flightHours,
            ground_hours: params.groundHours,
            payout_rate_flight_cents: payoutRate.flight_instruction_payout_cents,
            payout_rate_ground_cents: payoutRate.ground_instruction_payout_cents
          }
        },
        // Platform margin (credit)
        {
          wallet_id: platformWalletId,
          amount_cents: marginCents,
          ref_type: 'platform_margin',
          ref_id: params.flightSessionId,
          description: `Platform margin on flight ${params.flightSessionId}`,
          metadata: {
            student_charge: studentTotalCents,
            instructor_payout: instructorTotalCents,
            margin: marginCents
          }
        }
      ],
      'USD',
      true // Use service role for ledger operations
    )
    
    if (!ledgerSuccess || !journal_id) {
      throw new Error('Failed to post ledger entries')
    }
    
    // 6. Enqueue instructor transfer (outbox pattern for idempotency)
    const { success: transferSuccess, outbox_id } = await enqueueInstructorTransfer({
      instructorId: params.instructorId,
      amountCents: instructorTotalCents,
      flightSessionId: params.flightSessionId,
      journalId: journal_id,
      isInstantPayout: params.isInstantPayout || false,
      instantFeeChargeToDSA: payoutRate.instant_payout_fee_covered_by_dsa
    })
    
    if (!transferSuccess) {
      console.error('Transfer enqueue failed but ledger posted - will retry via background job')
    }
    
    return {
      success: true,
      margin_cents: marginCents,
      student_charge_cents: studentTotalCents,
      instructor_payout_cents: instructorTotalCents,
      journal_id: journal_id
    }
  } catch (error) {
    console.error('Error processing flight completion billing:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
