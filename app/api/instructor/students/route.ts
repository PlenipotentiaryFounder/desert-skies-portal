import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get students enrolled with this instructor using the same pattern as the working instructor/students page
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_enrollments')
      .select(`
        *,
        student:student_id (
          first_name,
          last_name,
          email,
          avatar_url,
          status
        ),
        syllabus:syllabus_id (
          name,
          description
        )
      `)
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
    }

    // Transform enrollments to match the expected format
    const students = enrollments?.map(enrollment => ({
      id: enrollment.student.id,
      first_name: enrollment.student.first_name,
      last_name: enrollment.student.last_name,
      email: enrollment.student.email,
      avatar_url: enrollment.student.avatar_url,
      status: enrollment.student.status,
      enrollments: [{
        id: enrollment.id,
        syllabus_name: enrollment.syllabus?.name || 'Unknown Syllabus',
        start_date: enrollment.start_date,
        status: enrollment.status,
        progress: enrollment.progress || {}
      }],
      // Mock data for dashboard display
      totalFlightHours: 0,
      soloHours: 0,
      crossCountryHours: 0,
      nightHours: 0,
      recentSessions: [],
      nextSession: null,
      maneuverScores: [],
      acsProgress: [],
      instructorNotes: []
    })) || []

    return NextResponse.json({
      students,
      totalStudents: students.length,
      activeStudents: students.filter(s => s.status === 'active').length
    })

  } catch (error) {
    console.error('Error in students API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

 