import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentMissions } from "@/lib/mission-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Plane, 
  Calendar, 
  Clock, 
  User, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Timer,
  Rocket,
  FileText,
  Sparkles,
  TrendingUp
} from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "My Missions | Desert Skies Aviation",
  description: "View your training missions and progress",
}

function StudentMissionCard({ mission }: { mission: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'scheduled': return 'secondary'
      case 'in_progress': return 'outline'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'in_progress': return <Timer className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getMissionTypeLabel = (type: string) => {
    switch (type) {
      case 'F': return { label: 'Flight', icon: Plane }
      case 'G': return { label: 'Ground', icon: BookOpen }
      case 'S': return { label: 'Simulator', icon: Rocket }
      default: return { label: type, icon: Plane }
    }
  }

  const missionType = getMissionTypeLabel(mission.mission_type)
  const TypeIcon = missionType.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{mission.mission_code}</CardTitle>
              <Badge variant={getStatusColor(mission.status)} className="flex items-center gap-1">
                {getStatusIcon(mission.status)}
                {mission.status}
              </Badge>
            </div>
            <CardDescription>
              {mission.lesson_template?.title || "Custom Mission"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <TypeIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{missionType.label}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>
              {mission.instructor?.first_name} {mission.instructor?.last_name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>
              {new Date(mission.scheduled_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            {mission.scheduled_start_time && (
              <>
                <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                <span>
                  {new Date(`2000-01-01T${mission.scheduled_start_time}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </>
            )}
          </div>
          {mission.aircraft && (
            <div className="flex items-center gap-2 text-sm">
              <Plane className="w-4 h-4 text-muted-foreground" />
              <span>{mission.aircraft.tail_number}</span>
            </div>
          )}

          {/* Plan of Action Badge */}
          {mission.plan_of_action_id && mission.status === 'scheduled' && (
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              Plan of Action Ready
            </Badge>
          )}

          {/* Debrief Badge */}
          {mission.debrief_id && (
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <FileText className="w-3 h-3 text-blue-500" />
              Debrief Available
            </Badge>
          )}

          {/* Hours Summary */}
          {(mission.total_flight_hours > 0 || mission.total_ground_hours > 0) && (
            <div className="flex items-center gap-4 text-sm pt-2">
              {mission.total_flight_hours > 0 && (
                <div className="flex items-center gap-1">
                  <Plane className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{mission.total_flight_hours} hrs</span>
                </div>
              )}
              {mission.total_ground_hours > 0 && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium">{mission.total_ground_hours} hrs</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" asChild className="flex-1">
              <Link href={`/student/missions/${mission.id}`}>
                View Details
              </Link>
            </Button>
            {mission.plan_of_action_id && mission.status === 'scheduled' && (
              <Button variant="default" size="sm" asChild className="flex-1">
                <Link href={`/student/missions/${mission.id}/poa`}>
                  Review POA
                </Link>
              </Button>
            )}
            {mission.debrief_id && (
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href={`/student/missions/${mission.id}/debrief`}>
                  View Debrief
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function MissionsList({ studentId, status }: { studentId: string, status?: string }) {
  const missions = await getStudentMissions(studentId, { status })

  if (missions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No missions found</h3>
            <p className="text-muted-foreground mb-4">
              {status ? `No ${status} missions` : "You don't have any missions scheduled yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              Your instructor will create missions for your training
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {missions.map((mission) => (
        <StudentMissionCard key={mission.id} mission={mission} />
      ))}
    </div>
  )
}

async function TrainingStatistics({ studentId }: { studentId: string }) {
  const allMissions = await getStudentMissions(studentId)
  
  const completed = allMissions.filter(m => m.status === 'completed').length
  const upcoming = allMissions.filter(m => m.status === 'scheduled').length
  const totalFlightHours = allMissions.reduce((sum, m) => sum + (m.total_flight_hours || 0), 0)
  const totalGroundHours = allMissions.reduce((sum, m) => sum + (m.total_ground_hours || 0), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Missions</CardDescription>
          <CardTitle className="text-3xl">{allMissions.length}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(completed / allMissions.length) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {completed} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Upcoming</CardDescription>
          <CardTitle className="text-3xl">{upcoming}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-1" />
            Scheduled
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Flight Hours</CardDescription>
          <CardTitle className="text-3xl">{totalFlightHours.toFixed(1)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <Plane className="w-4 h-4 mr-1" />
            Total logged
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Ground Hours</CardDescription>
          <CardTitle className="text-3xl">{totalGroundHours.toFixed(1)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground">
            <BookOpen className="w-4 h-4 mr-1" />
            Total logged
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function StudentMissionsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Missions</h1>
          <p className="text-muted-foreground">
            Track your training progress and upcoming missions
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/progress">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Progress
          </Link>
        </Button>
      </div>

      {/* Statistics */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <TrainingStatistics studentId={user.id} />
      </Suspense>

      {/* Missions Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <MissionsList studentId={user.id} status="scheduled" />
          </Suspense>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-6">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <MissionsList studentId={user.id} status="in_progress" />
          </Suspense>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <MissionsList studentId={user.id} status="completed" />
          </Suspense>
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <MissionsList studentId={user.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}











