import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { sendEmail } from '@/lib/email-service'
import { createStudentInstructorAccount } from '@/lib/instructor-billing-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

/**
 * Complete Student Onboarding
 * This endpoint is called when a student completes their onboarding process.
 * It handles:
 * 1. Creating a pending enrollment (awaiting admin approval)
 * 2. Creating a Stripe customer
 * 3. Creating billing account
 * 4. Sending email notifications to admin and selected instructor (if any)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get onboarding data
    const { data: onboarding, error: onboardingError } = await supabase
      .from('student_onboarding')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (onboardingError || !onboarding) {
      return NextResponse.json({ error: 'Onboarding data not found' }, { status: 404 })
    }

    // 1. Mark onboarding as completed
    const { error: updateError } = await supabase
      .from('student_onboarding')
      .update({
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating onboarding:', updateError)
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
    }

    // 2. Create Stripe customer
    let stripeCustomerId = profile.stripe_customer_id
    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: profile.email,
          name: `${profile.first_name} ${profile.last_name}`,
          phone: profile.phone_number || undefined,
          metadata: {
            user_id: user.id,
            profile_id: profile.id,
            onboarding_completed: new Date().toISOString(),
            desired_program: onboarding.desired_program || 'unknown'
          }
        })
        stripeCustomerId = customer.id

        // Update profile with Stripe customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', user.id)
      } catch (stripeError) {
        console.error('Error creating Stripe customer:', stripeError)
        // Continue even if Stripe fails - can be created later
      }
    }

    // 3. Get default instructor (Thomas Ferrier) for initial setup
    const { data: defaultInstructor } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('email', 'thomas@desertskiesaviationaz.com')
      .single()

    let enrollmentId: string | null = null
    let instructorId: string | null = null

    if (defaultInstructor) {
      instructorId = defaultInstructor.id

      // 4. Create pending enrollment (requires admin approval)
      // Get syllabus based on desired program
      let syllabusQuery = supabase
        .from('syllabi')
        .select('id')
        .eq('is_active', true)

      // Map desired program to syllabus category
      const programCategoryMap: Record<string, string> = {
        'private_pilot': 'private',
        'instrument_rating': 'instrument',
        'commercial_pilot': 'commercial',
        'multi_engine': 'multi-engine',
        'flight_instructor': 'instructor'
      }

      const category = programCategoryMap[onboarding.desired_program] || 'private'
      syllabusQuery = syllabusQuery.eq('category', category)

      const { data: syllabus } = await syllabusQuery.limit(1).single()

      if (syllabus) {
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('student_enrollments')
          .insert({
            student_id: user.id,
            instructor_id: instructorId,
            syllabus_id: syllabus.id,
            start_date: new Date().toISOString().split('T')[0],
            status: 'pending_approval', // Admin must approve
            notes: `Onboarding completed. Desired program: ${onboarding.desired_program || 'Not specified'}. 
Medical: ${onboarding.medical_certificate_class || 'Not specified'}. 
TSA Status: ${onboarding.tsa_citizenship_status || 'Not specified'}.`
          })
          .select('id')
          .single()

        if (!enrollmentError && enrollment) {
          enrollmentId = enrollment.id
        }
      }

      // 5. Create billing account (even if enrollment is pending)
      if (instructorId) {
        try {
          await createStudentInstructorAccount(
            user.id,
            instructorId,
            'flexible' // Default account type
          )
        } catch (billingError) {
          console.error('Error creating billing account:', billingError)
          // Continue - can be created later
        }
      }
    }

    // 6. Send email notification to admin
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await sendEmail({
            to: admin.email,
            subject: 'New Student Enrollment - Approval Required',
            html: `
              <h2>New Student Enrollment</h2>
              <p>A new student has completed their onboarding and is awaiting approval:</p>
              <ul>
                <li><strong>Name:</strong> ${profile.first_name} ${profile.last_name}</li>
                <li><strong>Email:</strong> ${profile.email}</li>
                <li><strong>Phone:</strong> ${profile.phone_number || 'Not provided'}</li>
                <li><strong>Desired Program:</strong> ${onboarding.desired_program || 'Not specified'}</li>
                <li><strong>Medical Class:</strong> ${onboarding.medical_certificate_class || 'Not specified'}</li>
                <li><strong>Pilot Certificate:</strong> ${onboarding.pilot_certificate_type || 'Not specified'}</li>
                <li><strong>TSA Status:</strong> ${onboarding.tsa_citizenship_status || 'Not specified'}</li>
              </ul>
              <h3>Action Required:</h3>
              <ol>
                <li>Review uploaded documents (ID, medical certificate, pilot certificate)</li>
                <li>Verify student information</li>
                <li>Assign to instructor (currently assigned to ${defaultInstructor?.first_name || 'Thomas Ferrier'})</li>
                <li>Approve enrollment</li>
                <li>Request initial deposit ($1,500 for training programs, waived for discovery flights)</li>
              </ol>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/enrollments/pending" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">Review Enrollment</a></p>
            `
          })
        }
      }
    } catch (emailError) {
      console.error('Error sending admin email:', emailError)
      // Continue - email is not critical
    }

    // 7. Send email notification to assigned instructor (if any)
    if (defaultInstructor) {
      try {
        await sendEmail({
          to: defaultInstructor.email,
          subject: 'New Student Assigned - Pending Admin Approval',
          html: `
            <h2>New Student Assignment</h2>
            <p>Hi ${defaultInstructor.first_name},</p>
            <p>A new student has been assigned to you and is awaiting admin approval:</p>
            <ul>
              <li><strong>Name:</strong> ${profile.first_name} ${profile.last_name}</li>
              <li><strong>Email:</strong> ${profile.email}</li>
              <li><strong>Phone:</strong> ${profile.phone_number || 'Not provided'}</li>
              <li><strong>Desired Program:</strong> ${onboarding.desired_program || 'Not specified'}</li>
            </ul>
            <p>Once the admin approves this enrollment, you'll be able to schedule training sessions with this student.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/instructor/students" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">View My Students</a></p>
          `
        })
      } catch (emailError) {
        console.error('Error sending instructor email:', emailError)
        // Continue - email is not critical
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        enrollment_id: enrollmentId,
        stripe_customer_id: stripeCustomerId,
        status: 'pending_approval'
      }
    })

  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

