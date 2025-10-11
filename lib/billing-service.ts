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

export type StudentAccount = {
  id: string
  student_id: string
  current_balance: number
  credit_limit: number
  payment_terms: number
  auto_charge_enabled: boolean
  low_balance_threshold: number
  status: 'active' | 'suspended' | 'closed'
  student?: {
    first_name: string
    last_name: string
    email: string
  }
}

export type AccountTransaction = {
  id: string
  created_at: string
  transaction_type: 'debit' | 'credit' | 'refund' | 'adjustment'
  amount: number
  balance_after: number
  description: string
  reference_type?: string
  reference_id?: string
  processed_by?: string
  metadata?: any
}

export type Invoice = {
  id: string
  invoice_number: string
  student_id: string
  total_amount: number
  tax_amount: number
  discount_amount: number
  net_amount: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  paid_date?: string
  notes?: string
  payment_terms: number
  student?: {
    first_name: string
    last_name: string
    email: string
  }
  line_items?: InvoiceLineItem[]
}

export type InvoiceLineItem = {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
  flight_session_id?: string
  item_type: 'service' | 'aircraft' | 'instructor' | 'fuel' | 'fee' | 'other'
  metadata?: any
}

export type FlightSessionCost = {
  id: string
  flight_session_id: string
  aircraft_cost: number
  instructor_cost: number
  fuel_cost: number
  ground_time_cost: number
  additional_fees: number
  total_cost: number
  billing_status: 'pending' | 'billed' | 'paid'
  invoice_id?: string
}

// Billing Rates Management
export async function getBillingRates(filters?: {
  rate_type?: string
  is_active?: boolean
}) {
  const supabase = await createClient(await cookies())
  
  let query = supabase
    .from('billing_rates')
    .select(`
      *,
      aircraft:aircraft_id(tail_number, make, model),
      profiles:instructor_id(first_name, last_name)
    `)
    .order('effective_date', { ascending: false })

  if (filters?.rate_type) {
    query = query.eq('rate_type', filters.rate_type)
  }
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching billing rates:', error)
    throw new Error('Failed to fetch billing rates')
  }

  return data as BillingRate[]
}

export async function createBillingRate(rate: Omit<BillingRate, 'id'>) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('billing_rates')
    .insert(rate)
    .select()
    .single()

  if (error) {
    console.error('Error creating billing rate:', error)
    throw new Error('Failed to create billing rate')
  }

  return data
}

export async function updateBillingRate(id: string, updates: Partial<BillingRate>) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('billing_rates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating billing rate:', error)
    throw new Error('Failed to update billing rate')
  }

  return data
}

// Student Accounts Management
export async function getStudentAccount(studentId: string): Promise<StudentAccount | null> {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('student_accounts')
    .select(`
      *,
      profiles:student_id(first_name, last_name, email)
    `)
    .eq('student_id', studentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No account exists, create one
      return await createStudentAccount(studentId)
    }
    console.error('Error fetching student account:', error)
    throw new Error('Failed to fetch student account')
  }

  return data as StudentAccount
}

export async function createStudentAccount(studentId: string): Promise<StudentAccount> {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('student_accounts')
    .insert({
      student_id: studentId,
      current_balance: 0.00,
      credit_limit: 500.00, // Default credit limit
      low_balance_threshold: 100.00
    })
    .select(`
      *,
      profiles:student_id(first_name, last_name, email)
    `)
    .single()

  if (error) {
    console.error('Error creating student account:', error)
    throw new Error('Failed to create student account')
  }

  return data as StudentAccount
}

export async function updateStudentAccountBalance(
  studentId: string,
  amount: number,
  transactionType: 'debit' | 'credit' | 'refund' | 'adjustment',
  description: string,
  referenceType?: string,
  referenceId?: string,
  processedBy?: string
) {
  const supabase = await createClient(await cookies())

  // Start transaction
  const { data: account, error: accountError } = await supabase
    .from('student_accounts')
    .select('current_balance')
    .eq('student_id', studentId)
    .single()

  if (accountError) {
    throw new Error('Failed to fetch account balance')
  }

  const currentBalance = account.current_balance
  const newBalance = transactionType === 'debit' 
    ? currentBalance - Math.abs(amount)
    : currentBalance + Math.abs(amount)

  // Update balance
  const { error: updateError } = await supabase
    .from('student_accounts')
    .update({ 
      current_balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('student_id', studentId)

  if (updateError) {
    throw new Error('Failed to update account balance')
  }

  // Record transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('account_transactions')
    .insert({
      student_id: studentId,
      transaction_type: transactionType,
      amount: Math.abs(amount),
      balance_after: newBalance,
      description,
      reference_type: referenceType,
      reference_id: referenceId,
      processed_by: processedBy
    })
    .select()
    .single()

  if (transactionError) {
    console.error('Error recording transaction:', transactionError)
    throw new Error('Failed to record transaction')
  }

  return { newBalance, transaction }
}

// Transaction History
export async function getAccountTransactions(studentId: string, limit: number = 50) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('account_transactions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching transactions:', error)
    throw new Error('Failed to fetch transactions')
  }

  return data as AccountTransaction[]
}

