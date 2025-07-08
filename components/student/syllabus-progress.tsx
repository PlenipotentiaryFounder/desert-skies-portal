"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SyllabusProgressProps {
  enrollmentId: string
  compact?: boolean
}

interface ProgressData {
  totalLessons: number
  completedLessons: number
  inProgressLessons: number
  percentComplete: number
}

export function SyllabusProgress({ enrollmentId, compact = false }: SyllabusProgressProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchProgress() {
      try {
        // Get enrollment details
        const { data: enrollment } = await supabase
          .from("student_enrollments")
          .select("syllabus_id")
          .eq("id", enrollmentId)
          .single()

        if (!enrollment) {
          setLoading(false)
          return
        }

        // Get total lessons for this syllabus
        const { count: totalLessons } = await supabase
          .from("syllabus_lessons")
          .select("*", { count: "exact", head: true })
          .eq("syllabus_id", enrollment.syllabus_id)

        // Get flight sessions for this enrollment with maneuver scores
        const { data: sessions } = await supabase
          .from("flight_sessions")
          .select(`
            id, 
            lesson_id, 
            status,
            maneuver_scores (
              id,
              score,
              maneuver_id
            )
          `)
          .eq("enrollment_id", enrollmentId)

        if (!sessions) {
          setLoading(false)
          return
        }

        // Get all lesson maneuvers to calculate proper completion
        const { data: allLessonManeuvers } = await supabase
          .from("lesson_maneuvers")
          .select("lesson_id, maneuver_id")

        // Calculate lesson completion based on maneuver proficiency
        const completedLessonIds = new Set()
        const inProgressLessonIds = new Set()

        // Group sessions by lesson
        const sessionsByLesson = new Map()
        sessions.forEach(session => {
          if (!sessionsByLesson.has(session.lesson_id)) {
            sessionsByLesson.set(session.lesson_id, [])
          }
          sessionsByLesson.get(session.lesson_id).push(session)
        })

        // For each lesson, determine completion status
        sessionsByLesson.forEach((lessonSessions, lessonId) => {
          const completedSessions = lessonSessions.filter((s: any) => s.status === "completed")
          const scheduledSessions = lessonSessions.filter((s: any) => s.status === "scheduled")
          
          if (completedSessions.length > 0) {
            // Get maneuvers for this lesson
            const lessonManeuvers = allLessonManeuvers?.filter((lm: any) => lm.lesson_id === lessonId) || []
            
            if (lessonManeuvers.length > 0) {
              // Calculate maneuver proficiency
              const scoredManeuvers = new Set()
              completedSessions.forEach((session: any) => {
                session.maneuver_scores?.forEach((score: any) => {
                  if (score.score >= 3) { // Proficient or better
                    scoredManeuvers.add(score.maneuver_id)
                  }
                })
              })
              
              const maneuverProgress = (scoredManeuvers.size / lessonManeuvers.length) * 100
              
              if (maneuverProgress === 100) {
                completedLessonIds.add(lessonId)
              } else {
                inProgressLessonIds.add(lessonId)
              }
            } else {
              // If no maneuvers, consider completed if there are completed sessions
              completedLessonIds.add(lessonId)
            }
          } else if (scheduledSessions.length > 0) {
            inProgressLessonIds.add(lessonId)
          }
        })

        const completedLessons = completedLessonIds.size
        const inProgressLessons = inProgressLessonIds.size
        const percentComplete = totalLessons ? (completedLessons / totalLessons) * 100 : 0

        setProgressData({
          totalLessons: totalLessons || 0,
          completedLessons,
          inProgressLessons,
          percentComplete,
        })
      } catch (error) {
        console.error("Error fetching progress data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [supabase, enrollmentId])

  if (loading) {
    if (compact) {
      return <span className="text-sm text-muted-foreground">Loading...</span>
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>Syllabus Progress</CardTitle>
          <CardDescription>Loading progress data...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!progressData) {
    if (compact) {
      return <span className="text-sm text-muted-foreground">No data</span>
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>Syllabus Progress</CardTitle>
          <CardDescription>No progress data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{Math.round(progressData.percentComplete)}%</span>
        <Progress value={progressData.percentComplete} className="h-2 w-16" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Syllabus Progress</CardTitle>
        <CardDescription>Your progress through the training program</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{Math.round(progressData.percentComplete)}%</span>
            </div>
            <Progress value={progressData.percentComplete} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{progressData.totalLessons}</div>
              <div className="text-xs text-muted-foreground">Total Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{progressData.completedLessons}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{progressData.inProgressLessons}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
