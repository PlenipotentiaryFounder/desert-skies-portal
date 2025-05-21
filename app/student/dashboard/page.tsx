import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentProgressChart } from "@/components/student/student-progress-chart"
import { UpcomingFlightsList } from "@/components/student/upcoming-flights-list"
import { RecentManeuverScores } from "@/components/student/recent-maneuver-scores"
import { DocumentsOverview } from "@/components/student/documents-overview"

export default async function StudentDashboardPage() {
  const supabase = await createServerSupabaseClient()

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  // If not a student, redirect to appropriate dashboard
  if (profile?.role && profile.role !== "student") {
    redirect(`/${profile.role}/dashboard`)
  }

  const { data: enrollments } = await supabase
    .from("student_enrollments")
    .select(`
      *,
      syllabi:syllabus_id (title, faa_type),
      instructors:instructor_id (
        first_name,
        last_name
      )
    `)
    .eq("student_id", session.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const currentEnrollment = enrollments?.[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.first_name}</h1>
        <p className="text-muted-foreground">Here's an overview of your flight training progress</p>
      </div>

      {currentEnrollment ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Training Program</CardTitle>
            <CardDescription>
              {currentEnrollment.syllabi.title} ({currentEnrollment.syllabi.faa_type})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Instructor</p>
                <p className="text-sm text-muted-foreground">
                  {currentEnrollment.instructors.first_name} {currentEnrollment.instructors.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Started</p>
                <p className="text-sm text-muted-foreground">{formatDate(currentEnrollment.start_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Target Completion</p>
                <p className="text-sm text-muted-foreground">
                  {currentEnrollment.target_completion_date
                    ? formatDate(currentEnrollment.target_completion_date)
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground capitalize">{currentEnrollment.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Training Program</CardTitle>
            <CardDescription>You are not currently enrolled in any training program</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
            <CardDescription>Your progress through the current syllabus</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <StudentProgressChart studentId={session.user.id} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Flights</CardTitle>
            <CardDescription>Your scheduled flight sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <UpcomingFlightsList studentId={session.user.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Maneuver Scores</CardTitle>
            <CardDescription>Your performance on recent flight maneuvers</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <RecentManeuverScores studentId={session.user.id} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Your training documents and certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <DocumentsOverview userId={session.user.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
