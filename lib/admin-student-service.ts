"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { cache } from "react"

/**
 * Comprehensive student data with all relationships
 */
export interface AdminStudentData {
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
  
  // Enrollment data
  enrollments: {
    id: string
    status: string
    start_date: string
    syllabus: {
      title: string
      faa_type: string
    } | null
    instructor: {
      first_name: string
      last_name: string
    } | null
  }[]
  
  // Progress summary
  progress: {
    total_flight_hours: number
    total_missions: number
    acs_completion: number
    requirements_completion: number
  }
  
  // Billing summary
  billing: {
    current_balance: number
    total_invoiced: number
    total_paid: number
    last_payment_date: string | null
  }
  
  // Documents status
  documents: {
    medical_certificate_status: 'valid' | 'expiring' | 'expired' | 'missing'
    medical_expiration: string | null
    student_pilot_certificate_status: 'valid' | 'missing'
    government_id_status: 'valid' | 'missing'
  }
  
  // Onboarding
  onboarding: {
    completed: boolean
    current_step: string | null
    completed_at: string | null
  }
  
  // Recent activity
  last_flight_date: string | null
  last_login_date: string | null
}

/**
 * Get all students with comprehensive data for admin dashboard
 * Cached to prevent duplicate fetches during React rendering
 */
