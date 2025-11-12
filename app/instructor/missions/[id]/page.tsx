import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getMissionById } from "@/lib/mission-service"
import { getTrainingEventsByMissionId } from "@/lib/training-event-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plane, 
  Clock, 
  User, 
  Calendar, 
  MapPin, 
  FileText,
  ArrowLeft,
  Play,
  CheckCircle,
  AlertCircle,
  Edit,
  X,
  Sparkles,
  DollarSign,
  BookOpen,
  Timer,
  Rocket
} from "lucide-react"
import Link from "next/link"
import { MissionActionsPanel } from "@/components/instructor/mission-actions-panel"
import { TrainingEventsTimeline } from "@/components/instructor/training-events-timeline"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mission = await getMissionById(id)
  return {
    title: `Mission ${mission?.mission_code || id} | Desert Skies Aviation`,
    description: `View details and manage training mission`,
  }
}

export default async function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const mission = await getMissionById(id)

  if (!mission) {
    notFound()
  }

  // Verify instructor has access
  if (mission.assigned_instructor_id !== user.id) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            You don't have permission to view this mission.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Get training events
  const trainingEvents = await getTrainingEventsByMissionId(params.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'scheduled': return 'secondary'
      case 'in_progress': return 'outline'
      case 'cancelled': return 'destructive'
      case 'partially_completed': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'in_progress': return <Timer className="w-4 h-4" />
      case 'cancelled': return <X className="w-4 h-4" />
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const missionType = getMissionTypeLabel(mission.mission_type)
  const TypeIcon = missionType.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/instructor/missions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Missions
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{mission.mission_code}</h1>
              <Badge variant={getStatusColor(mission.status)} className="flex items-center gap-1">
                {getStatusIcon(mission.status)}
                {mission.status}
              </Badge>
              <div className="flex items-center gap-1 text-sm">
                <TypeIcon className="w-4 h-4" />
                <span>{missionType.label}</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              {mission.lesson_template?.title || "Custom Mission"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mission Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Mission Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Student:</span>
                    <span className="font-medium">
                      {mission.student?.first_name} {mission.student?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDate(mission.scheduled_date)}</span>
                  </div>
                  {mission.scheduled_start_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Time:</span>
                      <span className="font-medium">{formatTime(mission.scheduled_start_time)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {mission.aircraft && (
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Aircraft:</span>
                      <span className="font-medium">
                        {mission.aircraft.tail_number}
                      </span>
                    </div>
                  )}
                  {mission.aircraft_changed && (
                    <Alert className="mt-2">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription className="text-xs">
                        Aircraft changed: {mission.aircraft_change_reason}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {mission.lesson_template && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">{mission.lesson_template.title}</h4>
                    {mission.lesson_template.description && (
                      <p className="text-sm text-muted-foreground">
                        {mission.lesson_template.description}
                      </p>
                    )}
                  </div>
                </>
              )}

              {mission.is_customized && mission.customizations && (
                <>
                  <Separator />
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      This mission has been customized from the original template
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          {/* Training Events Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Training Events
              </CardTitle>
              <CardDescription>
                Track individual events within this mission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrainingEventsTimeline 
                missionId={mission.id} 
                events={trainingEvents}
                missionStatus={mission.status}
              />
            </CardContent>
          </Card>

          {/* Billing Summary */}
          {trainingEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Billing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trainingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium capitalize">
                          {event.event_type.replace('_', ' ')}
                        </div>
                        {event.actual_duration_minutes && (
                          <div className="text-xs text-muted-foreground">
                            {event.actual_duration_minutes} minutes
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {event.student_charge_cents > 0 && (
                          <div className="font-medium">
                            {formatCurrency(event.student_charge_cents)}
                          </div>
                        )}
                        {event.instructor_payout_cents > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Payout: {formatCurrency(event.instructor_payout_cents)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <div className="text-right">
                      <div>{formatCurrency(mission.total_cost_cents)}</div>
                      <div className="text-xs text-muted-foreground font-normal">
                        Instructor: {formatCurrency(
                          trainingEvents.reduce((sum, e) => sum + e.instructor_payout_cents, 0)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debrief Section */}
          {mission.debrief_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Debrief
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/instructor/missions/${mission.id}/debrief/view`}>
                    View Debrief
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          <MissionActionsPanel 
            mission={mission}
            trainingEvents={trainingEvents}
          />

          {/* Plan of Action */}
          {mission.plan_of_action_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  Plan of Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Pre-mission briefing document ready
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/instructor/missions/${mission.id}/pre-brief`}>
                    View Pre-Brief
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Assessment */}
          {mission.instructor_assessment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={
                  mission.instructor_assessment === 'outstanding' ? 'default' :
                  mission.instructor_assessment === 'satisfactory' ? 'secondary' :
                  'outline'
                } className="capitalize">
                  {mission.instructor_assessment.replace('_', ' ')}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Hours Summary */}
          {(mission.total_flight_hours > 0 || mission.total_ground_hours > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hours Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mission.total_flight_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Flight:</span>
                    <span className="font-medium">{mission.total_flight_hours} hrs</span>
                  </div>
                )}
                {mission.total_ground_hours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ground:</span>
                    <span className="font-medium">{mission.total_ground_hours} hrs</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

