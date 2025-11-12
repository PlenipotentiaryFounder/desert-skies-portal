"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { postJournalEntries, getOrCreateWallet } from "@/lib/ledger-service"

// ============================================================================
// TYPES
// ============================================================================

export type EventType = "prebrief" | "flight" | "ground" | "simulator" | "postbrief"
export type BillingCategory = "flight_instruction" | "ground_instruction" | "simulator_instruction"
export type EventStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show"
export type PaymentStatus = "pending" | "paid" | "refunded" | "disputed"
export type PayoutStatus = "pending" | "scheduled" | "paid" | "failed"

export interface TrainingEvent {
  id: string
  mission_id: string
  enrollment_id: string
  instructor_id: string
  student_id: string
  event_type: EventType
  event_sequence: number
  billing_category: BillingCategory
  scheduled_duration_minutes: number | null
  actual_duration_minutes: number | null
  billable_hours: number | null
  student_billing_rate_dollars: number | null
  student_charge_cents: number | null
  instructor_payout_rate_cents: number | null
  instructor_payout_cents: number | null
  dsa_margin_cents: number | null
  student_payment_status: PaymentStatus
  instructor_payout_status: PayoutStatus
  ledger_journal_id: string | null
  aircraft_id: string | null
  hobbs_start: number | null
  hobbs_end: number | null
  tach_start: number | null
  tach_end: number | null
  total_flight_hours: number | null // Direct entry alternative to hobbs start/stop
  scheduled_start_time: string | null
  actual_start_time: string | null
  actual_end_time: string | null
  objectives_covered: string[] | null
  notes: string | null
  weather_conditions: any | null
  status: EventStatus
  created_at: string
  updated_at: string
  created_by: string | null
  completed_by: string | null
  
  // Populated fields
  instructor?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  student?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  aircraft?: {
    id: string
    tail_number: string
    make: string
    model: string
  }
}

export interface TrainingEventFormData {
  mission_id: string
  enrollment_id: string
  instructor_id: string
  student_id: string
  event_type: EventType
  event_sequence: number
  billing_category: BillingCategory
  scheduled_duration_minutes?: number
  scheduled_start_time?: string
  aircraft_id?: string | null
  notes?: string | null
}

