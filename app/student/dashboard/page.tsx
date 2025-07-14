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
import { ACSStandardsWidget } from "@/components/shared/acs-standards-widget"
import { getExpiringDocuments } from "@/lib/document-service"
import { getStudentFlightSessions } from "@/lib/flight-session-service"
import { getStudentACSProgress } from "@/lib/acs-service"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle as ExclamationTriangleIcon, Calendar as CalendarIcon, ClipboardList as ClipboardListIcon } from "lucide-react"
import { OnboardingPrompt } from "@/components/student/onboarding/onboarding-prompt"

export default async function StudentDashboardPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithRoles(user.id)
  const roles = Array.isArray(profile?.roles)
    ? profile.roles.map((r: any) => typeof r === "string" ? r : r.role_name)
    : []
  console.log('STUDENT DASHBOARD: roles:', roles)

  // This page is for students. If the user is not a student, but has other roles, redirect them.
  // We will allow admins to see this page.
  if (roles.length > 0 && !roles.includes("student") && !roles.includes("admin")) {
    const highestRole = roles.includes("instructor") ? "instructor" : roles[0]
    redirect(`/${highestRole}/dashboard`)
  }

  // --- ALERT LOGIC ---
  // Expiring documents (next 30 days)
  const expiringDocs = (await getExpiringDocuments(30)).filter((doc: any) => doc.user_id === user.id)
  // Upcoming flights (next 7 days)
  const allFlights = await getStudentFlightSessions(user.id)
  const today = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(today.getDate() + 7)
  const upcomingFlights = allFlights.filter((flight: any) => {
    const flightDate = new Date(flight.date)
    return flight.status === "scheduled" && flightDate >= today && flightDate <= weekFromNow
  })
  // Incomplete requirements
  const acsProgress = await getStudentACSProgress(user.id, "private_pilot")
  const incompleteRequirements = acsProgress && acsProgress.overall_completion < 100

  return (
    <div className="flex flex-col gap-6">
      {/* ALERTS */}
      <div className="flex flex-col gap-2">
        {expiringDocs.length > 0 && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <AlertTitle>Expiring Documents</AlertTitle>
            <AlertDescription>
              You have {expiringDocs.length} document(s) expiring soon. <a href="/student/documents" className="underline">Review now</a>.
            </AlertDescription>
          </Alert>
        )}
        {upcomingFlights.length > 0 && (
          <Alert variant="default">
            <CalendarIcon className="h-5 w-5" />
            <AlertTitle>Upcoming Flights</AlertTitle>
            <AlertDescription>
              You have {upcomingFlights.length} flight(s) scheduled in the next 7 days. <a href="/student/schedule" className="underline">View schedule</a>.
            </AlertDescription>
          </Alert>
        )}
        {incompleteRequirements && (
          <Alert variant="warning">
            <ClipboardListIcon className="h-5 w-5" />
            <AlertTitle>Incomplete Requirements</AlertTitle>
            <AlertDescription>
              You have incomplete ACS requirements. <a href="/student/requirements" className="underline">View requirements</a>.
            </AlertDescription>
          </Alert>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.first_name}</h1>
        <p className="text-muted-foreground">Here's an overview of your flight training progress</p>
      </div>

      <OnboardingPrompt userId={user.id} />

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
          <ACSStandardsWidget 
            userRole="student" 
            userId={user.id} 
            certificateType="private_pilot"
          />
        </Suspense>
      </div>
    </div>
  )
}
