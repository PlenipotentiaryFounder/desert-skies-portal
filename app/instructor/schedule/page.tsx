import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Skeleton } from "@/components/ui/skeleton"
import { InstructorScheduleCalendar } from "./instructor-schedule-calendar"
import { InstructorMissionsList } from "./instructor-missions-list"
import { Calendar, List, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "My Schedule | Desert Skies Aviation",
  description: "Your instructor training schedule - manage your missions and student sessions",
}

// Get instructor missions for schedule
async function getInstructorMissions(instructorId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from("missions")
    .select(`
      id,
      mission_code,
      mission_type,
      scheduled_date,
      scheduled_start_time,
      status,
      lesson_code,
      plan_of_action_id,
      student:profiles!missions_student_id_fkey (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      ),
      aircraft:aircraft!missions_scheduled_aircraft_id_fkey (
        id,
        tail_number,
        make,
        model
      ),
      lesson_template:syllabus_lessons (
        id,
        title,
        description,
        lesson_type
      ),
      plan_of_action:plans_of_action (
        id,
        status,
        shared_with_student_at,
        student_acknowledged_at
      )
    `)
    .eq("assigned_instructor_id", instructorId)
    .in("status", ["scheduled", "in_progress"])
    .gte("scheduled_date", new Date().toISOString().split('T')[0])
    .order("scheduled_date", { ascending: true })
    .order("scheduled_start_time", { ascending: true })

  if (error) {
    console.error("Error fetching instructor missions:", error)
    return []
  }

  return data || []
}

// Get instructor stats
async function getInstructorStats(instructorId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [todayMissions, weekMissions, needsPOA] = await Promise.all([
    supabase
      .from("missions")
      .select("id", { count: 'exact', head: true })
      .eq("assigned_instructor_id", instructorId)
      .eq("scheduled_date", today)
      .in("status", ["scheduled", "in_progress"]),
    
    supabase
      .from("missions")
      .select("id", { count: 'exact', head: true })
      .eq("assigned_instructor_id", instructorId)
      .gte("scheduled_date", today)
      .lte("scheduled_date", weekFromNow)
      .in("status", ["scheduled", "in_progress"]),
    
    supabase
      .from("missions")
      .select("id", { count: 'exact', head: true })
      .eq("assigned_instructor_id", instructorId)
      .is("plan_of_action_id", null)
      .gte("scheduled_date", today)
      .eq("status", "scheduled")
  ])

  return {
    today: todayMissions.count || 0,
    thisWeek: weekMissions.count || 0,
    needsPOA: needsPOA.count || 0
  }
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

  const [missions, stats] = await Promise.all([
    getInstructorMissions(user.id),
    getInstructorStats(user.id)
  ])

  return (
    <div className="relative flex flex-col gap-6">
      {/* Glassmorphic Header */}
      <div className="backdrop-blur-md bg-white/60 dark:bg-zinc-900/60 rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">My Instructor Schedule</h1>
            <p className="text-muted-foreground">
              Manage your training missions and student sessions
            </p>
          </div>
          <Button asChild size="lg" className="shadow-lg">
            <Link href="/instructor/missions/new">
              <Plus className="w-5 h-5 mr-2" />
              New Mission
            </Link>
          </Button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/80 dark:bg-zinc-800/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-muted-foreground mb-1">Today</p>
            <p className="text-3xl font-bold text-primary">{stats.today}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.today === 1 ? 'mission' : 'missions'}
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-zinc-800/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-muted-foreground mb-1">This Week</p>
            <p className="text-3xl font-bold text-blue-600">{stats.thisWeek}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.thisWeek === 1 ? 'mission' : 'missions'}
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-zinc-800/80 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-muted-foreground mb-1">Need POA</p>
            <p className="text-3xl font-bold text-orange-600">{stats.needsPOA}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.needsPOA === 1 ? 'mission' : 'missions'}
            </p>
          </div>
        </div>
      </div>

      {/* View Toggle (List/Calendar) */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md shadow-md">
          <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}>
            <InstructorMissionsList missions={missions} />
          </Suspense>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <div className="rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
              <InstructorScheduleCalendar missions={missions} />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
