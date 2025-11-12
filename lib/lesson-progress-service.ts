"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export interface LessonProgress {
  currentLesson: {
    id: string
    title: string
    order_index: number
    lesson_type: string
    description: string
  } | null
  nextLesson: {
    id: string
    title: string
    order_index: number
    lesson_type: string
    description: string
  } | null
  previousLesson: {
    id: string
    title: string
    order_index: number
    lesson_type: string
    description: string
  } | null
  completedLessons: number
  totalLessons: number
  percentComplete: number
  lastCompletedMission: {
    id: string
    scheduled_date: string
    lesson_title: string
  } | null
}

/**
 * Get the lesson progress for a student's enrollment
 * Determines what lesson they're currently on, what's next, and what was previous
 */
export async function getEnrollmentLessonProgress(
  enrollmentId: string
): Promise<LessonProgress> {
  const supabase = await createClient(await cookies())

  // Get the enrollment with syllabus info
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("student_enrollments")
    .select("id, student_id, syllabus_id, status")
    .eq("id", enrollmentId)
    .single()

  if (enrollmentError || !enrollment) {
    throw new Error("Enrollment not found")
  }

  // Get all lessons for this syllabus, ordered by order_index
  const { data: allLessons, error: lessonsError } = await supabase
    .from("syllabus_lessons")
    .select("id, title, order_index, lesson_type, description")
    .eq("syllabus_id", enrollment.syllabus_id)
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (lessonsError || !allLessons) {
    throw new Error("Failed to fetch syllabus lessons")
  }

  const totalLessons = allLessons.length

  // Get all completed missions for this enrollment
  const { data: completedMissions, error: missionsError } = await supabase
    .from("missions")
    .select(`
      id,
      scheduled_date,
      lesson_template_id,
      custom_lesson_id,
      status
    `)
    .eq("enrollment_id", enrollmentId)
    .eq("status", "completed")
    .order("scheduled_date", { ascending: false })

  if (missionsError) {
    console.error("Error fetching missions:", missionsError)
  }

  // Get the set of completed lesson IDs (template lessons only)
  const completedLessonIds = new Set(
    completedMissions
      ?.filter((m) => m.lesson_template_id)
      .map((m) => m.lesson_template_id) || []
  )

  // Find the highest completed lesson by order_index
  let highestCompletedLesson = null
  let highestCompletedIndex = -1

  for (const lesson of allLessons) {
    if (completedLessonIds.has(lesson.id)) {
      if (lesson.order_index > highestCompletedIndex) {
        highestCompletedIndex = lesson.order_index
        highestCompletedLesson = lesson
      }
    }
  }

  // Current lesson is the next uncompleted lesson after the highest completed
  // If no lessons completed, current is the first lesson
  let currentLesson = null
  let nextLesson = null
  let previousLesson = highestCompletedLesson

  if (highestCompletedIndex === -1) {
    // No lessons completed yet - start at the beginning
    currentLesson = allLessons[0] || null
    nextLesson = allLessons[1] || null
  } else {
    // Find the next uncompleted lesson
    const nextIndex = highestCompletedIndex + 1
    const nextLessonInSequence = allLessons.find((l) => l.order_index === nextIndex)
    
    if (nextLessonInSequence) {
      currentLesson = nextLessonInSequence
      // Find the lesson after current
      const afterCurrentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id)
      if (afterCurrentIndex !== -1 && afterCurrentIndex + 1 < allLessons.length) {
        nextLesson = allLessons[afterCurrentIndex + 1]
      }
    } else {
      // All lessons completed!
      currentLesson = null
      nextLesson = null
    }
  }

  // Get last completed mission info
  let lastCompletedMission = null
  if (completedMissions && completedMissions.length > 0) {
    const lastMission = completedMissions[0]
    
    // Get lesson title
    let lessonTitle = "Custom Mission"
    if (lastMission.lesson_template_id) {
      const lesson = allLessons.find((l) => l.id === lastMission.lesson_template_id)
      lessonTitle = lesson?.title || "Unknown Lesson"
    } else if (lastMission.custom_lesson_id) {
      const { data: customLesson } = await supabase
        .from("custom_lessons")
        .select("title")
        .eq("id", lastMission.custom_lesson_id)
        .single()
      lessonTitle = customLesson?.title || "Custom Mission"
    }

    lastCompletedMission = {
      id: lastMission.id,
      scheduled_date: lastMission.scheduled_date,
      lesson_title: lessonTitle,
    }
  }

  const completedLessons = completedLessonIds.size
  const percentComplete =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return {
    currentLesson,
    nextLesson,
    previousLesson,
    completedLessons,
    totalLessons,
    percentComplete,
    lastCompletedMission,
  }
}

/**
 * Get suggested missions for quick scheduling
 */
export async function getSuggestedMissions(enrollmentId: string) {
  const progress = await getEnrollmentLessonProgress(enrollmentId)

  const suggestions = []

  // Suggest current/next lesson
  if (progress.currentLesson) {
    suggestions.push({
      type: "next" as const,
      lesson: progress.currentLesson,
      label: "Next Lesson",
      description: `Continue with ${progress.currentLesson.title}`,
      priority: 1,
    })
  } else if (progress.nextLesson) {
    suggestions.push({
      type: "next" as const,
      lesson: progress.nextLesson,
      label: "Next Lesson",
      description: `Continue with ${progress.nextLesson.title}`,
      priority: 1,
    })
  }

  // Suggest repeating previous lesson
  if (progress.previousLesson) {
    suggestions.push({
      type: "repeat" as const,
      lesson: progress.previousLesson,
      label: "Repeat Previous",
      description: `Practice ${progress.previousLesson.title} again`,
      priority: 2,
    })
  }

  // Always allow custom
  suggestions.push({
    type: "custom" as const,
    lesson: null,
    label: "Custom Mission",
    description: "Create a custom training mission",
    priority: 3,
  })

  return {
    suggestions,
    progress,
  }
}

