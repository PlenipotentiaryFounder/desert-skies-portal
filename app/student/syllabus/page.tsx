import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getStudentEnrollments } from "@/lib/enrollment-service"
import { getSyllabusLessons } from "@/lib/syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SyllabusProgress } from "@/components/student/syllabus-progress"
import { formatDate } from "@/lib/utils"

export default async function StudentSyllabusPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const enrollments = await getStudentEnrollments(session.user.id)
  const activeEnrollment = enrollments.find((e) => e.status === "active")

  if (!activeEnrollment) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Training Syllabus</h1>
          <p className="text-muted-foreground">View your current training program</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Active Enrollment</CardTitle>
            <CardDescription>You are not currently enrolled in any training program</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please contact your flight school administrator to enroll in a training program.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lessons = await getSyllabusLessons(activeEnrollment.syllabus_id)

  // Get flight sessions for this enrollment
  const { data: sessions } = await supabase
    .from("flight_sessions")
    .select("id, lesson_id, status, date")
    .eq("enrollment_id", activeEnrollment.id)

  // Create a map of lesson IDs to their status
  const lessonStatus = new Map()
  sessions?.forEach((session) => {
    if (session.status === "completed" || !lessonStatus.has(session.lesson_id)) {
      lessonStatus.set(session.lesson_id, session.status)
    }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Training Syllabus</h1>
        <p className="text-muted-foreground">View your current training program</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeEnrollment.syllabus?.title}</CardTitle>
          <CardDescription>{activeEnrollment.syllabus?.faa_type}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Instructor</p>
              <p className="text-sm text-muted-foreground">
                {activeEnrollment.instructor?.first_name} {activeEnrollment.instructor?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Started</p>
              <p className="text-sm text-muted-foreground">{formatDate(activeEnrollment.start_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Target Completion</p>
              <p className="text-sm text-muted-foreground">
                {activeEnrollment.target_completion_date
                  ? formatDate(activeEnrollment.target_completion_date)
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground capitalize">{activeEnrollment.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
        <SyllabusProgress enrollmentId={activeEnrollment.id} />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Lessons</CardTitle>
          <CardDescription>Your training program lessons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const status = lessonStatus.get(lesson.id) || "not_started"
              let statusColor = "bg-gray-200"
              let statusText = "Not Started"

              if (status === "completed") {
                statusColor = "bg-green-500"
                statusText = "Completed"
              } else if (status === "in_progress") {
                statusColor = "bg-blue-500"
                statusText = "In Progress"
              } else if (status === "scheduled") {
                statusColor = "bg-yellow-500"
                statusText = "Scheduled"
              }

              return (
                <div key={lesson.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {lesson.order_index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground">{lesson.lesson_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${statusColor}`}></div>
                      <span className="text-sm">{statusText}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{lesson.description}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Estimated time: {lesson.estimated_hours} hours
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
