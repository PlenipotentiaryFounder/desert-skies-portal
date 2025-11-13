"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface StudentDashboardData {
  // Student Profile
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone_number?: string
    date_of_birth?: string
  }
  
  // Current Enrollment
  enrollment: {
    id: string
    syllabus_id: string
    instructor_id: string
    start_date: string
    status: string
    instructor_name?: string
    syllabus_name?: string
  } | null
  
  // Missions (from missions table)
  missions?: Array<any>
  
  // Flight Sessions
  upcomingSessions: Array<{
    id: string
    date: string
    start_time: string
    end_time: string
    lesson_name?: string
    instructor_name?: string
    aircraft_name?: string
    status: string
  }>
  
  // Progress Data
  progress: {
    totalHours: number
    soloHours: number
    crossCountryHours: number
    nightHours: number
    instrumentHours: number
    syllabusProgress: number
  }
  
  // Training Data (real syllabus lessons)
  training?: {
    currentLesson: any | null
    upcomingLessons: any[]
    completedLessons: any[]
    maneuverScores: any[]
    syllabusProgress: number
    totalLessons: number
    completedLessons: number
  }
  
  // Recent Activity
  recentActivity: Array<{
    id: string
    type: 'session' | 'document' | 'assessment' | 'endorsement'
    title: string
    description: string
    timestamp: string
    status: string
  }>
  
  // Notifications
  notifications: Array<{
    id: string
    type: string
    title: string
    message: string
    timestamp: string
    read: boolean
    priority: 'low' | 'medium' | 'high'
  }>
}

export function useStudentDashboardData() {
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          throw new Error('User not authenticated')
        }

        // Get student profile
        const { data: student, error: studentError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (studentError) {
          throw new Error('Failed to fetch student profile')
        }

        // Get current enrollment
        const { data: enrollment, error: enrollmentError } = await supabase
          .from('student_enrollments')
          .select(`
            *,
            profiles!student_enrollments_instructor_id_fkey(first_name, last_name),
            syllabi(title, description, faa_type)
          `)
          .eq('student_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (enrollmentError) {
          console.warn('No active enrollment found:', enrollmentError)
        }

        // Get missions for calendar
        const { data: missions, error: missionsError } = await supabase
          .from('missions')
          .select(`
            id,
            mission_code,
            mission_type,
            status,
            scheduled_date,
            scheduled_start_time,
            plan_of_action_id,
            debrief_id,
            lesson_template:lesson_template_id (
              title
            ),
            instructor:assigned_instructor_id (
              first_name,
              last_name
            )
          `)
          .eq('student_id', user.id)
          .in('status', ['scheduled', 'in_progress', 'completed'])
          .order('scheduled_date', { ascending: true })

        if (missionsError) {
          console.warn('Failed to fetch missions:', missionsError)
        }

        // Get upcoming flight sessions
        const { data: upcomingSessions, error: sessionsError } = await supabase
          .from('flight_sessions')
          .select(`
            *,
            student_enrollments!flight_sessions_enrollment_id_fkey(student_id),
            syllabus_lessons(title),
            custom_lessons(name),
            profiles!flight_sessions_instructor_id_fkey(first_name, last_name),
            aircraft(tail_number, make, model)
          `)
          .eq('student_enrollments.student_id', user.id)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(5)

        if (sessionsError) {
          console.warn('Failed to fetch upcoming sessions:', sessionsError)
        }

        // Get flight log entries for progress calculation
        const { data: flightLogs, error: logsError } = await supabase
          .from('flight_log_entries')
          .select('*')
          .eq('student_id', user.id)

        if (logsError) {
          console.warn('Failed to fetch flight logs:', logsError)
        }

        // Calculate progress from flight logs
        const progress = calculateProgress(flightLogs || [])

        // Get recent activity (mock for now)
        const recentActivity = [
          {
            id: '1',
            type: 'session' as const,
            title: 'Flight Session Completed',
            description: 'Completed Lesson 3 - Basic Maneuvers',
            timestamp: '2 hours ago',
            status: 'completed'
          },
          {
            id: '2',
            type: 'document' as const,
            title: 'Document Uploaded',
            description: 'Medical certificate uploaded and approved',
            timestamp: '1 day ago',
            status: 'completed'
          }
        ]

        // Get training data from syllabus lessons
        let trainingData = null
        if (enrollment && enrollment.syllabus_id) {
          try {
            const response = await fetch(`/api/student/training-data?studentId=${user.id}`)
            if (response.ok) {
              trainingData = await response.json()
            }
          } catch (error) {
            console.warn('Error fetching training data:', error)
          }
        }

        // Get notifications (mock for now)
        const notifications = [
          {
            id: '1',
            type: 'flight',
            title: 'Flight Session Completed',
            message: 'Completed Lesson 3 - Basic Maneuvers with Instructor',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            read: false,
            priority: 'medium' as const
          },
          {
            id: '2',
            type: 'weather',
            title: 'Weather Advisory',
            message: 'Crosswinds exceeding 15 knots expected this afternoon',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            read: false,
            priority: 'high' as const
          }
        ]

        setData({
          student: {
            id: student.id,
            first_name: student.first_name || 'Student',
            last_name: student.last_name || 'User',
            email: student.email,
            phone_number: student.phone_number,
            date_of_birth: student.date_of_birth
          },
          enrollment: enrollment ? {
            id: enrollment.id,
            syllabus_id: enrollment.syllabus_id,
            instructor_id: enrollment.instructor_id,
            start_date: enrollment.start_date,
            status: enrollment.status,
            instructor_name: enrollment.profiles ? 
              `${enrollment.profiles.first_name} ${enrollment.profiles.last_name}` : 
              'Thomas Ferrier',
            syllabus_name: enrollment.syllabi?.title || 'Unknown Syllabus'
          } : null,
          missions: missions || [],
          upcomingSessions: (upcomingSessions || []).map(session => ({
            id: session.id,
            date: session.date,
            start_time: session.start_time,
            end_time: session.end_time,
            lesson_name: session.lessons?.name || 'General Training',
            instructor_name: session.profiles ? 
              `${session.profiles.first_name} ${session.profiles.last_name}` : 
              'Unknown Instructor',
            aircraft_name: session.aircraft?.registration || 'Unknown Aircraft',
            status: session.status
          })),
          progress,
          training: trainingData,
          recentActivity,
          notifications
        })

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [supabase])

  return { data, loading, error }
}

function calculateProgress(flightLogs: any[]): StudentDashboardData['progress'] {
  let totalHours = 0
  let soloHours = 0
  let crossCountryHours = 0
  let nightHours = 0
  let instrumentHours = 0

  flightLogs.forEach(log => {
    const duration = (log.hobbs_end || 0) - (log.hobbs_start || 0)
    totalHours += duration

    // Categorize hours based on log entries
    if (log.solo_time) soloHours += log.solo_time
    if (log.cross_country_time) crossCountryHours += log.cross_country_time
    if (log.night_time) nightHours += log.night_time
    if (log.instrument_time) instrumentHours += log.instrument_time
  })

  // Calculate syllabus progress (mock for now)
  const syllabusProgress = Math.min(75, (totalHours / 40) * 100)

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    soloHours: Math.round(soloHours * 10) / 10,
    crossCountryHours: Math.round(crossCountryHours * 10) / 10,
    nightHours: Math.round(nightHours * 10) / 10,
    instrumentHours: Math.round(instrumentHours * 10) / 10,
    syllabusProgress: Math.round(syllabusProgress)
  }
} 