import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getInstructorMissions } from "@/lib/mission-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  Plane,
  BookOpen,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Timer
} from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Missions | Desert Skies Aviation",
  description: "View and manage your training missions",
}

function MissionCard({ mission }: { mission: any }) {
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
      case 'F': return 'Flight'
      case 'G': return 'Ground'
      case 'S': return 'Simulator'
      default: return type
    }
  }

  const getMissionTypeIcon = (type: string) => {
    switch (type) {
      case 'F': return <Plane className="w-4 h-4" />
      case 'G': return <BookOpen className="w-4 h-4" />
      case 'S': return <TrendingUp className="w-4 h-4" />
      default: return <Plane className="w-4 h-4" />
    }
  }

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
            {getMissionTypeIcon(mission.mission_type)}
            <span className="text-sm font-medium">{getMissionTypeLabel(mission.mission_type)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>
              {mission.student?.first_name} {mission.student?.last_name}
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
          
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/instructor/missions/${mission.id}`}>
                View Details
              </Link>
            </Button>
            {mission.status === 'scheduled' && mission.plan_of_action_id && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/instructor/missions/${mission.id}/pre-brief`}>
                  Pre-Brief
                </Link>
              </Button>
            )}
            {(mission.status === 'in_progress' || mission.status === 'completed') && !mission.debrief_id && (
              <Button size="sm" asChild>
                <Link href={`/instructor/missions/${mission.id}/debrief`}>
                  Debrief
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function MissionsList({ instructorId, status }: { instructorId: string, status?: string }) {
  const missions = await getInstructorMissions(instructorId, { status })

  if (missions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No missions found</h3>
            <p className="text-muted-foreground mb-4">
              {status ? `No ${status} missions` : "You haven't created any missions yet"}
            </p>
            <Button asChild>
              <Link href="/instructor/missions/new">
                <Plus className="w-4 h-4 mr-2" />
                Create First Mission
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {missions.map((mission) => (
        <MissionCard key={mission.id} mission={mission} />
      ))}
    </div>
  )
}

export default async function InstructorMissionsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Missions</h1>
          <p className="text-muted-foreground">
            Comprehensive training missions with integrated workflow
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/missions/new">
            <Plus className="w-4 h-4 mr-2" />
            New Mission
          </Link>
        </Button>
      </div>

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
            <MissionsList instructorId={user.id} status="scheduled" />
          </Suspense>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-6">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <MissionsList instructorId={user.id} status="in_progress" />
          </Suspense>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <MissionsList instructorId={user.id} status="completed" />
          </Suspense>
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          <Suspense fallback={<Skeleton className="h-48 w-full" />}>
            <MissionsList instructorId={user.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

