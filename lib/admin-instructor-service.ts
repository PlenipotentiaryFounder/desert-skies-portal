"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { cache } from "react"

/**
 * Comprehensive instructor data with all relationships
 */
export interface AdminInstructorData {
  // Profile
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string | null
  date_of_birth: string | null
  address_line1: string | null
  city: string | null
  state: string | null
  status: string
  created_at: string
  
  // Certifications
  certifications: {
    cfi: boolean
    cfi_number: string | null
    cfi_expiration: string | null
    cfii: boolean
    cfii_expiration: string | null
    mei: boolean
    mei_expiration: string | null
    pilot_certificate_type: string | null
    medical_class: string | null
    medical_expiration: string | null
  }
  
  // Experience
  experience: {
    total_flight_hours: number
    total_instruction_hours: number
  }
  
  // Rates
  rates: {
    flight_instruction_payout: number // in cents
    ground_instruction_payout: number // in cents
    average_student_rate: number // average rate charged to students
  }
  
  // Students
  students: {
    total_count: number
    active_count: number
    recent_students: Array<{
      id: string
      first_name: string
      last_name: string
      email: string
    }>
  }
  
  // Onboarding status
  onboarding: {
    completed: boolean
    admin_approved: boolean
    admin_approved_at: string | null
    completed_at: string | null
  }
  
  // Activity
  recent_activity: {
    last_flight_date: string | null
    total_missions: number
    total_flight_hours_taught: number
  }
  
  // Stripe Connect
  stripe_connect: {
    account_id: string | null
    onboarding_complete: boolean
    charges_enabled: boolean
    payouts_enabled: boolean
  }
}

/**
 * Get all instructors with comprehensive data for admin dashboard
 * Cached to prevent duplicate fetches during React rendering
 */
