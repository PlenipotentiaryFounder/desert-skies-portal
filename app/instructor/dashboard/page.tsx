// NOTE: We use getUserFromSession() everywhere in server components to encapsulate Supabase's session-based user retrieval.
// Always await createServerSupabaseClient() to get a usable Supabase client instance.
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient, hasAdditionalRole, getUserFromSession } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { InstructorStudentsList } from "@/components/instructor/instructor-students-list"
import { UpcomingInstructorSessions } from "@/components/instructor/upcoming-instructor-sessions"
import { InstructorStatsCards } from "@/components/instructor/instructor-stats-cards"
import { PendingEndorsements } from "@/components/instructor/pending-endorsements"
import { ApprovalStatusBanner } from "@/components/instructor/approval-status-banner"
import { RoleSwitcher } from "@/components/shared/role-switcher"

export default async function InstructorDashboardPage() {
  const user = await getUserFromSession()

  // If not authenticated, redirect to login
  if (!user) {
    redirect("/login")
  }

  // Always await createServerSupabaseClient!
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // If not an instructor, redirect to appropriate dashboard
  if (profile?.role && profile.role !== "instructor") {
    redirect(`/${profile.role}/dashboard`)
  }

  const isAlsoAdmin = await hasAdditionalRole("admin")

  return (
    <div className="flex flex-col gap-6">
      {/* Show approval status banner if needed */}
      <ApprovalStatusBanner userId={user.id} />

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.first_name}</h1>
          <p className="text-muted-foreground">Here's an overview of your students and upcoming sessions</p>
        </div>
        {isAlsoAdmin && <RoleSwitcher currentRole="instructor" hasAdditionalRole={isAlsoAdmin} />}
      </div>

      <Suspense fallback={<Skeleton className="h-[100px] w-full" />}>
        <InstructorStatsCards instructorId={user.id} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Flight Sessions</CardTitle>
            <CardDescription>Your scheduled flight sessions for the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <UpcomingInstructorSessions instructorId={user.id} />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Pending Endorsements</CardTitle>
            <CardDescription>Student endorsements awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <PendingEndorsements instructorId={user.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Students</CardTitle>
          <CardDescription>Students currently assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
            <InstructorStudentsList instructorId={user.id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
