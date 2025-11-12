import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { UpcomingMissionsSection } from "./upcoming-missions-section"
import StudentDashboard from "./page"

export default async function DashboardWrapper() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  console.log('[DashboardWrapper] Loading dashboard for user:', user.id)

  return (
    <div className="space-y-6">
      {/* Upcoming Missions - Server Component with real data */}
      <Suspense fallback={
        <div className="animate-pulse">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
      }>
        <UpcomingMissionsSection studentId={user.id} />
      </Suspense>

      {/* Existing Dashboard - Client Component */}
      <StudentDashboard />
    </div>
  )
}

