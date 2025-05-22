import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getInstructorFlightSessions } from "@/lib/flight-session-service"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { InstructorFlightSessionsList } from "./instructor-flight-sessions-list"
import { InstructorScheduleCalendar } from "./InstructorScheduleCalendar"

export const metadata = {
  title: "Flight Schedule | Desert Skies Aviation",
  description: "Manage your flight sessions and scheduling",
}

export default async function InstructorSchedulePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const flightSessions = await getInstructorFlightSessions(session.user.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Flight Schedule</h1>
          <p className="text-muted-foreground">Manage your flight sessions and student training</p>
        </div>
        <Button asChild>
          <Link href="/instructor/schedule/new">
            <Plus className="mr-2 h-4 w-4" />
            New Flight Session
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <InstructorFlightSessionsList initialSessions={flightSessions} />
      </Suspense>

      <InstructorScheduleCalendar sessions={flightSessions} />
    </div>
  )
}
