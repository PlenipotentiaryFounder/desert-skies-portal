import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { getStudentEnrollments } from "@/lib/enrollment-service"
import { getSyllabusLessonById } from "@/lib/syllabus-service"
import { getManeuversForLesson } from "@/lib/maneuver-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Clock, CheckCircle, AlertCircle, FileText, Target, Plane } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function StudentLessonDetailPage({
  params,
}: {
  params: { lessonId: string }
}) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  const enrollments = await getStudentEnrollments(session.user.id)
  const activeEnrollment = enrollments.find((e) => e.status === "active")

  if (!activeEnrollment) {
    notFound()
  }

  const lesson = await getSyllabusLessonById(params.lessonId)
  if (!lesson || lesson.syllabus_id !== activeEnrollment.syllabus_id) {
    notFound()
  }

  const maneuvers = await getManeuversForLesson(params.lessonId)

  // Get flight sessions for this lesson
  const { data: sessions } = await supabase
    .from("flight_sessions")
    .select(`
      id, 
      date, 
      status, 
      notes,
      prebrief_minutes,
      postbrief_minutes,
      hobbs_start,
      hobbs_end,
      instructor:instructor_id (
        first_name,
        last_name
      ),
      maneuver_scores (
        id,
        score,
        notes,
        maneuver_id,
        maneuver:maneuver_id (
          name,
          category
        )
      )
    `)
    .eq("enrollment_id", activeEnrollment.id)
    .eq("lesson_id", params.lessonId)
    .order("date", { ascending: false })

  const completedSessions = sessions?.filter((s) => s.status === "completed") || []
  const upcomingSessions = sessions?.filter((s) => s.status === "scheduled") || []

  // Calculate lesson progress
  const totalManeuvers = maneuvers.length
  const scoredManeuvers = new Set()
  completedSessions.forEach((session) => {
    session.maneuver_scores?.forEach((score) => {
      if (score.score >= 3) { // Proficient or better
        scoredManeuvers.add(score.maneuver_id)
      }
    })
  })
  const lessonProgress = totalManeuvers > 0 ? (scoredManeuvers.size / totalManeuvers) * 100 : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        <p className="text-muted-foreground">{lesson.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {lesson.estimated_hours} hours
          </div>
          <div className="flex items-center gap-1">
            <Plane className="h-4 w-4" />
            {lesson.lesson_type}
          </div>
          <Badge variant={lesson.lesson_type === "ground" ? "secondary" : "default"}>
            {lesson.lesson_type}
          </Badge>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Lesson Completion</p>
                <p className="text-sm text-muted-foreground">
                  {scoredManeuvers.size} of {totalManeuvers} maneuvers proficient or better
                </p>
              </div>
              <span className="text-lg font-bold">{Math.round(lessonProgress)}%</span>
            </div>
            <Progress value={lessonProgress} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{completedSessions.length}</div>
                <div className="text-xs text-muted-foreground">Completed Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{upcomingSessions.length}</div>
                <div className="text-xs text-muted-foreground">Scheduled Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {completedSessions.reduce((total, session) => {
                    const hobbsTime = (session.hobbs_end || 0) - (session.hobbs_start || 0)
                    return total + Math.max(0, hobbsTime)
                  }, 0).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Flight Hours</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Objectives */}
      {lesson.objectives && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lesson.objectives }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maneuvers */}
      {maneuvers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Flight Maneuvers</CardTitle>
            <CardDescription>
              Required maneuvers for this lesson and your current proficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maneuvers.map((maneuver) => {
                // Get latest score for this maneuver
                let latestScore = 0
                let latestNotes = ""
                completedSessions.forEach((session) => {
                  session.maneuver_scores?.forEach((score) => {
                    if (score.maneuver_id === maneuver.id && score.score > latestScore) {
                      latestScore = score.score
                      latestNotes = score.notes || ""
                    }
                  })
                })

                const getScoreLabel = (score: number) => {
                  switch (score) {
                    case 5: return { label: "Exemplary", color: "text-emerald-600", bgColor: "bg-emerald-100" }
                    case 4: return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100" }
                    case 3: return { label: "Proficient", color: "text-blue-600", bgColor: "bg-blue-100" }
                    case 2: return { label: "Developing", color: "text-yellow-600", bgColor: "bg-yellow-100" }
                    case 1: return { label: "Unsatisfactory", color: "text-red-600", bgColor: "bg-red-100" }
                    default: return { label: "Not Evaluated", color: "text-gray-600", bgColor: "bg-gray-100" }
                  }
                }

                const scoreInfo = getScoreLabel(latestScore)

                return (
                  <div key={maneuver.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{maneuver.name}</h3>
                          {maneuver.is_required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{maneuver.description}</p>
                        <p className="text-xs text-muted-foreground">Category: {maneuver.category}</p>
                        {maneuver.faa_reference && (
                          <p className="text-xs text-muted-foreground">FAA Reference: {maneuver.faa_reference}</p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <Badge className={`${scoreInfo.color} ${scoreInfo.bgColor}`}>
                          {scoreInfo.label}
                        </Badge>
                        {latestScore > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Score: {latestScore}/5
                          </div>
                        )}
                      </div>
                    </div>
                    {latestNotes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                        <p className="font-medium text-xs text-gray-600">Latest Instructor Notes:</p>
                        <p className="text-gray-700">{latestNotes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Core Topics */}
      {lesson.core_topics && lesson.core_topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Core Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lesson.core_topics.map((topic, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm">{topic}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      {sessions && sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>Your flight sessions for this lesson</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{formatDate(session.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        with {session.instructor?.first_name} {session.instructor?.last_name}
                      </p>
                    </div>
                    <Badge variant={session.status === "completed" ? "default" : session.status === "scheduled" ? "secondary" : "destructive"}>
                      {session.status}
                    </Badge>
                  </div>
                  
                  {session.status === "completed" && (
                    <div className="space-y-2 text-sm">
                      {session.hobbs_start && session.hobbs_end && (
                        <p>Flight Time: {((session.hobbs_end - session.hobbs_start) || 0).toFixed(1)} hours</p>
                      )}
                      {session.prebrief_minutes > 0 && (
                        <p>Pre-brief: {session.prebrief_minutes} minutes</p>
                      )}
                      {session.postbrief_minutes > 0 && (
                        <p>Post-brief: {session.postbrief_minutes} minutes</p>
                      )}
                      {session.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="font-medium text-xs text-gray-600">Session Notes:</p>
                          <p className="text-gray-700">{session.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 