import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plane, 
  BookOpen,
  Rocket,
  Calendar, 
  Clock, 
  User,
  CheckCircle,
  AlertCircle,
  Timer,
  Sparkles,
  FileText,
  ArrowRight,
  PlayCircle
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Mission {
  id: string
  mission_code: string
  mission_type: string
  status: string
  scheduled_date: string
  scheduled_start_time: string | null
  plan_of_action_id: string | null
  debrief_id: string | null
  total_flight_hours: number
  total_ground_hours: number
  total_cost_cents: number
  instructor?: {
    first_name: string
    last_name: string
  }
  aircraft?: {
    tail_number: string
  }
  lesson_template?: {
    title: string
  }
}

function MissionCard({ mission }: { mission: Mission }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': 
        return { 
          variant: 'default' as const, 
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Completed',
          bgClass: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
        }
      case 'scheduled': 
        return { 
          variant: 'secondary' as const, 
          icon: <Clock className="w-4 h-4" />,
          label: 'Scheduled',
          bgClass: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
        }
      case 'in_progress': 
        return { 
          variant: 'outline' as const, 
          icon: <Timer className="w-4 h-4" />,
          label: 'In Progress',
          bgClass: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
        }
      case 'cancelled': 
        return { 
          variant: 'destructive' as const, 
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Cancelled',
          bgClass: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
        }
      default: 
        return { 
          variant: 'outline' as const, 
          icon: <Clock className="w-4 h-4" />,
          label: status,
          bgClass: ''
        }
    }
  }

  const getMissionTypeInfo = (type: string) => {
    switch (type) {
      case 'F': 
        return { 
          label: 'Flight Training', 
          icon: Plane, 
          color: 'text-aviation-sky-600 dark:text-aviation-sky-400',
          bgColor: 'bg-aviation-sky-100 dark:bg-aviation-sky-950/40',
          borderColor: 'border-l-aviation-sky-500',
          accentClass: 'from-aviation-sky-500/10 to-transparent'
        }
      case 'G': 
        return { 
          label: 'Ground Instruction', 
          icon: BookOpen, 
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-950/40',
          borderColor: 'border-l-green-500',
          accentClass: 'from-green-500/10 to-transparent'
        }
      case 'S': 
        return { 
          label: 'Simulator Session', 
          icon: Rocket, 
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-100 dark:bg-purple-950/40',
          borderColor: 'border-l-purple-500',
          accentClass: 'from-purple-500/10 to-transparent'
        }
      default: 
        return { 
          label: type, 
          icon: Plane, 
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-l-gray-500',
          accentClass: 'from-gray-500/10 to-transparent'
        }
    }
  }

  const missionType = getMissionTypeInfo(mission.mission_type)
  const statusConfig = getStatusConfig(mission.status)
  const TypeIcon = missionType.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Check if mission is today or upcoming soon
  const missionDate = new Date(mission.scheduled_date)
  const today = new Date()
  const daysUntil = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isUpcoming = daysUntil >= 0 && daysUntil <= 3 && mission.status === 'scheduled'

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4",
      missionType.borderColor,
      isUpcoming && "ring-2 ring-aviation-sunset-300 dark:ring-aviation-sunset-700"
    )}>
      {/* Gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30", missionType.accentClass)} />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl",
              missionType.bgColor
            )}>
              <TypeIcon className={cn("w-6 h-6", missionType.color)} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold">{mission.mission_code}</CardTitle>
                {isUpcoming && (
                  <Badge variant="outline" className="animate-pulse border-aviation-sunset-500 text-aviation-sunset-700 dark:text-aviation-sunset-300">
                    {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                  </Badge>
                )}
              </div>
              <div className={cn("text-xs font-semibold uppercase tracking-wider", missionType.color)}>
                {missionType.label}
              </div>
            </div>
          </div>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1.5 px-3 py-1">
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>
        
        {mission.lesson_template?.title && (
          <CardDescription className="text-base font-medium">
            {mission.lesson_template.title}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Date and Time */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{formatDate(mission.scheduled_date)}</span>
          </div>
          {mission.scheduled_start_time && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{formatTime(mission.scheduled_start_time)}</span>
            </div>
          )}
        </div>

        {/* Instructor and Aircraft */}
        <div className="grid grid-cols-1 gap-2">
          {mission.instructor && (
            <div className="flex items-center gap-2 text-sm px-3 py-2 bg-muted/30 rounded-lg">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {mission.instructor.first_name} {mission.instructor.last_name}
              </span>
            </div>
          )}
          {mission.mission_type === 'F' && mission.aircraft && (
            <div className="flex items-center gap-2 text-sm px-3 py-2 bg-muted/30 rounded-lg">
              <Plane className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{mission.aircraft.tail_number}</span>
            </div>
          )}
        </div>

        {/* POA/Debrief Status Badges */}
        {(mission.plan_of_action_id || mission.debrief_id) && (
          <div className="flex items-center gap-2 flex-wrap">
            {mission.plan_of_action_id && mission.status === 'scheduled' && (
              <Badge variant="outline" className="flex items-center gap-1.5 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300">
                <Sparkles className="w-3.5 h-3.5" />
                Plan of Action Ready
              </Badge>
            )}
            {mission.debrief_id && (
              <Badge variant="outline" className="flex items-center gap-1.5 border-blue-500/50 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                <FileText className="w-3.5 h-3.5" />
                Debrief Available
              </Badge>
            )}
          </div>
        )}

        {/* Hours and Cost (for completed missions) */}
        {mission.status === 'completed' && (mission.total_flight_hours > 0 || mission.total_ground_hours > 0) && (
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-3">
              {mission.total_flight_hours > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-aviation-sky-50 dark:bg-aviation-sky-950/30 rounded-lg">
                  <Plane className="w-4 h-4 text-aviation-sky-600" />
                  <span className="text-sm font-bold text-aviation-sky-700 dark:text-aviation-sky-300">
                    {mission.total_flight_hours.toFixed(1)} hrs
                  </span>
                </div>
              )}
              {mission.total_ground_hours > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">
                    {mission.total_ground_hours.toFixed(1)} hrs
                  </span>
                </div>
              )}
            </div>
            {mission.total_cost_cents > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Total Cost:</span>
                <span className="text-base font-bold">${(mission.total_cost_cents / 100).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2 pt-3">
          {/* Prebrief POA - Prominent for scheduled missions */}
          {mission.plan_of_action_id && mission.status === 'scheduled' && (
            <Button size="lg" asChild className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold shadow-lg">
              <Link href={`/student/missions/${mission.id}/poa`}>
                <Sparkles className="w-5 h-5 mr-2" />
                Prebrief - Review Plan of Action
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          )}
          
          {/* View Debrief - Prominent for completed missions */}
          {mission.debrief_id && mission.status === 'completed' && (
            <Button size="lg" variant="default" asChild className="w-full font-semibold shadow-lg">
              <Link href={`/student/missions/${mission.id}/debrief`}>
                <FileText className="w-5 h-5 mr-2" />
                View Mission Debrief
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          )}
          
          {/* View Details - Secondary */}
          <Button variant="outline" size="default" asChild className="w-full">
            <Link href={`/student/missions/${mission.id}`}>
              <PlayCircle className="w-4 h-4 mr-2" />
              View Full Mission Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function StudentMissionsList({ missions }: { missions: Mission[] }) {
  const upcoming = missions.filter(m => m.status === 'scheduled')
  const inProgress = missions.filter(m => m.status === 'in_progress')
  const completed = missions.filter(m => m.status === 'completed')

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="upcoming">
          Upcoming ({upcoming.length})
        </TabsTrigger>
        <TabsTrigger value="in_progress">
          In Progress ({inProgress.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completed.length})
        </TabsTrigger>
        <TabsTrigger value="all">
          All ({missions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="space-y-4 mt-6">
        {upcoming.length === 0 ? (
          <EmptyState message="No upcoming training missions scheduled" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="in_progress" className="space-y-4 mt-6">
        {inProgress.length === 0 ? (
          <EmptyState message="No training missions currently in progress" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-4 mt-6">
        {completed.length === 0 ? (
          <EmptyState message="No completed training missions yet" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="all" className="space-y-4 mt-6">
        {missions.length === 0 ? (
          <EmptyState message="No training missions found" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

