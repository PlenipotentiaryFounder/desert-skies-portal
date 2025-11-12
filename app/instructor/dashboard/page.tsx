import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plane,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  Plus,
  DollarSign,
  TrendingUp,
  CloudRain,
  Wind,
  Thermometer,
  Eye,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { getCurrentWeather, type WeatherData } from "@/lib/weather-service"
import { StripeConnectBanner } from "@/components/instructor/dashboard/stripe-connect-banner"

export const metadata = {
  title: "Instructor Dashboard | Desert Skies Aviation",
  description: "Your flight instructor command center",
}

// ============================================================================
// UPCOMING MISSIONS COMPONENT (Server Component with real data)
// ============================================================================

async function UpcomingMissions({ instructorId }: { instructorId: string }) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Get upcoming missions (scheduled missions in the next 7 days)
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: missions, error } = await supabase
    .from("missions")
    .select(`
      id,
      mission_code,
      mission_type,
      scheduled_date,
      scheduled_start_time,
      status,
      plan_of_action_id,
      lesson_code,
      student:profiles!missions_student_id_fkey (
        id,
        first_name,
        last_name,
        email
      ),
      aircraft:aircraft!missions_scheduled_aircraft_id_fkey (
        tail_number,
        make,
        model
      ),
      lesson_template:syllabus_lessons (
        title,
        description
      ),
      plan_of_action:plans_of_action (
        id,
        status
      )
    `)
    .eq("assigned_instructor_id", instructorId)
    .in("status", ["scheduled", "in_progress"])
    .gte("scheduled_date", today)
    .lte("scheduled_date", nextWeek)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_start_time", { ascending: true })
    .limit(10)

  if (error) {
    console.error("Error fetching missions:", error)
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Unable to load missions
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!missions || missions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Upcoming Missions</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any missions scheduled for the next week
            </p>
            <Button asChild>
              <Link href="/instructor/missions/new">
                <Plus className="w-4 h-4 mr-2" />
                Schedule a Mission
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {missions.map((mission: any) => {
        const missionDate = new Date(mission.scheduled_date)
        const needsPOA = !mission.plan_of_action_id
        const poaStatus = mission.plan_of_action?.status

        return (
          <Card key={mission.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Mission Header */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg">{mission.mission_code}</h3>
                    <Badge variant={mission.mission_type === 'F' ? 'default' : 'secondary'}>
                      {mission.mission_type === 'F' ? 'Flight' : mission.mission_type === 'G' ? 'Ground' : 'Sim'}
                    </Badge>
                    {needsPOA && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Needs POA
                      </Badge>
                    )}
                    {poaStatus === 'shared' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        POA Shared
                      </Badge>
                    )}
                  </div>

                  {/* Student & Lesson Info */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {mission.student?.first_name} {mission.student?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mission.lesson_template?.title || "Custom Lesson"}
                    </p>
                  </div>

                  {/* Date, Time, Aircraft */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {missionDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {mission.scheduled_start_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(`2000-01-01T${mission.scheduled_start_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    )}
                    {mission.aircraft && (
                      <div className="flex items-center gap-1">
                        <Plane className="w-4 h-4" />
                        <span>{mission.aircraft.tail_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {needsPOA ? (
                      <Button size="sm" variant="default" asChild>
                        <Link href={`/instructor/missions/${mission.id}`}>
                          <Plus className="w-4 h-4 mr-1" />
                          Create POA
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/instructor/missions/${mission.id}`}>
                          View Details
                        </Link>
                      </Button>
                    )}
                    {mission.plan_of_action_id && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/instructor/missions/${mission.id}/pre-brief`}>
                          Pre-Brief
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ============================================================================
// QUICK STATS COMPONENT
// ============================================================================

async function QuickStats({ instructorId }: { instructorId: string }) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Get today's missions count
  const today = new Date().toISOString().split('T')[0]
  const { data: todayMissions } = await supabase
    .from("missions")
    .select("id", { count: 'exact', head: true })
    .eq("assigned_instructor_id", instructorId)
    .eq("scheduled_date", today)
    .in("status", ["scheduled", "in_progress"])

  // Get active students count
  const { data: activeStudents } = await supabase
    .from("student_enrollments")
    .select("id", { count: 'exact', head: true })
    .eq("instructor_id", instructorId)
    .eq("status", "active")

  // Get missions needing POA
  const { data: needsPOA } = await supabase
    .from("missions")
    .select("id", { count: 'exact', head: true })
    .eq("assigned_instructor_id", instructorId)
    .eq("status", "scheduled")
    .is("plan_of_action_id", null)
    .gte("scheduled_date", today)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Missions</p>
              <p className="text-3xl font-bold">{todayMissions?.length || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Students</p>
              <p className="text-3xl font-bold">{activeStudents?.length || 0}</p>
            </div>
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Need POA</p>
              <p className="text-3xl font-bold">{needsPOA?.length || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// WEATHER WIDGET
// ============================================================================

async function WeatherWidget() {
  try {
    const weather = await getCurrentWeather()
    
    if (!weather) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="w-5 h-5" />
              Weather
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Weather data unavailable</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="w-5 h-5" />
            Falcon Field Weather
          </CardTitle>
          <CardDescription>Current conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Temperature */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <span className="text-2xl font-bold">{weather.temperature}°F</span>
            </div>

            {/* Wind */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Wind</span>
              </div>
              <span className="text-lg font-semibold">{weather.windSpeed} kts</span>
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Visibility</span>
              </div>
              <span className="text-lg font-semibold">{weather.visibility} SM</span>
            </div>

            {/* Conditions */}
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Conditions</p>
              <p className="text-lg font-medium">{weather.conditions}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error("Error fetching weather:", error)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="w-5 h-5" />
            Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load weather</p>
        </CardContent>
      </Card>
    )
  }
}

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export default async function InstructorDashboard() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Get instructor profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, stripe_connect_account_id, stripe_connect_onboarding_complete")
    .eq("id", user.id)
    .single()

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile?.first_name || 'Instructor'}
        </h1>
        <p className="text-muted-foreground">
          Your flight training command center
        </p>
      </div>

      {/* Stripe Connect Banner (if not completed) */}
      {profile && (
        <StripeConnectBanner
          stripeConnectAccountId={profile.stripe_connect_account_id}
          stripeConnectOnboardingComplete={profile.stripe_connect_onboarding_complete || false}
          userProfile={{
            id: profile.id,
            email: profile.email || '',
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          }}
        />
      )}

      {/* Quick Stats */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <QuickStats instructorId={user.id} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upcoming Missions (takes 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Upcoming Missions</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/instructor/missions/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Mission
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                <UpcomingMissions instructorId={user.id} />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Weather */}
        <div className="space-y-6">
          {/* Weather Widget */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <WeatherWidget />
          </Suspense>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/instructor/students">
                  <Users className="w-4 h-4 mr-2" />
                  My Students
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/instructor/schedule">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/instructor/missions">
                  <Plane className="w-4 h-4 mr-2" />
                  All Missions
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/instructor/billing">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Billing
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
