import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type BookingSource = 'website' | 'groupon' | 'cal_com' | 'referral' | 'other'
export type PaymentStatus = 'pending' | 'paid' | 'groupon_verified' | 'refunded' | 'failed'
export type PaymentMethod = 'stripe' | 'groupon' | 'cash' | 'other'
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed' | 'expired'
export type FlightStatus = 'not_scheduled' | 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
export type IDDocumentType = 'drivers_license' | 'passport' | 'state_id' | 'other'

export interface DiscoveryFlight {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  booking_source: BookingSource
  booking_reference?: string
  payment_status: PaymentStatus
  payment_method?: PaymentMethod
  stripe_customer_id?: string
  stripe_payment_intent_id?: string
  amount_paid_cents: number
  currency: string
  groupon_code?: string
  groupon_verified: boolean
  groupon_verified_at?: string
  groupon_order_id?: string
  onboarding_status: OnboardingStatus
  onboarding_started_at?: string
  onboarding_completed_at?: string
  onboarding_expires_at?: string
  steps_completed: {
    personal_info: boolean
    id_upload: boolean
    liability_waiver: boolean
    payment: boolean
  }
  id_document_path?: string
  id_document_type?: IDDocumentType
  id_verified: boolean
  id_verified_at?: string
  id_verified_by?: string
  waiver_signed: boolean
  waiver_signed_at?: string
  waiver_signature_data?: any
  scheduled_date?: string
  scheduled_time?: string
  scheduled_instructor_id?: string
  scheduled_aircraft_id?: string
  flight_status: FlightStatus
  flight_completed_at?: string
  flight_cancelled_at?: string
  cancellation_reason?: string
  mission_id?: string
  converted_to_student: boolean
  student_profile_id?: string
  converted_at?: string
  enrolled_in_syllabus_id?: string
  outlook_contact_id?: string
  outlook_synced_at?: string
  apple_contact_id?: string
  apple_synced_at?: string
  confirmation_email_sent: boolean
  confirmation_email_sent_at?: string
  reminder_email_sent: boolean
  reminder_email_sent_at?: string
  follow_up_email_sent: boolean
  follow_up_email_sent_at?: string
  customer_notes?: string
  admin_notes?: string
  special_requests?: string
  ip_address?: string
  user_agent?: string
  referral_source?: string
  utm_campaign?: string
  utm_source?: string
  utm_medium?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateDiscoveryFlightInput {
  email: string
  first_name: string
  last_name: string
  phone?: string
  booking_source: BookingSource
  booking_reference?: string
  groupon_code?: string
  customer_notes?: string
  special_requests?: string
  referral_source?: string
  utm_campaign?: string
  utm_source?: string
  utm_medium?: string
  ip_address?: string
  user_agent?: string
}

export interface UpdateDiscoveryFlightInput {
  first_name?: string
  last_name?: string
  phone?: string
  payment_status?: PaymentStatus
  payment_method?: PaymentMethod
  stripe_customer_id?: string
  stripe_payment_intent_id?: string
  amount_paid_cents?: number
  onboarding_status?: OnboardingStatus
  steps_completed?: Partial<DiscoveryFlight['steps_completed']>
  id_document_path?: string
  id_document_type?: IDDocumentType
  waiver_signed?: boolean
  waiver_signature_data?: any
  scheduled_date?: string
  scheduled_time?: string
  scheduled_instructor_id?: string
  scheduled_aircraft_id?: string
  flight_status?: FlightStatus
  customer_notes?: string
  admin_notes?: string
  special_requests?: string
}

export interface GrouponCode {
  id: string
  code: string
  groupon_deal_id?: string
  groupon_order_id?: string
  status: 'active' | 'redeemed' | 'expired' | 'invalid' | 'refunded'
  redeemed_by_discovery_flight_id?: string
  redeemed_at?: string
  redeemed_by_email?: string
  valid_from?: string
  valid_until?: string
  value_cents: number
  currency: string
  groupon_api_response?: any
  created_at: string
  updated_at: string
}

// =====================================================
// DISCOVERY FLIGHT CRUD OPERATIONS
// =====================================================

export async function createDiscoveryFlight(input: CreateDiscoveryFlightInput): Promise<DiscoveryFlight> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from('discovery_flights')
    .insert({
      ...input,
      onboarding_status: 'pending',
      payment_status: input.groupon_code ? 'pending' : 'pending',
      flight_status: 'not_scheduled',
      onboarding_started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating discovery flight:', error)
    throw new Error('Failed to create discovery flight')
  }

  // Log activity
  await logDiscoveryFlightActivity(
    data.id,
    'created',
    `Discovery flight created for ${input.first_name} ${input.last_name}`,
    { booking_source: input.booking_source }
  )

  // Schedule confirmation email
  await scheduleDiscoveryFlightEmail(data.id, 'confirmation')

  return data
}

export async function getDiscoveryFlightById(id: string): Promise<DiscoveryFlight | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from('discovery_flights')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching discovery flight:', error)
    return null
  }

  return data
}

export async function getDiscoveryFlightByEmail(email: string): Promise<DiscoveryFlight | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from('discovery_flights')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching discovery flight by email:', error)
    return null
  }

  return data
}

