import { Suspense } from "react"
import Link from "next/link"
import { Plus, Calendar, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getInstructorFlightSessions } from "@/lib/flight-session-service"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InstructorFlightSessionsList } from "./instructor-flight-sessions-list"
import { InstructorScheduleCalendar } from "./InstructorScheduleCalendar"

export const metadata = {
  title: "Flight Schedule | Desert Skies Aviation",
  description: "Manage your flight sessions and scheduling",
}

export default async function InstructorSchedulePage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const flightSessions = await getInstructorFlightSessions(user.id)

  // Check if user has calendar connections
  let hasCalendarConnections = false
  try {
    const { data: connections } = await supabase
      .from('calendar_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('sync_status', 'active')
      .limit(1)

    hasCalendarConnections = connections && connections.length > 0
  } catch (error) {
    console.error('Error checking calendar connections:', error)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Flight Schedule</h1>
          <p className="text-muted-foreground">Manage your flight sessions and student training</p>
        </div>
        <Button asChild>
          <Link href="/instructor/schedule/new">
            <div className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Flight Session
            </div>
          </Link>
        </Button>
      </div>

      {/* Calendar Sync Prompt */}
      {!hasCalendarConnections && (
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4" />
          <AlertTitle>Connect Your Calendar</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Sync your flight sessions with Google Calendar or Outlook to avoid scheduling conflicts and keep your schedule organized.
            </span>
            <Button asChild size="sm" className="ml-4">
              <Link href="/instructor/settings">
                Connect Calendar
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <InstructorFlightSessionsList initialSessions={flightSessions} />
      </Suspense>

      <InstructorScheduleCalendar sessions={flightSessions} />
    </div>
  )
}
