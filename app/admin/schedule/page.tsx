import { Suspense } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getFlightSessions } from "@/lib/flight-session-service"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { FlightSessionsList } from "./flight-sessions-list"

export const metadata = {
  title: "Flight Schedule | Desert Skies Aviation",
  description: "Manage flight sessions and scheduling",
}

export default async function SchedulePage() {
  const flightSessions = await getFlightSessions()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flight Schedule</h1>
          <p className="text-muted-foreground">
            Manage flight sessions and scheduling for all students and instructors
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/schedule/new">
            <div className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Flight Session
            </div>
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <FlightSessionsList initialSessions={flightSessions} />
      </Suspense>
    </div>
  )
}