export const getAdminInstructors = cache(async (): Promise<AdminInstructorData[]> => {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  console.log('[getAdminInstructors] Starting fetch...')
  
  // Get all profiles first
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      first_name,
      last_name,
      phone_number,
      date_of_birth,
      address_line1,
      city,
      state,
      status,
      stripe_connect_account_id,
      stripe_connect_onboarding_complete,
      stripe_connect_charges_enabled,
      stripe_connect_payouts_enabled,
      created_at
    `)
    .order('created_at', { ascending: false })
  
  if (profilesError) {
    console.error('[getAdminInstructors] Error fetching profiles:', profilesError)
    return []
  }
  
  console.log('[getAdminInstructors] Fetched', allProfiles?.length || 0, 'total profiles')
  
  if (!allProfiles || allProfiles.length === 0) {
    console.log('[getAdminInstructors] No profiles found')
    return []
  }
  
  // Get roles for each user using the RPC function
  const instructorsWithRoles = []
  for (const profile of allProfiles) {
    const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles_for_middleware', { 
      p_user_id: profile.id 
    })
    
    if (!rolesError && rolesData) {
      const roles = rolesData.map((r: any) => r.role_name)
      // Only include users who have the 'instructor' role
      if (roles.includes('instructor')) {
        instructorsWithRoles.push(profile)
      }
    }
  }
  
  const instructors = instructorsWithRoles
  console.log('[getAdminInstructors] Found', instructors.length, 'instructors with instructor role')
  
  // Build comprehensive data for each instructor
  const instructorsWithData: AdminInstructorData[] = []
  
  console.log('[getAdminInstructors] Building data for', instructors.length, 'instructors...')
  
  for (const instructor of instructors) {
    console.log('[getAdminInstructors] Processing instructor:', instructor.id, instructor.email)
    
    // Get instructor onboarding data
    const { data: onboarding } = await supabase
      .from('instructor_onboarding')
      .select(`
        cfi_certificate_number,
        cfi_expiration_date,
        cfii_certificate,
        cfii_expiration_date,
        mei_certificate,
        mei_expiration_date,
        pilot_certificate_type,
        medical_certificate_class,
        medical_expiration_date,
        total_flight_hours,
        total_instruction_hours,
        completed_at,
        admin_approved,
        admin_approved_at
      `)
      .eq('user_id', instructor.id)
      .single()
    
    // Get instructor payout rates
    const { data: payoutRates } = await supabase
      .from('instructor_payout_rates')
      .select('flight_instruction_payout_cents, ground_instruction_payout_cents')
      .eq('instructor_id', instructor.id)
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()
    
    // Get count of students
    const { count: totalStudents } = await supabase
      .from('student_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', instructor.id)
    
    const { count: activeStudents } = await supabase
      .from('student_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', instructor.id)
      .eq('status', 'active')
    
    // Get recent students
    const { data: recentEnrollments } = await supabase
      .from('student_enrollments')
      .select(`
        student:student_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('instructor_id', instructor.id)
      .order('start_date', { ascending: false })
      .limit(5)
    
    const recentStudents = recentEnrollments?.map((e: any) => e.student).filter((s: any) => s !== null) || []
    
    // Get average student rate
    const { data: studentRates } = await supabase
      .from('student_instructor_rates')
      .select('flight_instruction_rate')
      .eq('instructor_id', instructor.id)
      .eq('is_active', true)
    
    const avgRate = studentRates && studentRates.length > 0
      ? studentRates.reduce((sum, r) => sum + Number(r.flight_instruction_rate), 0) / studentRates.length
      : 0
    
    // Get mission statistics
    const { data: missions } = await supabase
      .from('missions')
      .select('actual_flight_hours, scheduled_date')
      .eq('assigned_instructor_id', instructor.id)
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: false })
    
    const totalFlightHoursTaught = missions?.reduce((sum, m) => sum + (m.actual_flight_hours || 0), 0) || 0
    const lastFlightDate = missions && missions.length > 0 ? missions[0].scheduled_date : null
    
    const { count: totalMissions } = await supabase
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_instructor_id', instructor.id)
    
    instructorsWithData.push({
      ...instructor,
      certifications: {
        cfi: !!onboarding?.cfi_certificate_number,
        cfi_number: onboarding?.cfi_certificate_number || null,
        cfi_expiration: onboarding?.cfi_expiration_date || null,
        cfii: onboarding?.cfii_certificate || false,
        cfii_expiration: onboarding?.cfii_expiration_date || null,
        mei: onboarding?.mei_certificate || false,
        mei_expiration: onboarding?.mei_expiration_date || null,
        pilot_certificate_type: onboarding?.pilot_certificate_type || null,
        medical_class: onboarding?.medical_certificate_class || null,
        medical_expiration: onboarding?.medical_expiration_date || null,
      },
      experience: {
        total_flight_hours: Number(onboarding?.total_flight_hours || 0),
        total_instruction_hours: Number(onboarding?.total_instruction_hours || 0),
      },
      rates: {
        flight_instruction_payout: payoutRates?.flight_instruction_payout_cents || 0,
        ground_instruction_payout: payoutRates?.ground_instruction_payout_cents || 0,
        average_student_rate: avgRate,
      },
      students: {
        total_count: totalStudents || 0,
        active_count: activeStudents || 0,
        recent_students: recentStudents,
      },
      onboarding: {
        completed: !!onboarding?.completed_at,
        admin_approved: onboarding?.admin_approved || false,
        admin_approved_at: onboarding?.admin_approved_at || null,
        completed_at: onboarding?.completed_at || null,
      },
      recent_activity: {
        last_flight_date: lastFlightDate,
        total_missions: totalMissions || 0,
        total_flight_hours_taught: totalFlightHoursTaught,
      },
      stripe_connect: {
        account_id: instructor.stripe_connect_account_id || null,
        onboarding_complete: instructor.stripe_connect_onboarding_complete || false,
        charges_enabled: instructor.stripe_connect_charges_enabled || false,
        payouts_enabled: instructor.stripe_connect_payouts_enabled || false,
      },
    })
  }
  
  console.log('[getAdminInstructors] Completed! Returning', instructorsWithData.length, 'instructors with full data')
  return instructorsWithData
})

/**
 * Approve an instructor
 */
