import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentMissions } from "@/lib/mission-service"
import { Skeleton } from "@/components/ui/skeleton"
import { InteractiveScheduleCalendar } from "./InteractiveScheduleCalendar"
import { StudentMissionsList } from "./student-missions-list"
import { Calendar, List } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = {
  title: "My Schedule | Desert Skies Aviation",
  description: "View your scheduled training missions - flights, ground, and simulator sessions",
}

export default async function StudentSchedulePage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  console.log('[StudentSchedulePage] Loading schedule for user:', user.id)

  const missions = await getStudentMissions(user.id)
  
  console.log('[StudentSchedulePage] Loaded missions:', missions.length)

  return (
    <div className="relative flex flex-col gap-6">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">My Training Schedule</h1>
          <p className="text-muted-foreground">
            View your scheduled training missions - flights, ground instruction, and simulator sessions
          </p>
        </div>
      </div>

      {/* View toggle (list/calendar) */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
            <StudentMissionsList missions={missions} />
          </Suspense>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <div className="rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <InteractiveScheduleCalendar missions={missions} />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