export async function updateDiscoveryFlight(
  id: string,
  input: UpdateDiscoveryFlightInput
): Promise<DiscoveryFlight> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // If updating steps_completed, merge with existing
  let updateData: any = { ...input }
  
  if (input.steps_completed) {
    const existing = await getDiscoveryFlightById(id)
    if (existing) {
      updateData.steps_completed = {
        ...existing.steps_completed,
        ...input.steps_completed,
      }
    }
  }

  const { data, error } = await supabase
    .from('discovery_flights')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating discovery flight:', error)
    throw new Error('Failed to update discovery flight')
  }

  return data
}

export async function getAllDiscoveryFlights(filters?: {
  onboarding_status?: OnboardingStatus
  flight_status?: FlightStatus
  payment_status?: PaymentStatus
  instructor_id?: string
  date_from?: string
  date_to?: string
}): Promise<DiscoveryFlight[]> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  let query = supabase
    .from('discovery_flights')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.onboarding_status) {
    query = query.eq('onboarding_status', filters.onboarding_status)
  }
  if (filters?.flight_status) {
    query = query.eq('flight_status', filters.flight_status)
  }
  if (filters?.payment_status) {
    query = query.eq('payment_status', filters.payment_status)
  }
  if (filters?.instructor_id) {
    query = query.eq('scheduled_instructor_id', filters.instructor_id)
  }
  if (filters?.date_from) {
    query = query.gte('scheduled_date', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('scheduled_date', filters.date_to)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching discovery flights:', error)
    throw new Error('Failed to fetch discovery flights')
  }

  return data || []
}

// =====================================================
// ONBOARDING STEP UPDATES
// =====================================================

export async function completePersonalInfo(
  id: string,
  data: { first_name: string; last_name: string; phone?: string }
): Promise<DiscoveryFlight> {
  const result = await updateDiscoveryFlight(id, {
    ...data,
    steps_completed: { personal_info: true },
    onboarding_status: 'in_progress',
  })

  await logDiscoveryFlightActivity(
    id,
    'step_completed',
    'Personal information completed',
    { step: 'personal_info' }
  )

  return result
}

export async function completeIDUpload(
  id: string,
  document_path: string,
  document_type: IDDocumentType
): Promise<DiscoveryFlight> {
  const result = await updateDiscoveryFlight(id, {
    id_document_path: document_path,
    id_document_type: document_type,
    steps_completed: { id_upload: true },
  })

  await logDiscoveryFlightActivity(
    id,
    'id_uploaded',
    `ID document uploaded: ${document_type}`,
    { document_type, document_path }
  )

  return result
}

export async function completeLiabilityWaiver(
  id: string,
  signature_data: any
): Promise<DiscoveryFlight> {
  const result = await updateDiscoveryFlight(id, {
    waiver_signed: true,
    waiver_signed_at: new Date().toISOString(),
    waiver_signature_data: signature_data,
    steps_completed: { liability_waiver: true },
  })

  await logDiscoveryFlightActivity(
    id,
    'waiver_signed',
    'Liability waiver signed',
    { signature_name: signature_data.name }
  )

  return result
}

export async function completePayment(
  id: string,
  payment_data: {
    payment_method: PaymentMethod
    stripe_customer_id?: string
    stripe_payment_intent_id?: string
    amount_paid_cents: number
  }
): Promise<DiscoveryFlight> {
  const result = await updateDiscoveryFlight(id, {
    ...payment_data,
    payment_status: 'paid',
    steps_completed: { payment: true },
  })

  await logDiscoveryFlightActivity(
    id,
    'payment_received',
    `Payment received: $${(payment_data.amount_paid_cents / 100).toFixed(2)}`,
    { payment_method: payment_data.payment_method, amount_cents: payment_data.amount_paid_cents }
  )

  return result
}

// =====================================================
// GROUPON INTEGRATION
// =====================================================

export async function verifyGrouponCode(code: string, email: string): Promise<{
  valid: boolean
  groupon_code?: GrouponCode
  error?: string
}> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from('groupon_codes')
    .select('*')
    .eq('code', code)
    .eq('status', 'active')
    .single()

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired Groupon code' }
  }

  // Check validity dates
  if (data.valid_until) {
    const expiryDate = new Date(data.valid_until)
    if (expiryDate < new Date()) {
      return { valid: false, error: 'Groupon code has expired' }
    }
  }

  return { valid: true, groupon_code: data }
}

export async function redeemGrouponCode(
  code: string,
  discovery_flight_id: string,
  email: string
): Promise<void> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Update groupon code
  await supabase
    .from('groupon_codes')
    .update({
      status: 'redeemed',
      redeemed_by_discovery_flight_id: discovery_flight_id,
      redeemed_at: new Date().toISOString(),
      redeemed_by_email: email,
    })
    .eq('code', code)

  // Update discovery flight
  await updateDiscoveryFlight(discovery_flight_id, {
    groupon_verified: true,
    payment_status: 'groupon_verified',
    payment_method: 'groupon',
    steps_completed: { payment: true },
  })

  await logDiscoveryFlightActivity(
    discovery_flight_id,
    'groupon_verified',
    `Groupon code verified: ${code}`,
    { code }
  )
}

