import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentMissions } from "@/lib/mission-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Clock,
  Plane,
  User,
  ArrowRight,
  Sparkles,
  FileText,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

export async function UpcomingMissionsSection({ studentId }: { studentId: string }) {
  console.log('[UpcomingMissionsSection] Fetching missions for student:', studentId)
  
  try {
    // Get upcoming and in-progress missions
    const missions = await getStudentMissions(studentId, {
      status: ['scheduled', 'in_progress']
    })
    
    console.log('[UpcomingMissionsSection] Found missions:', missions.length)
    
    // Sort by date, earliest first
    const sortedMissions = missions
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
      .slice(0, 3) // Show only next 3
    
    if (sortedMissions.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Missions
            </CardTitle>
            <CardDescription>Your next scheduled training missions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Upcoming Missions</h3>
              <p className="text-muted-foreground mb-4">
                Contact your instructor to schedule your next training session
              </p>
              <Button variant="outline" asChild>
                <Link href="/student/schedule">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Schedule
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Missions
              </CardTitle>
              <CardDescription>Your next scheduled training missions</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/missions">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedMissions.map((mission) => {
            const missionDate = new Date(mission.scheduled_date)
            const today = new Date()
            const daysUntil = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            
            const isToday = daysUntil === 0
            const isTomorrow = daysUntil === 1
            const isThisWeek = daysUntil <= 7 && daysUntil > 0
            
            let dateLabel = missionDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: missionDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            })
            
            if (isToday) dateLabel = 'Today'
            else if (isTomorrow) dateLabel = 'Tomorrow'
            else if (isThisWeek) dateLabel = missionDate.toLocaleDateString('en-US', { weekday: 'long' })
            
            const getMissionTypeConfig = () => {
              switch (mission.mission_type) {
                case 'F': 
                  return {
                    icon: <Plane className="w-4 h-4" />,
                    label: 'Flight',
                    bgColor: 'bg-aviation-sky-100 dark:bg-aviation-sky-950/40',
                    textColor: 'text-aviation-sky-700 dark:text-aviation-sky-300',
                    borderColor: 'border-l-4 border-aviation-sky-500'
                  }
                case 'G': 
                  return {
                    icon: <FileText className="w-4 h-4" />,
                    label: 'Ground',
                    bgColor: 'bg-green-100 dark:bg-green-950/40',
                    textColor: 'text-green-700 dark:text-green-300',
                    borderColor: 'border-l-4 border-green-500'
                  }
                case 'S': 
                  return {
                    icon: <Plane className="w-4 h-4" />,
                    label: 'Simulator',
                    bgColor: 'bg-purple-100 dark:bg-purple-950/40',
                    textColor: 'text-purple-700 dark:text-purple-300',
                    borderColor: 'border-l-4 border-purple-500'
                  }
                default: 
                  return {
                    icon: <Calendar className="w-4 h-4" />,
                    label: 'Training',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-700',
                    borderColor: 'border-l-4 border-gray-500'
                  }
              }
            }
            
            const missionTypeConfig = getMissionTypeConfig()
            
            return (
              <div 
                key={mission.id} 
                className={`rounded-xl p-5 hover:shadow-md transition-all duration-300 ${missionTypeConfig.borderColor} ${
                  isToday || isTomorrow ? 'ring-2 ring-aviation-sunset-400 dark:ring-aviation-sunset-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${missionTypeConfig.bgColor}`}>
                      {missionTypeConfig.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{mission.mission_code}</span>
                        {mission.plan_of_action_id && (
                          <Badge variant="outline" className="flex items-center gap-1 text-xs border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300">
                            <Sparkles className="w-3 h-3" />
                            POA
                          </Badge>
                        )}
                      </div>
                      <div className={`text-xs font-semibold uppercase tracking-wide ${missionTypeConfig.textColor}`}>
                        {missionTypeConfig.label}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={isToday || isTomorrow ? 'default' : 'secondary'}
                    className={isToday ? 'animate-pulse' : ''}
                  >
                    {dateLabel}
                  </Badge>
                </div>
                
                {mission.lesson_template?.title && (
                  <p className="text-sm font-medium text-muted-foreground mb-3 ml-12">
                    {mission.lesson_template.title}
                  </p>
                )}
                
                <div className="flex items-center gap-3 text-sm mb-4 ml-12 flex-wrap">
                  {mission.scheduled_start_time && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">
                        {new Date(`2000-01-01T${mission.scheduled_start_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  )}
                  {mission.instructor && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-md">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{mission.instructor.first_name} {mission.instructor.last_name}</span>
                    </div>
                  )}
                  {mission.mission_type === 'F' && mission.aircraft && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-md">
                      <Plane className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{mission.aircraft.tail_number}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {mission.plan_of_action_id ? (
                    <>
                      <Button variant="default" size="sm" asChild className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 font-semibold">
                        <Link href={`/student/missions/${mission.id}/poa`}>
                          <Sparkles className="w-4 h-4 mr-1.5" />
                          Prebrief POA
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/student/missions/${mission.id}`}>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/student/missions/${mission.id}`}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
          
          {missions.length > 3 && (
            <Button variant="link" asChild className="w-full">
              <Link href="/student/missions">
                View {missions.length - 3} more mission{missions.length - 3 !== 1 ? 's' : ''}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('[UpcomingMissionsSection] Error fetching missions:', error)
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Missions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Missions</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load your missions. Please try refreshing the page.
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
}