export interface EventBillingCalculation {
  billable_hours: number
  student_billing_rate_dollars: number
  student_charge_cents: number
  instructor_payout_rate_cents: number
  instructor_payout_cents: number
  dsa_margin_cents: number
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a training event
 */
export async function createTrainingEvent(
  formData: TrainingEventFormData
): Promise<{ success: boolean; data?: TrainingEvent; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    const eventData = {
      ...formData,
      status: "scheduled" as EventStatus,
      student_payment_status: "pending" as PaymentStatus,
      instructor_payout_status: "pending" as PayoutStatus,
      created_by: user.id,
    }

    const { data, error } = await supabase
      .from("training_events")
      .insert(eventData)
      .select()
      .single()

    if (error) {
      console.error("Error creating training event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/instructor/missions/${formData.mission_id}`)
    revalidatePath(`/student/missions/${formData.mission_id}`)

    return { success: true, data: data as TrainingEvent }
  } catch (error) {
    console.error("Error in createTrainingEvent:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get training events for a mission
 */
export async function getMissionTrainingEvents(
  missionId: string
): Promise<TrainingEvent[]> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("training_events")
      .select(`
        *,
        instructor:instructor_id (
          id,
          first_name,
          last_name,
          email
        ),
        student:student_id (
          id,
          first_name,
          last_name,
          email
        ),
        aircraft:aircraft_id (
          id,
          tail_number,
          make,
          model
        )
      `)
      .eq("mission_id", missionId)
      .order("event_sequence", { ascending: true })

    if (error) {
      console.error("Error fetching training events:", error)
      return []
    }

    return data as TrainingEvent[]
  } catch (error) {
    console.error("Error in getMissionTrainingEvents:", error)
    return []
  }
}

/**
 * Alias for getMissionTrainingEvents (for backward compatibility)
 */
export async function getTrainingEventsByMissionId(missionId: string): Promise<TrainingEvent[]> {
  return getMissionTrainingEvents(missionId)
}

/**
 * Get a single training event by ID
 */
export async function getTrainingEventById(
  eventId: string
): Promise<TrainingEvent | null> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("training_events")
      .select(`
        *,
        instructor:instructor_id (
          id,
          first_name,
          last_name,
          email
        ),
        student:student_id (
          id,
          first_name,
          last_name,
          email
        ),
        aircraft:aircraft_id (
          id,
          tail_number,
          make,
          model
        )
      `)
      .eq("id", eventId)
      .single()

    if (error) {
      console.error("Error fetching training event:", error)
      return null
    }

    return data as TrainingEvent
  } catch (error) {
    console.error("Error in getTrainingEventById:", error)
    return null
  }
}

/**
 * Update a training event
 */
export async function updateTrainingEvent(
  eventId: string,
  updates: Partial<TrainingEvent>
): Promise<{ success: boolean; data?: TrainingEvent; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("training_events")
      .update(updates)
      .eq("id", eventId)
      .select()
      .single()

    if (error) {
      console.error("Error updating training event:", error)
      return { success: false, error: error.message }
    }

    // Revalidate mission pages
    const event = data as TrainingEvent
    revalidatePath(`/instructor/missions/${event.mission_id}`)
    revalidatePath(`/student/missions/${event.mission_id}`)

    return { success: true, data: event }
  } catch (error) {
    console.error("Error in updateTrainingEvent:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// ============================================================================
// BILLING CALCULATIONS
// ============================================================================

/**
 * Get billing rates for a student-instructor pair
 */
async function getBillingRates(
  studentId: string,
  instructorId: string,
  billingCategory: BillingCategory
): Promise<{
  studentRate: number
  instructorPayoutRate: number
}> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get student-instructor rates
    const { data: rates } = await supabase
      .from("student_instructor_rates")
      .select("*")
      .eq("student_id", studentId)
      .eq("instructor_id", instructorId)
      .eq("is_active", true)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single()

    // Get instructor payout rates
    const { data: payoutRates } = await supabase
      .from("instructor_payout_rates")
      .select("*")
      .eq("instructor_id", instructorId)
      .eq("is_active", true)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single()

    let studentRate = 0
    let instructorPayoutRate = 0

    if (rates) {
      if (billingCategory === "flight_instruction") {
        studentRate = parseFloat(rates.flight_instruction_rate?.toString() || "0")
      } else if (billingCategory === "ground_instruction") {
        studentRate = parseFloat(rates.ground_instruction_rate?.toString() || "0")
      }
    }

    if (payoutRates) {
      if (billingCategory === "flight_instruction") {
        instructorPayoutRate = payoutRates.flight_instruction_payout_cents || 0
      } else if (billingCategory === "ground_instruction") {
        instructorPayoutRate = payoutRates.ground_instruction_payout_cents || 0
      }
    }

    // Default rates if not found
    if (studentRate === 0) {
      studentRate = billingCategory === "flight_instruction" ? 65 : 45
    }
    if (instructorPayoutRate === 0) {
      instructorPayoutRate = billingCategory === "flight_instruction" ? 4000 : 3000 // in cents
    }

    return {
      studentRate,
      instructorPayoutRate,
    }
  } catch (error) {
    console.error("Error getting billing rates:", error)
    // Return default rates
    return {
      studentRate: billingCategory === "flight_instruction" ? 65 : 45,
      instructorPayoutRate: billingCategory === "flight_instruction" ? 4000 : 3000,
    }
  }
}

/**
 * Calculate billing for a training event
 */
export async function calculateEventBilling(
  event: Partial<TrainingEvent> & {
    student_id: string
    instructor_id: string
    billing_category: BillingCategory
    actual_duration_minutes?: number | null
    hobbs_start?: number | null
    hobbs_end?: number | null
    total_flight_hours?: number | null // Direct entry option
  }
): Promise<EventBillingCalculation> {
  try {
    // Calculate billable hours - support multiple input methods
    let billableHours = 0

    if (event.billing_category === "flight_instruction") {
      // METHOD 1: Direct total flight hours entry (preferred for simplicity)
      if (event.total_flight_hours && event.total_flight_hours > 0) {
        billableHours = event.total_flight_hours
      }
      // METHOD 2: Calculate from hobbs start/stop
      else if (event.hobbs_start && event.hobbs_end) {
        billableHours = event.hobbs_end - event.hobbs_start
      }
      // FALLBACK: Use actual duration if neither method provided
      else if (event.actual_duration_minutes) {
        billableHours = event.actual_duration_minutes / 60
      }
    } else if (event.actual_duration_minutes) {
      // Use actual duration for ground/prebrief/postbrief
      billableHours = event.actual_duration_minutes / 60
    } else if (event.scheduled_duration_minutes) {
      // Fallback to scheduled duration
      billableHours = event.scheduled_duration_minutes / 60
    }

    // Round to 2 decimal places
    billableHours = Math.round(billableHours * 100) / 100

    // Get billing rates
    const { studentRate, instructorPayoutRate } = await getBillingRates(
      event.student_id,
      event.instructor_id,
      event.billing_category
    )

    // Calculate charges
    const studentChargeDollars = billableHours * studentRate
    const studentChargeCents = Math.round(studentChargeDollars * 100)
    const instructorPayoutCents = Math.round(billableHours * instructorPayoutRate)
    const dsaMarginCents = studentChargeCents - instructorPayoutCents

    return {
      billable_hours: billableHours,
      student_billing_rate_dollars: studentRate,
      student_charge_cents: studentChargeCents,
      instructor_payout_rate_cents: instructorPayoutRate,
      instructor_payout_cents: instructorPayoutCents,
      dsa_margin_cents: dsaMarginCents,
    }
  } catch (error) {
    console.error("Error calculating event billing:", error)
    return {
      billable_hours: 0,
      student_billing_rate_dollars: 0,
      student_charge_cents: 0,
      instructor_payout_rate_cents: 0,
      instructor_payout_cents: 0,
      dsa_margin_cents: 0,
    }
  }
}

/**
 * Complete a training event and calculate billing
 */
export async function completeTrainingEvent(
  eventId: string,
  completionData: {
    actual_duration_minutes?: number
    hobbs_start?: number
    hobbs_end?: number
    tach_start?: number
    tach_end?: number
    total_flight_hours?: number // Direct flight time entry
    weather_conditions?: any
    objectives_covered?: string[]
    notes?: string
  }
): Promise<{ success: boolean; billing?: EventBillingCalculation; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the event
    const event = await getTrainingEventById(eventId)
    if (!event) {
      return { success: false, error: "Training event not found" }
    }

    // Calculate billing
    const billing = await calculateEventBilling({
      ...event,
      ...completionData,
    })

    // Update the event
    const updates = {
      ...completionData,
      ...billing,
      status: "completed" as EventStatus,
      actual_end_time: new Date().toISOString(),
      completed_by: user.id,
    }

    const { data, error } = await supabase
      .from("training_events")
      .update(updates)
      .eq("id", eventId)
      .select()
      .single()

    if (error) {
      console.error("Error completing training event:", error)
      return { success: false, error: error.message }
    }

    // POST TO LEDGER SYSTEM - Create journal entries for billing
    if (data && (data.student_charge_cents > 0 || data.instructor_payout_cents > 0)) {
      await postTrainingEventToLedger(data as TrainingEvent)
    }

    revalidatePath(`/instructor/missions/${event.mission_id}`)
    revalidatePath(`/student/missions/${event.mission_id}`)

    return { success: true, billing }
  } catch (error) {
    console.error("Error in completeTrainingEvent:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Start a training event
 */
export async function startTrainingEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { error } = await supabase
      .from("training_events")
      .update({
        status: "in_progress",
        actual_start_time: new Date().toISOString(),
      })
      .eq("id", eventId)

    if (error) {
      console.error("Error starting training event:", error)
      return { success: false, error: error.message }
    }

    // Also update mission status if first event
    const event = await getTrainingEventById(eventId)
    if (event?.event_sequence === 1) {
      await supabase
        .from("missions")
        .update({ status: "in_progress" })
        .eq("id", event.mission_id)
    }

    return { success: true }
  } catch (error) {
    console.error("Error in startTrainingEvent:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Adjust training event billing (post-completion corrections)
 */
export async function adjustTrainingEvent(
  eventId: string,
  adjustments: {
    actual_duration_minutes?: number
    hobbs_start?: number
    hobbs_end?: number
    reason: string
  }
): Promise<{ success: boolean; newBilling?: EventBillingCalculation; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Get current event
    const event = await getTrainingEventById(eventId)
    if (!event) {
      return { success: false, error: "Training event not found" }
    }

    // Recalculate billing
    const newBilling = await calculateEventBilling({
      ...event,
      ...adjustments,
    })

    // Create adjustment note
    const adjustmentNote = `
      Adjustment made by instructor on ${new Date().toISOString()}
      Reason: ${adjustments.reason}
      Previous billing: $${(event.student_charge_cents || 0) / 100}
      New billing: $${newBilling.student_charge_cents / 100}
    `

    // Update event
    const { error } = await supabase
      .from("training_events")
      .update({
        ...adjustments,
        ...newBilling,
        notes: event.notes 
          ? `${event.notes}\n\n${adjustmentNote}` 
          : adjustmentNote,
      })
      .eq("id", eventId)

    if (error) {
      console.error("Error adjusting training event:", error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/instructor/missions/${event.mission_id}`)
    revalidatePath(`/student/missions/${event.mission_id}`)

    return { success: true, newBilling }
  } catch (error) {
    console.error("Error in adjustTrainingEvent:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get training event statistics for a student
 */
export async function getStudentTrainingEventStats(
  studentId: string,
  enrollmentId?: string
): Promise<{
  total_events: number
  completed_events: number
  total_flight_hours: number
  total_ground_hours: number
  total_prebrief_hours: number
  total_postbrief_hours: number
  total_cost_dollars: number
}> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    let query = supabase
      .from("training_events")
      .select("*")
      .eq("student_id", studentId)

    if (enrollmentId) {
      query = query.eq("enrollment_id", enrollmentId)
    }

    const { data: events, error } = await query

    if (error || !events) {
      console.error("Error fetching training event stats:", error)
      return {
        total_events: 0,
        completed_events: 0,
        total_flight_hours: 0,
        total_ground_hours: 0,
        total_prebrief_hours: 0,
        total_postbrief_hours: 0,
        total_cost_dollars: 0,
      }
    }

    const completed = events.filter((e) => e.status === "completed")

    const flightHours = completed
      .filter((e) => e.event_type === "flight")
      .reduce((sum, e) => sum + (e.billable_hours || 0), 0)

    const groundHours = completed
      .filter((e) => e.event_type === "ground")
      .reduce((sum, e) => sum + (e.billable_hours || 0), 0)

    const prebriefHours = completed
      .filter((e) => e.event_type === "prebrief")
      .reduce((sum, e) => sum + (e.billable_hours || 0), 0)

    const postbriefHours = completed
      .filter((e) => e.event_type === "postbrief")
      .reduce((sum, e) => sum + (e.billable_hours || 0), 0)

    const totalCost = completed.reduce(
      (sum, e) => sum + (e.student_charge_cents || 0),
      0
    )

    return {
      total_events: events.length,
      completed_events: completed.length,
      total_flight_hours: flightHours,
      total_ground_hours: groundHours,
      total_prebrief_hours: prebriefHours,
      total_postbrief_hours: postbriefHours,
      total_cost_dollars: totalCost / 100,
    }
  } catch (error) {
    console.error("Error in getStudentTrainingEventStats:", error)
    return {
      total_events: 0,
      completed_events: 0,
      total_flight_hours: 0,
      total_ground_hours: 0,
      total_prebrief_hours: 0,
      total_postbrief_hours: 0,
      total_cost_dollars: 0,
    }
  }
}

// ============================================================================
// BILLING INTEGRATION
// ============================================================================

/**
 * Post training event to ledger system
 * Creates journal entries for student charges, instructor payouts, and platform margin
 */
async function postTrainingEventToLedger(event: TrainingEvent): Promise<void> {
  try {
    const studentCharge = event.student_charge_cents || 0
    const instructorPayout = event.instructor_payout_cents || 0
    const platformMargin = studentCharge - instructorPayout

    // Skip if no charges
    if (studentCharge === 0) {
      return
    }

    // Get or create wallets
    const studentWalletId = await getOrCreateWallet('student', event.student_id)
    const instructorWalletId = await getOrCreateWallet('instructor', event.instructor_id)
    const platformWalletId = await getOrCreateWallet('platform', null)

    if (!studentWalletId || !instructorWalletId || !platformWalletId) {
      console.error("Failed to create wallets for training event billing")
      return
    }

    // Build description
    const eventTypeLabel = event.event_type.replace('_', ' ')
    const description = `${eventTypeLabel} - Mission ${event.mission_id.substring(0, 8)}`

    // Create balanced journal entries (three-way split)
    const entries = []

    // Student pays (debit - negative amount reduces balance)
    entries.push({
      wallet_id: studentWalletId,
      amount_cents: -studentCharge,
      ref_type: 'training_event',
      ref_id: event.id,
      description: `${description} - Student charge`,
      metadata: {
        event_type: event.event_type,
        mission_id: event.mission_id,
        duration_minutes: event.actual_duration_minutes,
        billable_hours: event.billable_hours,
        billing_category: event.billing_category,
      }
    })

    // Instructor receives (credit - positive amount increases balance)
    if (instructorPayout > 0) {
      entries.push({
        wallet_id: instructorWalletId,
        amount_cents: instructorPayout,
        ref_type: 'training_event',
        ref_id: event.id,
        description: `${description} - Instructor payout`,
        metadata: {
          event_type: event.event_type,
          mission_id: event.mission_id,
          duration_minutes: event.actual_duration_minutes,
          billable_hours: event.billable_hours,
        }
      })
    }

    // Platform margin (credit - positive amount increases balance)
    if (platformMargin > 0) {
      entries.push({
        wallet_id: platformWalletId,
        amount_cents: platformMargin,
        ref_type: 'training_event',
        ref_id: event.id,
        description: `${description} - Platform margin`,
        metadata: {
          event_type: event.event_type,
          mission_id: event.mission_id,
          student_charge_cents: studentCharge,
          instructor_payout_cents: instructorPayout,
        }
      })
    }

    // Post to ledger
    const result = await postJournalEntries(
      'training_event',
      event.id,
      entries,
      'USD',
      true // Use service role to bypass RLS
    )

    if (!result.success) {
      console.error("Failed to post training event to ledger:", result.error)
    } else {
      console.log(`Successfully posted training event ${event.id} to ledger (Journal: ${result.journal_id})`)
    }
  } catch (error) {
    console.error("Error posting training event to ledger:", error)
  }
}

/**
 * Export for use in complete training event function
 */
export { postTrainingEventToLedger }
