import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getMissionById } from "@/lib/mission-service"
import { getMissionTrainingEvents } from "@/lib/training-event-service"
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
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  BookOpen,
  Timer,
  Rocket,
  Target,
  Info,
  DollarSign,
  Receipt
} from "lucide-react"
import Link from "next/link"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mission = await getMissionById(id)
  return {
    title: `Mission ${mission?.mission_code || id} | Desert Skies Aviation`,
    description: `View your training mission details`,
  }
}

export default async function StudentMissionDetailPage({
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

  // Verify student has access
  if (mission.student_id !== user.id) {
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
  const trainingEvents = await getMissionTrainingEvents(id)

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

  const missionType = getMissionTypeLabel(mission.mission_type)
  const TypeIcon = missionType.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/missions">
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
                    <span className="text-sm text-muted-foreground">Instructor:</span>
                    <span className="font-medium">
                      {mission.instructor?.first_name} {mission.instructor?.last_name}
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
            </CardContent>
          </Card>

          {/* Training Progress */}
          {trainingEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Training Progress
                </CardTitle>
                <CardDescription>
                  Your mission includes these training components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trainingEvents.map((event) => {
                    const isCompleted = event.status === 'completed'
                    const isInProgress = event.status === 'in_progress'
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {isInProgress && <Timer className="w-5 h-5 text-blue-600 animate-pulse" />}
                          {!isCompleted && !isInProgress && <Clock className="w-5 h-5 text-gray-400" />}
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
                        </div>
                        <Badge variant={
                          isCompleted ? 'default' :
                          isInProgress ? 'outline' :
                          'secondary'
                        }>
                          {event.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debrief Preview */}
          {mission.debrief_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Flight Debrief
                </CardTitle>
                <CardDescription>
                  Your instructor's feedback and assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/student/missions/${mission.id}/debrief`}>
                    View Complete Debrief
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Hours Summary */}
          {mission.status === 'completed' && (mission.total_flight_hours > 0 || mission.total_ground_hours > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Hours Logged</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {mission.total_flight_hours > 0 && (
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <Plane className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{mission.total_flight_hours.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Flight Hours</div>
                    </div>
                  )}
                  {mission.total_ground_hours > 0 && (
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">{mission.total_ground_hours.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Ground Hours</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Breakdown - Show for completed missions */}
          {mission.status === 'completed' && trainingEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Billing Summary
                </CardTitle>
                <CardDescription>
                  Itemized breakdown of your training session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Training Events Breakdown */}
                <div className="space-y-3">
                  {trainingEvents
                    .filter(event => event.status === 'completed')
                    .map((event) => {
                      const eventTypeLabel = event.event_type.replace('_', ' ')
                      const instructionCost = (event.student_charge_cents / 100).toFixed(2)
                      const aircraftCost = ((event.aircraft_rental_cents || 0) / 100).toFixed(2)
                      const totalCost = ((event.student_charge_cents + (event.aircraft_rental_cents || 0)) / 100).toFixed(2)
                      const hasAircraftCost = event.aircraft_rental_cents && event.aircraft_rental_cents > 0
                      
                      return (
                        <div key={event.id} className="border rounded-lg overflow-hidden">
                          {/* Event Header */}
                          <div className="flex items-center justify-between p-3 bg-muted/30">
                            <div className="flex items-center gap-3">
                              {event.event_type === 'flight' && <Plane className="w-5 h-5 text-aviation-sky-600" />}
                              {(event.event_type === 'prebrief' || event.event_type === 'postbrief') && <Clock className="w-5 h-5 text-green-600" />}
                              {event.event_type === 'ground' && <BookOpen className="w-5 h-5 text-green-600" />}
                              {event.event_type === 'simulator' && <Rocket className="w-5 h-5 text-purple-600" />}
                              <div>
                                <div className="font-semibold capitalize">{eventTypeLabel}</div>
                                {event.billable_hours > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {event.billable_hours.toFixed(2)} hours
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">${totalCost}</div>
                            </div>
                          </div>
                          
                          {/* Cost Breakdown */}
                          <div className="p-3 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Flight Instruction @ ${(event.student_billing_rate_dollars || 0).toFixed(2)}/hr
                              </span>
                              <span className="font-medium">${instructionCost}</span>
                            </div>
                            {hasAircraftCost && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                  Aircraft Rental ({mission.aircraft?.tail_number || 'N12345'})
                                </span>
                                <span className="font-medium">${aircraftCost}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>

                {/* Cost Summary */}
                {mission.total_cost_cents > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2 p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Instruction</span>
                        <span className="font-medium">
                          ${(trainingEvents.reduce((sum, e) => sum + (e.student_charge_cents || 0), 0) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Aircraft Rental</span>
                        <span className="font-medium">
                          ${(trainingEvents.reduce((sum, e) => sum + (e.aircraft_rental_cents || 0), 0) / 100).toFixed(2)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          <span className="font-bold text-lg">Total</span>
                        </div>
                        <span className="text-2xl font-bold">${(mission.total_cost_cents / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Payment Status */}
                <div className="space-y-3 pt-2">
                  {trainingEvents.some(e => e.student_payment_status === 'pending') ? (
                    <>
                      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-sm">
                          <strong>Payment Required:</strong> $561.00 is owed for this mission
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-2 gap-3">
                        <Button className="w-full" asChild>
                          <Link href="/student/billing/pay-balance">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Pay Now
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/student/billing/add-funds">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Add Funds
                          </Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-900 dark:text-green-100">
                        <strong>Paid:</strong> Posted to your account on {new Date(mission.completed_at!).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* View Full Invoice Button */}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/student/billing">
                    <Receipt className="w-4 h-4 mr-2" />
                    View Complete Billing History
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mission.plan_of_action_id && mission.status === 'scheduled' && (
                <Button variant="default" className="w-full justify-start" asChild>
                  <Link href={`/student/missions/${mission.id}/poa`}>
                    <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
                    Review Plan of Action
                  </Link>
                </Button>
              )}

              {mission.debrief_id && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/student/missions/${mission.id}/debrief`}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Debrief
                  </Link>
                </Button>
              )}

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/student/progress">
                  <Target className="w-4 h-4 mr-2" />
                  View My Progress
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/student/schedule">
                  <Calendar className="w-4 h-4 mr-2" />
                  My Schedule
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Assessment */}
          {mission.instructor_assessment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Instructor Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={
                  mission.instructor_assessment === 'outstanding' ? 'default' :
                  mission.instructor_assessment === 'satisfactory' ? 'secondary' :
                  'outline'
                } className="capitalize text-base px-4 py-2">
                  {mission.instructor_assessment.replace('_', ' ')}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Status Info */}
          {mission.status === 'scheduled' && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription className="text-sm">
                This mission is scheduled. Review the Plan of Action before your flight.
              </AlertDescription>
            </Alert>
          )}

          {mission.status === 'in_progress' && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Timer className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-sm">
                Training in progress. Your instructor is tracking your performance.
              </AlertDescription>
            </Alert>
          )}

          {mission.status === 'completed' && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-sm">
                Mission complete! Review your debrief to see your progress.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}










