import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email-service'

/**
 * Reject Student Enrollment
 * Called by admin to reject a pending enrollment
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

    const { enrollmentId, rejectionNotes, rejectedBy } = await request.json()

    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 })
    }

    if (!rejectionNotes || !rejectionNotes.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
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
        )
      `)
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Update enrollment status to cancelled
    const { error: updateError } = await supabase
      .from('student_enrollments')
      .update({
        status: 'cancelled',
        approved_by: rejectedBy || user.id,
        approved_at: new Date().toISOString(),
        approval_notes: rejectionNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollmentId)

    if (updateError) {
      console.error('Error updating enrollment:', updateError)
      return NextResponse.json({ error: 'Failed to reject enrollment' }, { status: 500 })
    }

    // Send email notification to student
    try {
      await sendEmail({
        to: enrollment.student.email,
        subject: 'Update on Your Enrollment Application',
        html: `
          <h2>Enrollment Application Status</h2>
          <p>Hi ${enrollment.student.first_name},</p>
          <p>Thank you for your interest in Desert Skies Aviation. After reviewing your enrollment application, we're unable to approve it at this time.</p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 20px 0;">
            <p><strong>Reason:</strong><br/>${rejectionNotes}</p>
          </div>
          
          <p>If you have any questions or would like to discuss this decision, please don't hesitate to contact our administrative team at <a href="mailto:admin@desertskiesaviationaz.com">admin@desertskiesaviationaz.com</a> or call us at (480) XXX-XXXX.</p>
          
          <p>We appreciate your interest and wish you the best in your aviation journey.</p>
          
          <p>Best regards,<br/>The Desert Skies Aviation Team</p>
        `
      })
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError)
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment rejected'
    })

  } catch (error) {
    console.error('Error rejecting enrollment:', error)
    return NextResponse.json(
      { error: 'Failed to reject enrollment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

