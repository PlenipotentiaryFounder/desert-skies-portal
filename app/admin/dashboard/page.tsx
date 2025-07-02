import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfileWithRoles } from "@/lib/user-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminStatsCards } from "@/components/admin/admin-stats-cards"
import { RecentActivityList } from "@/components/admin/recent-activity-list"
import { ActiveInstructorsList } from "@/components/admin/active-instructors-list"
import { EnrollmentChart } from "@/components/admin/enrollment-chart"
import { RoleSwitcher } from "@/components/shared/role-switcher"
import { cookies } from "next/headers"

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithRoles(user.id)

  if (!profile) {
    redirect("/")
  }

  console.log('ADMIN DASHBOARD: profile:', profile)
  const userRoles = profile.roles || []
  console.log('ADMIN DASHBOARD: userRoles:', userRoles)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile.first_name}</p>
        </div>
        <RoleSwitcher roles={userRoles} />
      </div>

      <Suspense fallback={<Skeleton className="h-[100px] w-full" />}>
        <AdminStatsCards />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <RecentActivityList />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Active Instructors</CardTitle>
            <CardDescription>Instructors with recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
              <ActiveInstructorsList />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Trends</CardTitle>
          <CardDescription>Student enrollment over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <EnrollmentChart />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
