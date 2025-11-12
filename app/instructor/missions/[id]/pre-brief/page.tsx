import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getMissionById } from "@/lib/mission-service"
import { getPlanOfActionById } from "@/lib/plan-of-action-service"
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
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { PreBriefChecklist } from "@/components/instructor/pre-brief-checklist"

export async function generateMetadata({ params }: { params: { id: string } }) {
  const mission = await getMissionById(params.id)
  return {
    title: `Pre-Brief - ${mission?.mission_code || 'Mission'} | Desert Skies Aviation`,
    description: `Pre-mission briefing and plan of action`,
  }
}

export default async function PreBriefPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const mission = await getMissionById(params.id)

  if (!mission) {
    notFound()
  }

  // Verify instructor has access
  if (mission.assigned_instructor_id !== user.id) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            You don't have permission to view this pre-brief.
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
            No Plan of Action has been generated for this mission yet.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild>
            <Link href={`/instructor/missions/${params.id}`}>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/instructor/missions/${params.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Mission
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Pre-Brief</h1>
              {poa.ai_generated && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  AI Generated
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{mission.mission_code}</p>
          </div>
        </div>
        
        {poa.student_acknowledged_at && (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Student Acknowledged
          </Badge>
        )}
      </div>

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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Student</div>
                  <div className="font-medium">
                    {mission.student?.first_name} {mission.student?.last_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">
                    {new Date(mission.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              {mission.lesson_template?.title && (
                <div>
                  <div className="text-sm text-muted-foreground">Lesson</div>
                  <div className="font-medium">{mission.lesson_template.title}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Objectives */}
          {poa.objectives && poa.objectives.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Mission Objectives
                </CardTitle>
                <CardDescription>What the student will accomplish</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {poa.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Key Briefing Points */}
          {poa.briefing_points && poa.briefing_points.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Key Briefing Points
                </CardTitle>
                <CardDescription>Important topics to discuss</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {poa.briefing_points.map((point, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{point.topic}</div>
                        <div className="text-sm text-muted-foreground mt-1">{point.details}</div>
                        {point.emphasis && (
                          <div className="text-sm font-medium text-orange-600 mt-1">
                            ⚠️ {point.emphasis}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maneuvers to Practice */}
          {poa.maneuvers_to_practice && poa.maneuvers_to_practice.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Maneuvers to Practice</CardTitle>
                <CardDescription>Skills and techniques for this mission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {poa.maneuvers_to_practice.map((maneuver, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <CheckSquare className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{maneuver}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pre-flight Checklist */}
          {poa.preflight_checklist && poa.preflight_checklist.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Pre-Flight Checklist
                </CardTitle>
                <CardDescription>Items to complete before flight</CardDescription>
              </CardHeader>
              <CardContent>
                <PreBriefChecklist 
                  items={poa.preflight_checklist} 
                  missionId={mission.id}
                />
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
                <CardDescription>Recommended training videos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {poa.video_resources.map((video, index) => (
                    <a
                      key={index}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{video.title}</div>
                        {video.duration && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {video.duration}
                          </div>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
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
                <CardTitle>FAA References</CardTitle>
                <CardDescription>Relevant regulations and standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {poa.faa_references.map((ref, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
                      <BookOpen className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <span className="font-mono font-medium">{ref.reference}</span>
                        {ref.description && (
                          <span className="text-muted-foreground"> - {ref.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Weather Minimums */}
          {poa.weather_minimums && (
            <Card>
              <CardHeader>
                <CardTitle>Weather Minimums</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {poa.weather_minimums.ceiling && (
                    <div>
                      <div className="text-muted-foreground">Ceiling</div>
                      <div className="font-medium">{poa.weather_minimums.ceiling}</div>
                    </div>
                  )}
                  {poa.weather_minimums.visibility && (
                    <div>
                      <div className="text-muted-foreground">Visibility</div>
                      <div className="font-medium">{poa.weather_minimums.visibility}</div>
                    </div>
                  )}
                  {poa.weather_minimums.wind && (
                    <div>
                      <div className="text-muted-foreground">Max Wind</div>
                      <div className="font-medium">{poa.weather_minimums.wind}</div>
                    </div>
                  )}
                  {poa.weather_minimums.crosswind && (
                    <div>
                      <div className="text-muted-foreground">Max Crosswind</div>
                      <div className="font-medium">{poa.weather_minimums.crosswind}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!poa.student_acknowledged_at && (
                <Alert>
                  <User className="w-4 h-4" />
                  <AlertDescription className="text-sm">
                    Waiting for student to acknowledge review
                  </AlertDescription>
                </Alert>
              )}
              
              <Button className="w-full" asChild>
                <Link href={`/instructor/missions/${params.id}`}>
                  Complete Pre-Brief
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/student/missions/${params.id}/poa`}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Student View
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* POA Meta Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan of Action Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(poa.created_at).toLocaleDateString()}</span>
              </div>
              {poa.shared_with_student_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shared:</span>
                  <span>{new Date(poa.shared_with_student_at).toLocaleDateString()}</span>
                </div>
              )}
              {poa.student_acknowledged_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Acknowledged:</span>
                  <span>{new Date(poa.student_acknowledged_at).toLocaleDateString()}</span>
                </div>
              )}
              {poa.ai_generated && poa.ai_confidence_score && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Confidence:</span>
                  <span>{(poa.ai_confidence_score * 100).toFixed(0)}%</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

