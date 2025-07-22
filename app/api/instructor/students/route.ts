import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an instructor
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', user.id)
      .single()

    const { data: role } = await supabase
      .from('roles')
      .select('name')
      .eq('id', userRole?.role_id)
      .single()

    if (role?.name !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get students enrolled with this instructor
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_enrollments')
      .select(`
        student_id,
        syllabus_id,
        start_date,
        status,
        progress,
        syllabi(name)
      `)
      .eq('instructor_id', user.id)

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        students: [],
        totalStudents: 0,
        activeStudents: 0
      })
    }

    // Get student profiles for enrolled students
    const studentIds = enrollments.map(e => e.student_id)
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        status,
        created_at
      `)
      .in('id', studentIds)

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }



    // Get flight sessions for each student
    const { data: flightSessions, error: sessionsError } = await supabase
      .from('flight_sessions')
      .select(`
        id,
        student_id,
        instructor_id,
        date,
        start_time,
        end_time,
        status,
        notes
      `)
      .eq('instructor_id', user.id)
      .order('date', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching flight sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch flight sessions' }, { status: 500 })
    }

    // Get flight log entries for each student
    const { data: flightLogs, error: logsError } = await supabase
      .from('flight_log_entries')
      .select(`
        id,
        student_id,
        session_id,
        date,
        aircraft_type,
        aircraft_registration,
        hobbs_start,
        hobbs_end,
        solo_time,
        cross_country_time,
        night_time,
        instrument_time,
        maneuvers_practiced,
        notes
      `)
      .order('date', { ascending: false })

    if (logsError) {
      console.error('Error fetching flight logs:', logsError)
      return NextResponse.json({ error: 'Failed to fetch flight logs' }, { status: 500 })
    }

    // Combine the data
    const studentsWithDetails = students?.map(student => {
      const studentEnrollments = enrollments?.filter(e => e.student_id === student.id) || []
      const studentSessions = flightSessions?.filter(s => s.student_id === student.id) || []
      const studentLogs = flightLogs?.filter(l => l.student_id === student.id) || []

      // Calculate total flight hours
      const totalHours = studentLogs.reduce((sum, log) => {
        const duration = (log.hobbs_end || 0) - (log.hobbs_start || 0)
        return sum + duration
      }, 0)

      const soloHours = studentLogs.reduce((sum, log) => sum + (log.solo_time || 0), 0)
      const crossCountryHours = studentLogs.reduce((sum, log) => sum + (log.cross_country_time || 0), 0)
      const nightHours = studentLogs.reduce((sum, log) => sum + (log.night_time || 0), 0)

      // Get next scheduled session
      const nextSession = studentSessions
        .filter(s => s.status === 'scheduled' && new Date(s.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

      return {
        ...student,
        enrollments: studentEnrollments.map(e => ({
          id: e.student_id, // Use student_id as the enrollment ID
          syllabus_name: e.syllabi?.name || 'Unknown Syllabus',
          start_date: e.start_date,
          status: e.status,
          progress: e.progress || {}
        })),
        recentSessions: studentSessions.slice(0, 5),
        nextSession,
        totalFlightHours: totalHours,
        soloHours,
        crossCountryHours,
        nightHours,
        // Mock data for now - these would come from separate tables in a real implementation
        maneuverScores: [
          { maneuver: 'Steep Turns', score: 85, date: '2024-01-20', notes: 'Good control, needs work on altitude maintenance' },
          { maneuver: 'Slow Flight', score: 78, date: '2024-01-18', notes: 'Improving, but still needs practice' },
          { maneuver: 'Stalls', score: 92, date: '2024-01-15', notes: 'Excellent recovery technique' },
          { maneuver: 'Landings', score: 88, date: '2024-01-12', notes: 'Consistent approach, good flare timing' }
        ],
        acsProgress: [
          { area: 'Preflight Preparation', completed: 8, total: 8, status: 'completed' },
          { area: 'Preflight Procedures', completed: 6, total: 8, status: 'in_progress' },
          { area: 'Airport Operations', completed: 4, total: 6, status: 'in_progress' },
          { area: 'Takeoffs & Landings', completed: 3, total: 8, status: 'in_progress' },
          { area: 'Performance Calculations', completed: 2, total: 4, status: 'in_progress' },
          { area: 'Navigation', completed: 1, total: 6, status: 'not_started' }
        ],
        instructorNotes: [
          'Strong student with excellent attitude and dedication',
          'Shows natural flying ability and good decision-making',
          'Needs more practice with crosswind landings',
          'Ready for solo flight endorsement'
        ]
      }
    })

    return NextResponse.json({
      students: studentsWithDetails,
      totalStudents: studentsWithDetails?.length || 0,
      activeStudents: studentsWithDetails?.filter(s => s.status === 'active').length || 0
    })

  } catch (error) {
    console.error('Error in students API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, email, phone_number, date_of_birth } = body

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create user account
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'temporary_password_123', // This should be changed by the user
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name
      }
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        first_name,
        last_name,
        phone_number,
        date_of_birth,
        status: 'active'
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // Get student role ID
    const { data: studentRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'student')
      .single()

    if (studentRole) {
      // Assign student role
      await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role_id: studentRole.id
        })
    }

    // Get the first available syllabus (or create a default one)
    const { data: syllabus } = await supabase
      .from('syllabi')
      .select('id')
      .limit(1)
      .single()

    if (syllabus) {
      // Enroll the student with the current instructor
      await supabase
        .from('student_enrollments')
        .insert({
          student_id: authUser.user.id,
          instructor_id: user.id,
          syllabus_id: syllabus.id,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active'
        })
    }

    return NextResponse.json({
      message: 'Student created successfully',
      student: {
        id: authUser.user.id,
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        status: 'active'
      }
    })

  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 