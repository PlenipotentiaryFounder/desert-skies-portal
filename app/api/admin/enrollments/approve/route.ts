import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email-service'

/**
 * Approve Student Enrollment
 * Called by admin to approve a pending enrollment
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get authenticated admin user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === 'admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { enrollmentId, instructorId, syllabusId, approvalNotes, approvedBy } = await request.json()

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 })
    }

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('student_enrollments')
      .select(`
        *,
        student:profiles!student_enrollments_student_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        instructor:profiles!student_enrollments_instructor_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        syllabus:syllabi(
          id,
          title,
          faa_type,
          code
        )
      `)
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Build update object
    const updateData: any = {
      status: 'active',
      approved_by: approvedBy || user.id,
      approved_at: new Date().toISOString(),
      approval_notes: approvalNotes || null,
      updated_at: new Date().toISOString()
    }

    // Update instructor and syllabus if provided
    if (instructorId) updateData.instructor_id = instructorId
    if (syllabusId) updateData.syllabus_id = syllabusId

    // Update enrollment status to active
    const { error: updateError } = await supabase
      .from('student_enrollments')
      .update(updateData)
      .eq('id', enrollmentId)

    if (updateError) {
      console.error('Error updating enrollment:', updateError)
      return NextResponse.json({ error: 'Failed to approve enrollment' }, { status: 500 })
    }

    // Send email notification to student
    try {
      await sendEmail({
        to: enrollment.student.email,
        subject: '🎉 Your Enrollment Has Been Approved!',
        html: `
          <h2>Welcome to Desert Skies Aviation!</h2>
          <p>Hi ${enrollment.student.first_name},</p>
          <p>Great news! Your enrollment has been approved and you're ready to start your flight training journey.</p>
          
          <h3>Your Training Details:</h3>
          <ul>
            <li><strong>Program:</strong> ${enrollment.syllabus?.title || 'To be determined'}</li>
            <li><strong>Instructor:</strong> ${enrollment.instructor ? `${enrollment.instructor.first_name} ${enrollment.instructor.last_name}` : 'To be assigned'}</li>
            <li><strong>Start Date:</strong> ${new Date(enrollment.start_date).toLocaleDateString()}</li>
          </ul>
          
          <h3>Next Steps:</h3>
          <ol>
            <li><strong>Initial Deposit:</strong> We recommend a $1,500 deposit to get started (flexible, pay-as-you-go available)</li>
            <li><strong>Schedule Your First Lesson:</strong> Log in to your dashboard and schedule your first training session</li>
            <li><strong>Set Up Fuel Account:</strong> Create an account with Cunningham Aviation for fuel purchases</li>
            <li><strong>Review Study Materials:</strong> Access your training materials in the student portal</li>
          </ol>
          
          ${approvalNotes ? `<div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0;"><p><strong>Note from Admin:</strong><br/>${approvalNotes}</p></div>` : ''}
          
          <p>If you have any questions, please don't hesitate to reach out to your instructor or our administrative team.</p>
          
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/student/dashboard" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px;">Go to Dashboard</a></p>
          
          <p>Blue skies ahead!<br/>The Desert Skies Aviation Team</p>
        `
      })
    } catch (emailError) {
      console.error('Error sending approval email:', emailError)
      // Don't fail the approval if email fails
    }

    // Send notification to instructor
    if (enrollment.instructor) {
      try {
        await sendEmail({
          to: enrollment.instructor.email,
          subject: 'Student Enrollment Approved - Ready to Start Training',
          html: `
            <h2>Student Enrollment Approved</h2>
            <p>Hi ${enrollment.instructor.first_name},</p>
            <p>A new student enrollment has been approved and is ready to begin training with you:</p>
            
            <h3>Student Details:</h3>
            <ul>
              <li><strong>Name:</strong> ${enrollment.student.first_name} ${enrollment.student.last_name}</li>
              <li><strong>Email:</strong> ${enrollment.student.email}</li>
              <li><strong>Program:</strong> ${enrollment.syllabus?.title || 'To be determined'}</li>
              <li><strong>Start Date:</strong> ${new Date(enrollment.start_date).toLocaleDateString()}</li>
            </ul>
            
            <p>The student can now schedule training sessions with you. You'll receive notifications when they request sessions.</p>
            
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/instructor/students" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px;">View My Students</a></p>
          `
        })
      } catch (emailError) {
        console.error('Error sending instructor notification:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment approved successfully'
    })

  } catch (error) {
    console.error('Error approving enrollment:', error)
    return NextResponse.json(
      { error: 'Failed to approve enrollment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

