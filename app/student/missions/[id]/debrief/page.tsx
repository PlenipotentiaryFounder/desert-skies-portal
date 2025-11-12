import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getMissionById } from "@/lib/mission-service"
import { getDebriefById } from "@/lib/debrief-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft,
  CheckCircle,
  FileText,
  BookOpen,
  Target,
  AlertTriangle,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Printer,
  Award,
  AlertCircle as AlertCircleIcon,
  Lightbulb
} from "lucide-react"
import Link from "next/link"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mission = await getMissionById(id)
  return {
    title: `Debrief - ${mission?.mission_code || 'Mission'} | Desert Skies Aviation`,
    description: `Post-flight debrief and performance feedback`,
  }
}

export default async function StudentDebriefPage({
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
            You don't have permission to view this debrief.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!mission.debrief_id) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Alert>
          <FileText className="w-4 h-4" />
          <AlertDescription>
            Your instructor hasn't completed the debrief for this mission yet.
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

  const debrief = await getDebriefById(mission.debrief_id)

  if (!debrief) {
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

  const getScoreColor = (score: number) => {
    if (score >= 3) return "text-green-600"
    if (score === 2) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 3) return "default"
    if (score === 2) return "secondary"
    return "destructive"
  }

  const getPerformanceIcon = (level: string) => {
    switch (level) {
      case 'exceptional':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'proficient':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'progressing':
        return <Minus className="w-4 h-4 text-yellow-600" />
      case 'unsatisfactory':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength':
        return <Award className="w-5 h-5 text-green-600" />
      case 'improvement':
        return <Target className="w-5 h-5 text-yellow-600" />
      case 'correction':
        return <AlertCircleIcon className="w-5 h-5 text-red-600" />
      default:
        return <Lightbulb className="w-5 h-5 text-blue-600" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength':
        return "border-green-200 bg-green-50 dark:bg-green-950/20"
      case 'improvement':
        return "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
      case 'correction':
        return "border-red-200 bg-red-50 dark:bg-red-950/20"
      default:
        return "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
    }
  }

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
              <h1 className="text-3xl font-bold tracking-tight">Flight Debrief</h1>
              {mission.instructor_assessment && (
                <Badge 
                  variant={
                    mission.instructor_assessment === 'outstanding' ? 'default' :
                    mission.instructor_assessment === 'satisfactory' ? 'secondary' :
                    'outline'
                  }
                  className="capitalize text-base px-4 py-1"
                >
                  {mission.instructor_assessment.replace('_', ' ')}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Overview */}
          {debrief.general_overview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  General Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{debrief.general_overview}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Takeaways */}
          {debrief.key_takeaways && debrief.key_takeaways.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Key Takeaways
                </CardTitle>
                <CardDescription>Important observations from your instructor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {debrief.key_takeaways.map((takeaway: any, index: number) => (
                    <div 
                      key={index} 
                      className={`p-4 border rounded-lg ${getCategoryColor(takeaway.category)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getCategoryIcon(takeaway.category)}
                        <div className="flex-1 space-y-2">
                          <div className="font-semibold capitalize">
                            {takeaway.category}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium mb-1">Observation:</div>
                            <div className="text-muted-foreground">{takeaway.observation}</div>
                          </div>
                          {takeaway.evidence && (
                            <div className="text-sm">
                              <div className="font-medium mb-1">Evidence:</div>
                              <div className="text-muted-foreground">{takeaway.evidence}</div>
                            </div>
                          )}
                          {takeaway.coaching && (
                            <div className="text-sm">
                              <div className="font-medium mb-1">Coaching:</div>
                              <div className="text-muted-foreground">{takeaway.coaching}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maneuver Performance */}
          {debrief.maneuver_details && debrief.maneuver_details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Maneuver Performance
                </CardTitle>
                <CardDescription>
                  Your performance on each maneuver (1=Unsatisfactory, 2=Progressing, 3=Proficient, 4=Exceptional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {debrief.maneuver_details.map((maneuver: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getPerformanceIcon(maneuver.performance_level)}
                            <div>
                              <div className="font-semibold">{maneuver.maneuver_name}</div>
                              {maneuver.acs_task_code && (
                                <div className="text-xs text-muted-foreground">
                                  ACS Task: {maneuver.acs_task_code}
                                </div>
                              )}
                            </div>
                          </div>
                          {maneuver.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {maneuver.notes}
                            </p>
                          )}
                          {maneuver.far_references && maneuver.far_references.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              FAR References: {maneuver.far_references.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={getScoreBadgeVariant(maneuver.score)}
                            className="text-lg font-bold px-3 py-1"
                          >
                            {maneuver.score}/4
                          </Badge>
                          <span className={`text-xs font-medium capitalize ${getScoreColor(maneuver.score)}`}>
                            {maneuver.performance_level}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAR References Discussed */}
          {debrief.far_references && debrief.far_references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Regulations Discussed
                </CardTitle>
                <CardDescription>FAR references covered during this flight</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {debrief.far_references.map((ref: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{ref.reference}</div>
                      {ref.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {ref.description}
                        </div>
                      )}
                      {ref.context && (
                        <div className="text-sm text-muted-foreground mt-1 italic">
                          Context: {ref.context}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Lesson Plan */}
          {debrief.next_lesson_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Next Steps
                </CardTitle>
                <CardDescription>What to focus on for your next flight</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {debrief.next_lesson_plan}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Flight Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flight Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Mission Code</div>
                <div className="font-medium">{mission.mission_code}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Instructor</div>
                <div className="font-medium">
                  {mission.instructor?.first_name} {mission.instructor?.last_name}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Date</div>
                <div className="font-medium">{formatDate(mission.scheduled_date)}</div>
              </div>
              {mission.aircraft && (
                <div>
                  <div className="text-muted-foreground">Aircraft</div>
                  <div className="font-medium">{mission.aircraft.tail_number}</div>
                </div>
              )}
              {mission.total_flight_hours > 0 && (
                <div>
                  <div className="text-muted-foreground">Flight Hours</div>
                  <div className="font-medium">{mission.total_flight_hours} hrs</div>
                </div>
              )}
              {mission.total_ground_hours > 0 && (
                <div>
                  <div className="text-muted-foreground">Ground Hours</div>
                  <div className="font-medium">{mission.total_ground_hours} hrs</div>
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
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/student/missions/${id}`}>
                  <FileText className="w-4 h-4 mr-2" />
                  View Mission Details
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/student/progress">
                  <Target className="w-4 h-4 mr-2" />
                  View My Progress
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/student/logbook">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Add to Logbook
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          {debrief.maneuver_details && debrief.maneuver_details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Maneuvers Practiced</div>
                  <div className="font-medium text-2xl">{debrief.maneuver_details.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Proficient or Better</div>
                  <div className="font-medium text-2xl text-green-600">
                    {debrief.maneuver_details.filter((m: any) => m.score >= 3).length}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Needs Practice</div>
                  <div className="font-medium text-2xl text-yellow-600">
                    {debrief.maneuver_details.filter((m: any) => m.score < 3).length}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Processing Info */}
          {debrief.ai_formatted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                  AI-Assisted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This debrief was formatted with AI assistance to provide clear, structured feedback.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