export async function approveInstructor(instructorId: string, adminId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Update profile status
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', instructorId)
  
  if (profileError) throw profileError
  
  // Update instructor_onboarding
  const { error: onboardingError } = await supabase
    .from('instructor_onboarding')
    .update({
      admin_approved: true,
      admin_approved_by: adminId,
      admin_approved_at: new Date().toISOString(),
    })
    .eq('user_id', instructorId)
  
  if (onboardingError) throw onboardingError
  
  // Create notification
  await supabase.from('notifications').insert({
    type: 'account_approved',
    title: 'Account Approved',
    message: 'Your instructor account has been approved. You now have full access to all instructor features.',
    user_id: instructorId,
    is_read: false,
    created_at: new Date().toISOString(),
  })
  
  return { success: true }
}

/**
 * Reject an instructor
 */
export async function rejectInstructor(instructorId: string, reason?: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Update profile status
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', instructorId)
  
  if (profileError) throw profileError
  
  // Update instructor_onboarding if exists
  await supabase
    .from('instructor_onboarding')
    .update({
      admin_approved: false,
      admin_notes: reason || 'Application not approved',
    })
    .eq('user_id', instructorId)
  
  // Create notification
  await supabase.from('notifications').insert({
    type: 'account_rejected',
    title: 'Account Not Approved',
    message: reason || 'Your instructor account application was not approved. Please contact an administrator for more information.',
    user_id: instructorId,
    is_read: false,
    created_at: new Date().toISOString(),
  })
  
  return { success: true }
}

/**
 * Update instructor contact information
 */
export async function updateInstructorContact(
  instructorId: string, 
  data: {
    phone_number?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    zip_code?: string
  }
) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', instructorId)
  
  if (error) throw error
  return { success: true }
}

/**
 * Update instructor certifications
 */
export async function updateInstructorCertifications(
  instructorId: string,
  data: {
    cfi_certificate_number?: string | null
    cfi_expiration_date?: string | null
    cfii_certificate?: boolean
    cfii_expiration_date?: string | null
    mei_certificate?: boolean
    mei_expiration_date?: string | null
  }
) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Clean up the data - convert empty strings to null for dates
  const cleanData = {
    cfi_certificate_number: data.cfi_certificate_number || null,
    cfi_expiration_date: data.cfi_expiration_date && data.cfi_expiration_date.trim() !== '' ? data.cfi_expiration_date : null,
    cfii_certificate: data.cfii_certificate,
    cfii_expiration_date: data.cfii_expiration_date && data.cfii_expiration_date.trim() !== '' ? data.cfii_expiration_date : null,
    mei_certificate: data.mei_certificate,
    mei_expiration_date: data.mei_expiration_date && data.mei_expiration_date.trim() !== '' ? data.mei_expiration_date : null,
  }
  
  const { error } = await supabase
    .from('instructor_onboarding')
    .update(cleanData)
    .eq('user_id', instructorId)
  
  if (error) throw error
  return { success: true }
}

/**
 * Update instructor payout rates
 */
export async function updateInstructorRates(
  instructorId: string,
  flightRate: number, // in cents
  groundRate: number, // in cents
  adminId: string
) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Validate rates
  if (isNaN(flightRate) || isNaN(groundRate) || flightRate < 0 || groundRate < 0) {
    throw new Error('Invalid rate values')
  }
  
  // Ensure rates are integers
  const flightRateInt = Math.round(flightRate)
  const groundRateInt = Math.round(groundRate)
  
  // Deactivate old rates
  await supabase
    .from('instructor_payout_rates')
    .update({ is_active: false })
    .eq('instructor_id', instructorId)
    .eq('is_active', true)
  
  // Create new rate
  const { error } = await supabase
    .from('instructor_payout_rates')
    .insert({
      instructor_id: instructorId,
      flight_instruction_payout_cents: flightRateInt,
      ground_instruction_payout_cents: groundRateInt,
      payout_model: 'hourly',
      instant_payout_enabled: true,
      instant_payout_fee_covered_by_dsa: false,
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true,
      created_by: adminId,
      updated_by: adminId,
    })
  
  if (error) throw error
  return { success: true }
}

/**
 * Assign student to instructor
 */