export const getAdminStudents = cache(async (): Promise<AdminStudentData[]> => {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  console.log('[getAdminStudents] Starting fetch...')
  
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
      created_at
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  if (profilesError) {
    console.error('[getAdminStudents] Error fetching profiles:', profilesError)
    return []
  }
  
  console.log('[getAdminStudents] Fetched', allProfiles?.length || 0, 'total profiles')
  
  if (!allProfiles || allProfiles.length === 0) {
    console.log('[getAdminStudents] No profiles found')
    return []
  }
  
  // Get roles for each user using the RPC function
  const studentsWithRoles = []
  for (const profile of allProfiles) {
    const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles_for_middleware', { 
      p_user_id: profile.id 
    })
    
    if (!rolesError && rolesData) {
      const roles = rolesData.map((r: any) => r.role_name)
      // Only include users who have the 'student' role
      if (roles.includes('student')) {
        studentsWithRoles.push(profile)
      }
    }
  }
  
  const students = studentsWithRoles
  console.log('[getAdminStudents] Found', students.length, 'students with student role')
  
  // Build comprehensive data for each student
  const studentsWithData: AdminStudentData[] = []
  
  console.log('[getAdminStudents] Building data for', students.length, 'students...')
  
  for (const student of students) {
    console.log('[getAdminStudents] Processing student:', student.id, student.email)
    
    // Get enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select(`
        id,
        status,
        start_date,
        syllabus:syllabus_id (
          title,
          faa_type
        ),
        instructor:instructor_id (
          first_name,
          last_name
        )
      `)
      .eq('student_id', student.id)
    
    if (enrollError) {
      console.error('[getAdminStudents] Error fetching enrollments for', student.id, enrollError)
    }
    
    // Get flight hours from missions
    const { data: missions } = await supabase
      .from('missions')
      .select('actual_flight_hours, actual_ground_hours')
      .eq('student_id', student.id)
      .eq('status', 'completed')
    
    const total_flight_hours = missions?.reduce((sum, m) => sum + (m.actual_flight_hours || 0), 0) || 0
    
    // Get mission count
    const { count: missionCount } = await supabase
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', student.id)
    
    // Get ACS progress
    const { data: acsProgress } = await supabase
      .from('student_acs_progress')
      .select('proficiency_level')
      .eq('student_id', student.id)
    
    const acsCompletion = acsProgress && acsProgress.length > 0
      ? (acsProgress.filter(p => p.proficiency_level >= 3).length / acsProgress.length) * 100
      : 0
    
    // Get billing data
    const { data: account } = await supabase
      .from('student_accounts')
      .select('current_balance')
      .eq('student_id', student.id)
      .single()
    
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, status, paid_date')
      .eq('student_id', student.id)
    
    const total_invoiced = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
    const total_paid = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
    const last_payment_date = invoices?.filter(inv => inv.paid_date).sort((a, b) => 
      new Date(b.paid_date!).getTime() - new Date(a.paid_date!).getTime()
    )[0]?.paid_date || null
    
    // Get documents status
    const { data: documents } = await supabase
      .from('documents')
      .select('document_type_id, expiration_date, document_types(name)')
      .eq('user_id', student.id)
    
    const medicalCert = documents?.find((d: any) => d.document_types?.name?.toLowerCase().includes('medical'))
    const studentCert = documents?.find((d: any) => d.document_types?.name?.toLowerCase().includes('student pilot'))
    const govId = documents?.find((d: any) => d.document_types?.name?.toLowerCase().includes('government id') || d.document_types?.name?.toLowerCase().includes('id'))
    
    const getMedicalStatus = (cert: any): 'valid' | 'expiring' | 'expired' | 'missing' => {
      if (!cert) return 'missing'
      if (!cert.expiration_date) return 'valid'
      const expDate = new Date(cert.expiration_date)
      const now = new Date()
      const daysUntilExp = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (daysUntilExp < 0) return 'expired'
      if (daysUntilExp < 30) return 'expiring'
      return 'valid'
    }
    
    // Get onboarding status
    const { data: onboarding } = await supabase
      .from('student_onboarding')
      .select('current_step, completed_at')
      .eq('user_id', student.id)
      .single()
    
    // Get last flight date
    const { data: lastMission } = await supabase
      .from('missions')
      .select('scheduled_date')
      .eq('student_id', student.id)
      .order('scheduled_date', { ascending: false })
      .limit(1)
      .single()
    
    studentsWithData.push({
      ...student,
      enrollments: enrollments || [],
      progress: {
        total_flight_hours,
        total_missions: missionCount || 0,
        acs_completion: Math.round(acsCompletion),
        requirements_completion: 0 // TODO: Calculate from FAA requirements
      },
      billing: {
        current_balance: account?.current_balance || 0,
        total_invoiced,
        total_paid,
        last_payment_date
      },
      documents: {
        medical_certificate_status: getMedicalStatus(medicalCert),
        medical_expiration: medicalCert?.expiration_date || null,
        student_pilot_certificate_status: studentCert ? 'valid' : 'missing',
        government_id_status: govId ? 'valid' : 'missing'
      },
      onboarding: {
        completed: !!onboarding?.completed_at,
        current_step: onboarding?.current_step || null,
        completed_at: onboarding?.completed_at || null
      },
      last_flight_date: lastMission?.scheduled_date || null,
      last_login_date: null // Would need to track this separately
    })
  }
  
  console.log('[getAdminStudents] Completed! Returning', studentsWithData.length, 'students with full data')
  return studentsWithData
})

/**
 * Get detailed student data for modal/detail view
 */
export async function getStudentDetailedData(studentId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Get base profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single()
  
  if (profileError || !profile) {
    throw new Error('Student not found')
  }
  
  // Get all related data in parallel
  const [
    enrollmentsRes,
    missionsRes,
    acsProgressRes,
    documentsRes,
    invoicesRes,
    accountRes,
    onboardingRes,
    logbookRes
  ] = await Promise.all([
    supabase.from('student_enrollments').select(`
      *,
      syllabus:syllabus_id (title, faa_type, description),
      instructor:instructor_id (first_name, last_name, email, phone_number)
    `).eq('student_id', studentId),
    
    supabase.from('missions').select(`
      *,
      instructor:instructor_id (first_name, last_name)
    `).eq('student_id', studentId).order('scheduled_date', { ascending: false }).limit(10),
    
    supabase.from('student_acs_progress').select(`
      *,
      acs_task:acs_task_id (
        task_code,
        title,
        acs_area:acs_area_id (area_code, title)
      )
    `).eq('student_id', studentId).order('last_evaluated', { ascending: false }),
    
    supabase.from('documents').select(`
      *,
      document_type:document_type_id (name, description)
    `).eq('user_id', studentId),
    
    supabase.from('invoices').select('*').eq('student_id', studentId).order('created_at', { ascending: false }).limit(10),
    
    supabase.from('student_accounts').select('*').eq('student_id', studentId).single(),
    
    supabase.from('student_onboarding').select('*').eq('user_id', studentId).single(),
    
    supabase.from('flight_log_entries').select('*').eq('user_id', studentId).order('flight_date', { ascending: false }).limit(10)
  ])
  
  return {
    profile,
    enrollments: enrollmentsRes.data || [],
    missions: missionsRes.data || [],
    acsProgress: acsProgressRes.data || [],
    documents: documentsRes.data || [],
    invoices: invoicesRes.data || [],
    account: accountRes.data,
    onboarding: onboardingRes.data,
    logbook: logbookRes.data || []
  }
}

/**
 * Send student invitation email
 */
export async function sendStudentInvitation(email: string, firstName: string, lastName: string) {
  // This will integrate with your existing email-service.ts
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`
  
  const emailTemplate = {
    subject: 'Welcome to Desert Skies Aviation - Complete Your Registration',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Desert Skies Aviation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 30px; background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      Welcome to Desert Skies Aviation
                    </h1>
                    <p style="margin: 10px 0 0; color: #e0f2fe; font-size: 16px;">
                      Your journey to the skies begins here
                    </p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                      Hello ${firstName},
                    </p>
                    <p style="margin: 0 0 20px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                      We're excited to welcome you to Desert Skies Aviation! You've been invited to join our flight training program through our comprehensive student portal.
                    </p>
                    <p style="margin: 0 0 30px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                      Our portal provides you with everything you need to succeed in your flight training:
                    </p>
                    
                    <ul style="margin: 0 0 30px; padding-left: 20px; color: #1f2937; font-size: 16px; line-height: 1.8;">
                      <li>Track your progress toward your pilot certificate</li>
                      <li>Schedule flight sessions with your instructor</li>
                      <li>Access digital logbook and training records</li>
                      <li>View lesson plans and training materials</li>
                      <li>Monitor your ACS (Airman Certification Standards) proficiency</li>
                      <li>Manage billing and account balance</li>
                      <li>Upload and store required documents</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="${inviteLink}" style="display: inline-block; padding: 16px 40px; background-color: #0369a1; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                        Complete Your Registration
                      </a>
                    </div>
                    
                    <p style="margin: 30px 0 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #0369a1; color: #1e40af; font-size: 14px; line-height: 1.6;">
                      <strong>Note:</strong> This invitation link will remain active for 7 days. If you have any questions or need assistance, please don't hesitate to contact us.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                      <strong>Desert Skies Aviation</strong><br>
                      Scottsdale, Arizona<br>
                      Phone: (480) 264-0865<br>
                      Email: thomas@desertskiesaviationaz.com
                    </p>
                    <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px;">
                      This email was sent to ${email}. If you believe you received this email in error, please contact us.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Welcome to Desert Skies Aviation

Hello ${firstName},

We're excited to welcome you to Desert Skies Aviation! You've been invited to join our flight training program through our comprehensive student portal.

Our portal provides you with everything you need to succeed in your flight training:
- Track your progress toward your pilot certificate
- Schedule flight sessions with your instructor
- Access digital logbook and training records
- View lesson plans and training materials
- Monitor your ACS (Airman Certification Standards) proficiency
- Manage billing and account balance
- Upload and store required documents

Complete your registration by clicking this link:
${inviteLink}

Note: This invitation link will remain active for 7 days. If you have any questions or need assistance, please don't hesitate to contact us.

Desert Skies Aviation
Scottsdale, Arizona
Phone: (480) 264-0865
Email: thomas@desertskiesaviationaz.com

This email was sent to ${email}. If you believe you received this email in error, please contact us.
    `
  }
  
  // Use existing email service
  const { sendEmail } = await import('@/lib/email-service')
  return await sendEmail({
    to: email,
    subject: emailTemplate.subject,
    html: emailTemplate.html,
    text: emailTemplate.text,
    from: 'Desert Skies Aviation <noreply@desertskiesaviationaz.com>',
    reply_to: 'thomas@desertskiesaviationaz.com'
  })
}

