'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface TrainingLesson {
  id: string
  title: string
  description: string | null
  order_index: number
  lesson_type: string
  estimated_hours: number
  objective: string | null
  performance_standards: string | null
  completed: boolean
  progress: number
}

export interface ManeuverScore {
  id: string
  maneuver_name: string
  score: number
  last_assessed: string
  meets_acs_standard: boolean
}

export interface StudentTrainingData {
  currentLesson: TrainingLesson | null
  upcomingLessons: TrainingLesson[]
  completedLessons: TrainingLesson[]
  maneuverScores: ManeuverScore[]
  syllabusProgress: number
  totalLessons: number
  completedLessonsCount: number
}

/**
 * Get comprehensive training data for a student
 */
export async function getStudentTrainingData(studentId: string): Promise<StudentTrainingData> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  try {
    // Get student's active enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('student_enrollments')
      .select('*, syllabi(*)')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (enrollmentError || !enrollment || !enrollment.syllabi) {
      console.log('No active enrollment found:', enrollmentError)
      return {
        currentLesson: null,
        upcomingLessons: [],
        completedLessons: [],
        maneuverScores: [],
        syllabusProgress: 0,
        totalLessons: 0,
        completedLessonsCount: 0
      }
    }

    // Get all lessons for this syllabus
    const { data: allLessons, error: lessonsError } = await supabase
      .from('syllabus_lessons')
      .select('*')
      .eq('syllabus_id', enrollment.syllabus_id)
      .order('order_index', { ascending: true })

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError)
      return {
        currentLesson: null,
        upcomingLessons: [],
        completedLessons: [],
        maneuverScores: [],
        syllabusProgress: 0,
        totalLessons: 0,
        completedLessonsCount: 0
      }
    }

    // Get completed missions/flights for this student
    const { data: completedMissions } = await supabase
      .from('missions')
      .select('lesson_template_id, status')
      .eq('student_id', studentId)
      .eq('status', 'completed')

    const completedLessonIds = new Set(
      completedMissions
        ?.filter((m: any) => m.lesson_template_id)
        .map((m: any) => m.lesson_template_id) || []
    )

    // Get in-progress missions
    const { data: inProgressMissions } = await supabase
      .from('missions')
      .select('lesson_template_id, status')
      .eq('student_id', studentId)
      .in('status', ['scheduled', 'in_progress'])
      .order('scheduled_date', { ascending: true })
      .limit(1)

    const currentLessonId = inProgressMissions?.[0]?.lesson_template_id

    // Map lessons to TrainingLesson format
    const lessons: TrainingLesson[] = (allLessons || []).map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title || 'Untitled Lesson',
      description: lesson.description,
      order_index: lesson.order_index || 0,
      lesson_type: lesson.lesson_type || 'Flight Training',
      estimated_hours: lesson.estimated_hours || 0,
      objective: lesson.objective,
      performance_standards: lesson.performance_standards,
      completed: completedLessonIds.has(lesson.id),
      progress: completedLessonIds.has(lesson.id) ? 100 : (lesson.id === currentLessonId ? 50 : 0)
    }))

    const completedLessons = lessons.filter(l => l.completed)
    const upcomingLessons = lessons.filter(l => !l.completed)
    const currentLesson = currentLessonId 
      ? lessons.find(l => l.id === currentLessonId) || upcomingLessons[0] || null
      : upcomingLessons[0] || null

    // Get maneuver performance (from maneuver_log or similar table)
    // For now, we'll return empty array - this needs to be implemented based on your schema
    const maneuverScores: ManeuverScore[] = []

    // Calculate progress
    const totalLessons = lessons.length
    const completedLessonsCount = completedLessons.length
    const syllabusProgress = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0

    return {
      currentLesson,
      upcomingLessons: upcomingLessons.slice(0, 10), // Limit to next 10
      completedLessons,
      maneuverScores,
      syllabusProgress,
      totalLessons,
      completedLessonsCount
    }
  } catch (error) {
    console.error('Error in getStudentTrainingData:', error)
    return {
      currentLesson: null,
      upcomingLessons: [],
      completedLessons: [],
      maneuverScores: [],
      syllabusProgress: 0,
      totalLessons: 0,
      completedLessonsCount: 0
    }
  }
}