export async function assignStudentToInstructor(
  studentId: string,
  newInstructorId: string,
  syllabusId: string
) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Check if student has existing active enrollment
  const { data: existingEnrollment } = await supabase
    .from('student_enrollments')
    .select('id, instructor_id')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .single()
  
  if (existingEnrollment) {
    // Update existing enrollment
    const { error } = await supabase
      .from('student_enrollments')
      .update({
        instructor_id: newInstructorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingEnrollment.id)
    
    if (error) throw error
  } else {
    // Create new enrollment
    const { error } = await supabase
      .from('student_enrollments')
      .insert({
        student_id: studentId,
        instructor_id: newInstructorId,
        syllabus_id: syllabusId,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
      })
    
    if (error) throw error
  }
  
  // Create notification for student
  await supabase.from('notifications').insert({
    type: 'instructor_assigned',
    title: 'Instructor Assigned',
    message: 'You have been assigned to a new instructor.',
    user_id: studentId,
    is_read: false,
    created_at: new Date().toISOString(),
  })
  
  return { success: true }
}

/**
 * Send Stripe Connect setup email to instructor
 */
export async function sendStripeConnectEmail(instructorId: string, instructorEmail: string, instructorName: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Generate Stripe Connect onboarding link (you'll need to implement this with your Stripe integration)
  const connectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/instructor/stripe-connect`
  
  // Send email using your email service
  const { sendEmail } = await import('@/lib/email-service')
  
  await sendEmail({
    to: instructorEmail,
    subject: 'Complete Your Stripe Connect Setup - Desert Skies Aviation',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Complete Your Stripe Connect Setup</h1>
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
          <p>Hello ${instructorName},</p>
          <p>To receive payments for your flight instruction services, please complete your Stripe Connect setup.</p>
          <p>Stripe Connect allows you to:</p>
          <ul>
            <li>Receive instant payouts after each flight</li>
            <li>Track your earnings in real-time</li>
            <li>Manage your payment preferences</li>
          </ul>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${connectUrl}" style="display: inline-block; padding: 16px 40px; background-color: #0369a1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Complete Stripe Setup
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will remain active for 7 days. If you have any questions, please contact us.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${instructorName},

To receive payments for your flight instruction services, please complete your Stripe Connect setup.

Complete your setup here: ${connectUrl}

This link will remain active for 7 days.

Best regards,
Desert Skies Aviation
    `,
    from: 'Desert Skies Aviation <noreply@desertskiesaviationaz.com>',
    reply_to: 'thomas@desertskiesaviationaz.com'
  })
  
  // Log the email sent
  await supabase.from('notifications').insert({
    type: 'stripe_connect_reminder',
    title: 'Stripe Connect Setup Email Sent',
    message: 'An email has been sent to complete your Stripe Connect setup.',
    user_id: instructorId,
    is_read: false,
    created_at: new Date().toISOString(),
  })
  
  return { success: true }
}

/**
 * Get available students for assignment (students without active enrollment or with another instructor)
 */
export async function getAvailableStudentsForAssignment() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Get all students
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('status', 'active')
    .order('first_name')
  
  if (!allProfiles) return []
  
  // Filter to only students with student role
  const students = []
  for (const profile of allProfiles) {
    const { data: rolesData } = await supabase.rpc('get_user_roles_for_middleware', { 
      p_user_id: profile.id 
    })
    
    if (rolesData) {
      const roles = rolesData.map((r: any) => r.role_name)
      if (roles.includes('student')) {
        // Get current enrollment info
        const { data: enrollment } = await supabase
          .from('student_enrollments')
          .select(`
            status,
            instructor:instructor_id (first_name, last_name)
          `)
          .eq('student_id', profile.id)
          .eq('status', 'active')
          .single()
        
        students.push({
          ...profile,
          current_instructor: enrollment?.instructor ? 
            `${enrollment.instructor.first_name} ${enrollment.instructor.last_name}` : 
            'No instructor assigned',
          has_active_enrollment: !!enrollment
        })
      }
    }
  }
  
  return students
}

/**
 * Get available syllabi for student assignment
 */
export async function getAvailableSyllabi() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data, error } = await supabase
    .from('syllabi')
    .select('id, title, faa_type, description')
    .eq('is_active', true)
    .order('title')
  
  if (error) throw error
  return data || []
}

