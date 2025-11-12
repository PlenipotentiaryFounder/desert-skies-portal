import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params
    console.log('API: Fetching details for student:', studentId)
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log('API: User auth result:', { user: user?.id, error: userError })

    if (userError || !user) {
      console.log('API: Authentication failed')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student profile
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      console.log('API: Student not found:', studentError)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Verify instructor is assigned to this student
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('student_enrollments')
      .select(`
        *,
        syllabus:syllabi(title, description),
        instructor:profiles!student_enrollments_instructor_id_fkey(first_name, last_name)
      `)
      .eq('student_id', studentId)
      .eq('instructor_id', user.id)
      .eq('status', 'active')

    if (enrollmentError || !enrollments || enrollments.length === 0) {
      console.log('API: No active enrollment found:', enrollmentError)
      return NextResponse.json({ error: "Not authorized to view this student" }, { status: 403 })
    }

    const activeEnrollment = enrollments[0]

    // Get flight sessions for progress calculation
    const { data: flightSessions, error: sessionsError } = await supabase
      .from('flight_sessions')
      .select(`
        *,
        lesson:syllabus_lessons(title, lesson_type),
        aircraft(tail_number, make, model),
        instructor:profiles!flight_sessions_instructor_id_fkey(first_name, last_name)
      `)
      .eq('enrollment_id', activeEnrollment.id)
      .order('date', { ascending: false })

    // Get flight log entries for hours calculation
    const { data: flightLogs, error: logsError } = await supabase
      .from('flight_log_entries')
      .select('*')
      .eq('student_id', studentId)

    // Calculate flight hours
    const flightData = calculateFlightHours(flightLogs || [])

    // Get recent and next sessions
    const recentSessions = flightSessions?.slice(0, 5) || []
    const nextSession = flightSessions?.find(s => 
      new Date(s.date) >= new Date() && s.status === 'scheduled'
    )

    // Get ACS progress
    const { data: acsProgress, error: acsError } = await supabase
      .from('student_acs_progress')
      .select(`
        *,
        acs_task:acs_tasks(
          title,
          acs_area:acs_areas(title, code)
        )
      `)
      .eq('student_id', studentId)

    // Get maneuver scores
    const { data: maneuverScores, error: scoresError } = await supabase
      .from('maneuver_scores')
      .select(`
        *,
        maneuver:maneuvers(name, category)
      `)
      .eq('student_id', studentId)
      .order('scored_at', { ascending: false })

    // Get billing information
    const { data: account, error: accountError } = await supabase
      .from('student_instructor_accounts')
      .select('*')
      .eq('student_id', studentId)
      .eq('instructor_id', user.id)
      .single()

    const { data: rates, error: ratesError } = await supabase
      .from('student_instructor_rates')
      .select('*')
      .eq('student_id', studentId)
      .eq('instructor_id', user.id)
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)

    // Get documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })

    // Process documents with status
    const processedDocuments = (documents || []).map(doc => {
      let status = 'valid'
      if (doc.expiration_date) {
        const expiryDate = new Date(doc.expiration_date)
        const now = new Date()
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry < 0) {
          status = 'expired'
        } else if (daysUntilExpiry <= 30) {
          status = 'expiring_soon'
        }
      }
      
      return {
        id: doc.id,
        type: doc.document_type || 'other',
        name: doc.title,
        status,
        expiry_date: doc.expiration_date,
        uploaded_date: doc.created_at
      }
    })

    // Calculate syllabus progress
    const progressPercentage = calculateSyllabusProgress(activeEnrollment, flightSessions || [])

    // Process ACS progress
    const processedAcsProgress = (acsProgress || []).map(item => ({
      acs_area: item.acs_task?.acs_area?.title || 'Unknown Area',
      acs_task: item.acs_task?.title || 'Unknown Task',
      proficiency: item.proficiency_level || 0,
      status: item.proficiency_level >= 4 ? 'proficient' : 
              item.proficiency_level >= 2 ? 'progressing' : 'not_started',
      last_scored_date: item.updated_at
    }))

    // Process maneuver scores
    const processedManeuverScores = (maneuverScores || []).map(score => ({
      maneuver_name: score.maneuver?.name || 'Unknown Maneuver',
      score: score.score || 0,
      date: score.scored_at,
      instructor_notes: score.instructor_notes
    }))

    const studentData = {
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        phone: student.phone_number,
        bio: student.bio,
        avatar_url: student.avatar_url,
        status: student.status
      },
      enrollment: {
        id: activeEnrollment.id,
        syllabus_name: activeEnrollment.syllabus?.title || 'Unknown Syllabus',
        syllabus_description: activeEnrollment.syllabus?.description || 'Syllabus not found',
        start_date: activeEnrollment.start_date,
        target_completion_date: activeEnrollment.target_completion_date,
        status: activeEnrollment.status,
        progress_percentage: progressPercentage,
        completed_lessons: 0,
        total_lessons: 0
      },
      flightData: {
        totalHours: flightData.totalHours,
        soloHours: flightData.soloHours,
        crossCountryHours: flightData.crossCountryHours,
        nightHours: flightData.nightHours,
        lastFlightDate: recentSessions.length > 0 ? recentSessions[0].date : undefined,
        lastFlightDuration: recentSessions.length > 0 ? 
          calculateSessionDuration(recentSessions[0].start_time, recentSessions[0].end_time) : undefined,
        lastFlightAircraft: recentSessions.length > 0 ? 
          recentSessions[0].aircraft?.tail_number : undefined,
        lastFlightInstructor: recentSessions.length > 0 ? 
          `${recentSessions[0].instructor?.first_name} ${recentSessions[0].instructor?.last_name}` : undefined
      },
      acsProgress: processedAcsProgress,
      maneuverScores: processedManeuverScores,
      billing: {
        account_balance: account?.account_balance || 0,
        prepaid_flight_hours: account?.prepaid_flight_hours || 0,
        prepaid_ground_hours: account?.prepaid_ground_hours || 0,
        available_hours: (account?.prepaid_flight_hours || 0) + (account?.prepaid_ground_hours || 0),
        flight_instruction_rate: rates?.[0]?.flight_instruction_rate || 0,
        ground_instruction_rate: rates?.[0]?.ground_instruction_rate || 0,
        recent_transactions: []
      },
      documents: processedDocuments,
      communication: []
    }

    console.log('API: Returning student data:', studentData)
    return NextResponse.json(studentData)

  } catch (error) {
    console.error('Error in student details API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateFlightHours(flightLogs: any[]) {
  const totals = {
    totalHours: 0,
    soloHours: 0,
    crossCountryHours: 0,
    nightHours: 0,
    instrumentHours: 0
  }

  flightLogs.forEach(log => {
    const duration = log.total_time || 0
    totals.totalHours += duration
    
    if (log.solo_time) {
      totals.soloHours += log.solo_time
    }
    if (log.cross_country_time) {
      totals.crossCountryHours += log.cross_country_time
    }
    if (log.night_time) {
      totals.nightHours += log.night_time
    }
    if (log.instrument_time) {
      totals.instrumentHours += log.instrument_time
    }
  })

  return totals
}

function calculateSessionDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60) // Convert to hours
}

function calculateSyllabusProgress(enrollment: any, sessions: any[]): number {
  // Simple progress calculation based on completed sessions
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const totalSessions = sessions.length
  
  if (totalSessions === 0) return 0
  
  return Math.min(Math.round((completedSessions / totalSessions) * 100), 100)
}
