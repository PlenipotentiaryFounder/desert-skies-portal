import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getUserProfileWithRoles } from "@/lib/user-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentProgressChart } from "@/components/student/student-progress-chart"
import { UpcomingFlightsList } from "@/components/student/upcoming-flights-list"
import { RecentManeuverScores } from "@/components/student/recent-maneuver-scores"
import { DocumentsOverview } from "@/components/student/documents-overview"
import { CurrentEnrollmentCard } from "./CurrentEnrollmentCard"

export default async function StudentDashboardPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithRoles(user.id)
  const roles = profile?.roles.map(r => r.role_name) || []

  // This page is for students. If the user is not a student, but has other roles, redirect them.
  // We will allow admins to see this page.
  if (roles.length > 0 && !roles.includes("student") && !roles.includes("admin")) {
    const highestRole = roles.includes("instructor") ? "instructor" : roles[0]
    redirect(`/${highestRole}/dashboard`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4 py-2 px-4 bg-blue-50 border-b-2 border-blue-200 text-blue-900 text-lg font-semibold uppercase tracking-wide">
        Student Portal
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.first_name}</h1>
        <p className="text-muted-foreground">Here's an overview of your flight training progress</p>
      </div>

      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <CurrentEnrollmentCard studentId={user.id} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
            <CardDescription>Your progress through the current syllabus</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <StudentProgressChart studentId={user.id} />
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
              <UpcomingFlightsList studentId={user.id} />
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
              <RecentManeuverScores studentId={user.id} />
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
              <DocumentsOverview userId={user.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
