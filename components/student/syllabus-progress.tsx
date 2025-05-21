"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SyllabusProgressProps {
  enrollmentId: string
}

interface ProgressData {
  totalLessons: number
  completedLessons: number
  inProgressLessons: number
  percentComplete: number
}

export function SyllabusProgress({ enrollmentId }: SyllabusProgressProps) {
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

        // Get flight sessions for this enrollment
        const { data: sessions } = await supabase
          .from("flight_sessions")
          .select("id, lesson_id, status")
          .eq("enrollment_id", enrollmentId)

        if (!sessions) {
          setLoading(false)
          return
        }

        // Count completed and in-progress lessons
        const completedLessonIds = new Set(sessions.filter((s) => s.status === "completed").map((s) => s.lesson_id))
        const inProgressLessonIds = new Set(
          sessions.filter((s) => s.status === "scheduled" || s.status === "in_progress").map((s) => s.lesson_id),
        )

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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Syllabus Progress</CardTitle>
          <CardDescription>No progress data available</CardDescription>
        </CardHeader>
      </Card>
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
