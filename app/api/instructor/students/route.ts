import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

function calculateFlightHours(flightLogs: any[]) {
  let totalHours = 0
  let soloHours = 0
  let crossCountryHours = 0
  let nightHours = 0

  flightLogs.forEach(log => {
    const duration = (log.hobbs_end || 0) - (log.hobbs_start || 0)
    totalHours += duration

    // Categorize hours based on log entries
    if (log.solo_time) soloHours += log.solo_time
    if (log.cross_country_time) crossCountryHours += log.cross_country_time
    if (log.night_time) nightHours += log.night_time
  })

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    soloHours: Math.round(soloHours * 10) / 10,
    crossCountryHours: Math.round(crossCountryHours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10
  }
}

function calculateSessionDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0

  const start = new Date(`1970-01-01T${startTime}`)
  const end = new Date(`1970-01-01T${endTime}`)

  const diffMs = end.getTime() - start.getTime()
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10 // Convert to hours with 1 decimal
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // For now, skip role verification since it may not be properly configured
    // In a production environment, you would verify the user has instructor permissions

    // Get students enrolled with this instructor using the student_enrollments table
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_enrollments')
      .select(`
        *,
        student:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          status
        ),
        syllabus:syllabus_id (
          name,
          description,
          category
        )
      `)
      .eq('instructor_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
      return NextResponse.json({ error: 'Failed to fetch student enrollments' }, { status: 500 })
    }

    // Transform enrollments to match the expected format
    const students = await Promise.all(enrollments?.map(async (enrollment) => {
      const studentId = enrollment.student.id

      // Get flight sessions for this student
      const { data: flightSessions, error: sessionsError } = await supabase
        .from('flight_sessions')
        .select(`
          *,
          student_enrollments!flight_sessions_enrollment_id_fkey(student_id),
          aircraft(tail_number, make, model),
          profiles!flight_sessions_instructor_id_fkey(first_name, last_name)
        `)
        .eq('student_enrollments.student_id', studentId)
        .order('date', { ascending: false })
        .limit(5)

      if (sessionsError) {
        console.warn(`Error fetching sessions for student ${studentId}:`, sessionsError)
      }

      // Get flight log entries for this student
      const { data: flightLogs, error: logsError } = await supabase
        .from('flight_log_entries')
        .select('*')
        .eq('student_id', studentId)

      if (logsError) {
        console.warn(`Error fetching flight logs for student ${studentId}:`, logsError)
      }

      // Calculate flight hours from flight logs
      const flightData = calculateFlightHours(flightLogs || [])

      return {
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
        // Flight data calculated from database
        totalFlightHours: flightData.totalHours,
        soloHours: flightData.soloHours,
        crossCountryHours: flightData.crossCountryHours,
        nightHours: flightData.nightHours,
        recentSessions: (flightSessions || []).map(session => ({
          id: session.id,
          date: session.date,
          start_time: session.start_time,
          end_time: session.end_time,
          duration: calculateSessionDuration(session.start_time, session.end_time),
          aircraft: session.aircraft?.tail_number || 'Unknown',
          instructor: session.profiles ?
            `${session.profiles.first_name} ${session.profiles.last_name}` :
            'Unknown Instructor',
          status: session.status
        })),
        nextSession: null, // TODO: Implement logic for next session
        maneuverScores: [], // TODO: Calculate from session_elements table
        acsProgress: [],
        instructorNotes: []
      }
    }) || [])

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

 