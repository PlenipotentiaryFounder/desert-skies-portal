import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getMissionById } from "@/lib/mission-service"
import { getPlanOfActionById, acknowledgePlanOfAction } from "@/lib/plan-of-action-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  BookOpen,
  Target,
  AlertTriangle,
  Video,
  ExternalLink,
  CheckSquare,
  User,
  Calendar,
  Sparkles,
  Download,
  Printer,
  ClipboardCheck
} from "lucide-react"
import Link from "next/link"
import { AcknowledgePOAButton } from "@/components/student/acknowledge-poa-button"
import { ManeuverDetailCard } from "@/components/shared/maneuver-detail-card"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mission = await getMissionById(id)
  return {
    title: `Plan of Action - ${mission?.mission_code || 'Mission'} | Desert Skies Aviation`,
    description: `Pre-flight preparation and training objectives`,
  }
}

export default async function StudentPOAPage({
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
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            You don't have permission to view this plan of action.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!mission.plan_of_action_id) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert>
          <FileText className="w-4 h-4" />
          <AlertDescription>
            Your instructor hasn't created a Plan of Action for this mission yet.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href={`/student/missions/${id}`}>
              Back to Mission
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const poa = await getPlanOfActionById(mission.plan_of_action_id)

  if (!poa) {
    notFound()
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

  const isAcknowledged = !!poa.student_acknowledged_at

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/student/missions/${id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Mission
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Plan of Action</h1>
              {isAcknowledged && (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Reviewed
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {mission.mission_code} - {mission.lesson_template?.title || "Custom Mission"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Acknowledgment Alert */}
      {!isAcknowledged && poa.status === 'shared' && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <Sparkles className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>Please review this Plan of Action and acknowledge when you're ready.</span>
            <AcknowledgePOAButton poaId={poa.id} missionId={id} />
          </AlertDescription>
        </Alert>
      )}

      {isAcknowledged && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription>
            You acknowledged this Plan of Action on {new Date(poa.student_acknowledged_at!).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </AlertDescription>
        </Alert>
      )}

      {/* Pre-Flight Risk Assessment Reminder */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <ClipboardCheck className="w-4 h-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Required:</strong> Complete your Pre-Flight Risk Assessment before this flight to evaluate safety conditions and identify potential hazards.
          </div>
          <Button size="sm" asChild className="ml-4">
            <Link href={`/student/risk-assessment?mission_id=${id}`}>
              Start Assessment
            </Link>
          </Button>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mission Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Mission Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Instructor:</span>
                    <span className="font-medium">
                      {mission.instructor?.first_name} {mission.instructor?.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDate(mission.scheduled_date)}</span>
                  </div>
                  {mission.scheduled_start_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{formatTime(mission.scheduled_start_time)}</span>
                    </div>
                  )}
                  {poa.duration_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{poa.duration_hours} hours</span>
                    </div>
                  )}
                </div>
                
                {poa.mission_overview && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Overview</h4>
                      <p className="text-muted-foreground">{poa.mission_overview}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Training Objectives */}
          {poa.training_objectives && poa.training_objectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Training Objectives
                </CardTitle>
                <CardDescription>What you'll learn and practice in this mission</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {poa.training_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Student Focus Notes */}
          {poa.student_focus_notes && poa.student_focus_notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Focus Areas for You
                </CardTitle>
                <CardDescription>Based on your recent performance and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {poa.student_focus_notes.map((note, index) => (
                    <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm">{note}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maneuvers to Practice - Enhanced with Details */}
          {poa.maneuvers_detail && poa.maneuvers_detail.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Maneuvers to Practice
                </CardTitle>
                <CardDescription>
                  Skills you'll work on with proficiency targets and your current progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {poa.maneuvers_detail.map((maneuver) => (
                    <ManeuverDetailCard
                      key={maneuver.maneuver_id}
                      maneuver={maneuver}
                      viewType="student"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pre-Flight Preparation Checklist */}
          {poa.prep_checklist_items && poa.prep_checklist_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Pre-Flight Preparation Checklist
                </CardTitle>
                <CardDescription>Complete these items before your flight</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {poa.prep_checklist_items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <input 
                        type="checkbox" 
                        id={`checklist-${index}`}
                        className="mt-1 h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`checklist-${index}`} className="flex-1 cursor-pointer">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Resources */}
          {poa.video_resources && poa.video_resources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Video Resources
                </CardTitle>
                <CardDescription>Recommended videos to watch before your flight</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {poa.video_resources.map((video: any, index: number) => (
                    <a
                      key={index}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <Video className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium group-hover:text-blue-600 transition-colors">
                            {video.title}
                          </div>
                          {video.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {video.description}
                            </div>
                          )}
                          {video.duration_minutes && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {video.duration_minutes} minutes
                            </div>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAA References */}
          {poa.faa_references && poa.faa_references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  FAA References
                </CardTitle>
                <CardDescription>Regulations and standards relevant to this mission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {poa.faa_references.map((ref: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium">{ref.title}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {ref.reference}
                          </div>
                          {ref.description && (
                            <div className="text-sm text-muted-foreground mt-2">
                              {ref.description}
                            </div>
                          )}
                        </div>
                        {ref.url && (
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Mission Code</div>
                <div className="font-medium">{mission.mission_code}</div>
              </div>
              {mission.aircraft && (
                <div>
                  <div className="text-muted-foreground">Aircraft</div>
                  <div className="font-medium">{mission.aircraft.tail_number}</div>
                  <div className="text-xs text-muted-foreground">
                    {mission.aircraft.make} {mission.aircraft.model}
                  </div>
                </div>
              )}
              {poa.departure_direction && (
                <div>
                  <div className="text-muted-foreground">Departure Direction</div>
                  <div className="font-medium">{poa.departure_direction}</div>
                </div>
              )}
              {poa.destination_airport && (
                <div>
                  <div className="text-muted-foreground">Destination</div>
                  <div className="font-medium">{poa.destination_airport}</div>
                </div>
              )}
              {poa.practice_area && (
                <div>
                  <div className="text-muted-foreground">Practice Area</div>
                  <div className="font-medium">{poa.practice_area}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!isAcknowledged && poa.status === 'shared' && (
                <AcknowledgePOAButton poaId={poa.id} missionId={id} fullWidth />
              )}
              <Button variant="default" className="w-full justify-start bg-blue-600 hover:bg-blue-700" asChild>
                <Link href={`/student/risk-assessment?mission_id=${id}`}>
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Pre-Flight Risk Assessment
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/student/missions/${id}`}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Mission Details
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/student/progress">
                  <Target className="w-4 h-4 mr-2" />
                  My Progress
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* AI Generation Info */}
          {poa.ai_generated && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  AI-Assisted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This Plan of Action was generated with AI assistance based on your lesson template
                  {poa.prior_debrief_insights && " and your recent performance"}.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

