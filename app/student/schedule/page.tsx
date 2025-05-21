import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getStudentFlightSessions } from "@/lib/flight-session-service"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentFlightSessionsList } from "./student-flight-sessions-list"

export const metadata = {
  title: "My Flight Schedule | Desert Skies Aviation",
  description: "View your scheduled flight sessions",
}

export default async function StudentSchedulePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const flightSessions = await getStudentFlightSessions(session.user.id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Flight Schedule</h1>
        <p className="text-muted-foreground">View your scheduled and completed flight sessions</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <StudentFlightSessionsList initialSessions={flightSessions} />
      </Suspense>
    </div>
  )
}