// Flight Session Cost Calculation
export async function calculateFlightSessionCost(sessionId: string): Promise<number> {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.rpc('calculate_flight_session_cost', {
    session_id: sessionId
  })

  if (error) {
    console.error('Error calculating flight session cost:', error)
    throw new Error('Failed to calculate session cost')
  }

  return data || 0
}

export async function getFlightSessionCost(sessionId: string): Promise<FlightSessionCost | null> {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('flight_session_costs')
    .select('*')
    .eq('flight_session_id', sessionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // No cost record exists yet
    }
    console.error('Error fetching flight session cost:', error)
    throw new Error('Failed to fetch session cost')
  }

  return data as FlightSessionCost
}

// Invoice Management
export async function createInvoiceFromSessions(
  studentId: string,
  sessionIds: string[],
  dueDate: string,
  notes?: string
): Promise<Invoice> {
  const supabase = await createClient(await cookies())

  // Get session costs
  const { data: costs, error: costsError } = await supabase
    .from('flight_session_costs')
    .select(`
      *,
      flight_sessions(date, lesson_id, syllabus_lessons(title))
    `)
    .in('flight_session_id', sessionIds)
    .eq('billing_status', 'pending')

  if (costsError) {
    throw new Error('Failed to fetch session costs')
  }

  if (!costs || costs.length === 0) {
    throw new Error('No unbilled sessions found')
  }

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now()}`
  
  // Calculate totals
  const totalAmount = costs.reduce((sum, cost) => sum + cost.total_cost, 0)

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      student_id: studentId,
      total_amount: totalAmount,
      net_amount: totalAmount,
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
  const lineItems = costs.map(cost => ({
    invoice_id: invoice.id,
    description: `Flight Training - ${cost.flight_sessions?.syllabus_lessons?.title || 'Training Session'}`,
    quantity: 1,
    rate: cost.total_cost,
    amount: cost.total_cost,
    flight_session_id: cost.flight_session_id,
    item_type: 'service' as const
  }))

  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItems)

  if (lineItemsError) {
    throw new Error('Failed to create invoice line items')
  }

  // Update session costs to mark as billed
  const { error: updateCostsError } = await supabase
    .from('flight_session_costs')
    .update({ 
      billing_status: 'billed',
      invoice_id: invoice.id
    })
    .in('flight_session_id', sessionIds)

  if (updateCostsError) {
    throw new Error('Failed to update session billing status')
  }

  return invoice as Invoice
}

export async function getStudentInvoices(studentId: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_line_items(*)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invoices:', error)
    throw new Error('Failed to fetch invoices')
  }

  return data as Invoice[]
}

// Payment Processing
export async function recordPayment(
  studentId: string,
  amount: number,
  paymentMethod: string,
  invoiceId?: string,
  referenceNumber?: string,
  processedBy?: string
) {
  const supabase = await createClient(await cookies())

  // Record payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      student_id: studentId,
      invoice_id: invoiceId,
      payment_method: paymentMethod,
      amount: amount,
      reference_number: referenceNumber,
      processed_by: processedBy,
      status: 'completed'
    })
    .select()
    .single()

  if (paymentError) {
    throw new Error('Failed to record payment')
  }

  // Update account balance (credit)
  await updateStudentAccountBalance(
    studentId,
    amount,
    'credit',
    `Payment received - ${paymentMethod}${referenceNumber ? ` (${referenceNumber})` : ''}`,
    'payment',
    payment.id,
    processedBy
  )

  // If payment is for specific invoice, update invoice status
  if (invoiceId) {
    const { error: invoiceUpdateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', invoiceId)

    if (invoiceUpdateError) {
      console.error('Error updating invoice status:', invoiceUpdateError)
    }
  }

  return payment
}