// =====================================================
// FLIGHT SCHEDULING
// =====================================================

export async function scheduleDiscoveryFlight(
  id: string,
  schedule_data: {
    scheduled_date: string
    scheduled_time: string
    scheduled_instructor_id: string
    scheduled_aircraft_id?: string
  }
): Promise<DiscoveryFlight> {
  const result = await updateDiscoveryFlight(id, {
    ...schedule_data,
    flight_status: 'scheduled',
  })

  await logDiscoveryFlightActivity(
    id,
    'flight_scheduled',
    `Flight scheduled for ${schedule_data.scheduled_date} at ${schedule_data.scheduled_time}`,
    schedule_data
  )

  // Schedule reminder emails
  const flightDateTime = new Date(`${schedule_data.scheduled_date}T${schedule_data.scheduled_time}`)
  await scheduleDiscoveryFlightEmail(id, 'reminder_24h', new Date(flightDateTime.getTime() - 24 * 60 * 60 * 1000))
  await scheduleDiscoveryFlightEmail(id, 'reminder_1h', new Date(flightDateTime.getTime() - 60 * 60 * 1000))

  return result
}

export async function assignInstructor(
  id: string,
  instructor_id: string
): Promise<DiscoveryFlight> {
  const result = await updateDiscoveryFlight(id, {
    scheduled_instructor_id: instructor_id,
  })

  await logDiscoveryFlightActivity(
    id,
    'instructor_assigned',
    `Instructor assigned`,
    { instructor_id }
  )

  return result
}

// =====================================================
// CONVERSION TO STUDENT
// =====================================================

export async function convertToStudent(
  id: string,
  student_profile_id: string,
  syllabus_id?: string
): Promise<DiscoveryFlight> {
  const result = await updateDiscoveryFlight(id, {
    converted_to_student: true,
    student_profile_id,
    enrolled_in_syllabus_id: syllabus_id,
    converted_at: new Date().toISOString(),
  })

  await logDiscoveryFlightActivity(
    id,
    'converted_to_student',
    'Converted to full student enrollment',
    { student_profile_id, syllabus_id }
  )

  return result
}

// =====================================================
// ACTIVITY LOGGING
// =====================================================

export async function logDiscoveryFlightActivity(
  discovery_flight_id: string,
  activity_type: string,
  description: string,
  metadata?: any,
  performed_by?: string,
  performed_by_role: string = 'system'
): Promise<void> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  await supabase
    .from('discovery_flight_activity_log')
    .insert({
      discovery_flight_id,
      activity_type,
      activity_description: description,
      activity_metadata: metadata,
      performed_by,
      performed_by_role,
    })
}

export async function getDiscoveryFlightActivityLog(
  discovery_flight_id: string
): Promise<any[]> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from('discovery_flight_activity_log')
    .select('*')
    .eq('discovery_flight_id', discovery_flight_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching activity log:', error)
    return []
  }

  return data || []
}

// =====================================================
// EMAIL SCHEDULING
// =====================================================

export async function scheduleDiscoveryFlightEmail(
  discovery_flight_id: string,
  email_type: string,
  scheduled_send_at?: Date
): Promise<void> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const flight = await getDiscoveryFlightById(discovery_flight_id)
  if (!flight) return

  await supabase
    .from('discovery_flight_email_queue')
    .insert({
      discovery_flight_id,
      email_type,
      recipient_email: flight.email,
      recipient_name: `${flight.first_name} ${flight.last_name}`,
      scheduled_send_at: (scheduled_send_at || new Date()).toISOString(),
      status: 'pending',
    })
}

// =====================================================
// DASHBOARD & ANALYTICS
// =====================================================

export async function getDiscoveryFlightsDashboard(): Promise<any> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from('discovery_flights_dashboard')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching dashboard:', error)
    return []
  }

  return data || []
}

export async function getDiscoveryFlightStats(): Promise<{
  total: number
  pending_onboarding: number
  ready_to_schedule: number
  scheduled: number
  completed: number
  converted: number
  conversion_rate: number
}> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: all } = await supabase.from('discovery_flights').select('*')

  if (!all) {
    return {
      total: 0,
      pending_onboarding: 0,
      ready_to_schedule: 0,
      scheduled: 0,
      completed: 0,
      converted: 0,
      conversion_rate: 0,
    }
  }

  const total = all.length
  const pending_onboarding = all.filter(f => f.onboarding_status !== 'completed').length
  const ready_to_schedule = all.filter(
    f => f.onboarding_status === 'completed' && f.flight_status === 'not_scheduled'
  ).length
  const scheduled = all.filter(f => f.flight_status === 'scheduled').length
  const completed = all.filter(f => f.flight_status === 'completed').length
  const converted = all.filter(f => f.converted_to_student).length
  const conversion_rate = completed > 0 ? (converted / completed) * 100 : 0

  return {
    total,
    pending_onboarding,
    ready_to_schedule,
    scheduled,
    completed,
    converted,
    conversion_rate,
  }
}


