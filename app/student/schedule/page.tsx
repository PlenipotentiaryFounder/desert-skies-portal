import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentFlightSessions } from "@/lib/flight-session-service"
import { Skeleton } from "@/components/ui/skeleton"
import { StudentFlightSessionsList } from "./student-flight-sessions-list"
import { StudentScheduleCalendar } from "./StudentScheduleCalendar"
import { Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "My Flight Schedule | Desert Skies Aviation",
  description: "View your scheduled flight sessions",
}

export default async function StudentSchedulePage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const flightSessions = await getStudentFlightSessions(session.user.id)

  return (
    <div className="relative flex flex-col gap-6">
      {/* Glassmorphic summary card */}
      <div className="backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">My Flight Schedule</h1>
          <p className="text-muted-foreground">View your scheduled and completed flight sessions</p>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/student/schedule/new">
            <Button size="lg" className="rounded-full shadow-lg transition-transform hover:scale-105 focus:ring-2 focus:ring-primary/50" aria-label="Schedule New Flight">
              <Plus className="h-5 w-5" />
              <span className="ml-2 hidden md:inline">New Flight</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* View toggle (table/calendar) */}
      {/* For now, always show both; can add toggle logic if desired */}
      <div className="flex flex-col gap-6">
        <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl" />}>
          <StudentFlightSessionsList initialSessions={flightSessions} />
        </Suspense>
        <div className="rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-4">
          <StudentScheduleCalendar sessions={flightSessions} />
        </div>
      </div>

      {/* Floating Action Button for mobile */}
      <Link href="/student/schedule/new" className="fixed bottom-6 right-6 z-50 md:hidden">
        <Button size="icon" className="rounded-full shadow-2xl bg-primary text-white hover:scale-110 transition-transform" aria-label="Schedule New Flight">
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  )
}
