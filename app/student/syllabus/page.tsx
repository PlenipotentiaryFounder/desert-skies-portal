import { Suspense } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentEnrollments } from "@/lib/enrollment-service"
import { getSyllabusLessons } from "@/lib/syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { SyllabusProgress } from "@/components/student/syllabus-progress"
import { formatDate } from "@/lib/utils"
import { ChevronRight, Clock, Target, CheckCircle, AlertCircle, Calendar, User } from "lucide-react"

export default async function StudentSyllabusPage() {
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
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Training Syllabus</h1>
          <p className="text-muted-foreground">View your current training program</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Active Enrollment</CardTitle>
            <CardDescription>You are not currently enrolled in any training program</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please contact your flight school administrator to enroll in a training program.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lessons = await getSyllabusLessons(activeEnrollment.syllabus_id)

  // Get flight sessions for this enrollment with detailed maneuver scoring
  const { data: sessions } = await supabase
    .from("flight_sessions")
    .select(`
      id, 
      lesson_id, 
      status, 
      date,
      hobbs_start,
      hobbs_end,
      maneuver_scores (
        id,
        score,
        maneuver_id
      )
    `)
    .eq("enrollment_id", activeEnrollment.id)

  // Get maneuvers for all lessons to calculate progress
  const { data: allLessonManeuvers } = await supabase
    .from("lesson_maneuvers")
    .select("lesson_id, maneuver_id, is_required")
    .in("lesson_id", lessons.map(l => l.id))

  // Create comprehensive lesson progress data
  const lessonProgressMap = new Map()
  
  lessons.forEach(lesson => {
    const lessonSessions = sessions?.filter(s => s.lesson_id === lesson.id) || []
    const completedSessions = lessonSessions.filter(s => s.status === "completed")
    const scheduledSessions = lessonSessions.filter(s => s.status === "scheduled")
    
    // Get maneuvers for this lesson
    const lessonManeuvers = allLessonManeuvers?.filter(lm => lm.lesson_id === lesson.id) || []
    const requiredManeuvers = lessonManeuvers.filter(lm => lm.is_required)
    
    // Calculate maneuver proficiency
    const scoredManeuvers = new Set()
    completedSessions.forEach(session => {
      session.maneuver_scores?.forEach(score => {
        if (score.score >= 3) { // Proficient or better
          scoredManeuvers.add(score.maneuver_id)
        }
      })
    })
    
    const totalFlightHours = completedSessions.reduce((total, session) => {
      const hobbsTime = (session.hobbs_end || 0) - (session.hobbs_start || 0)
      return total + Math.max(0, hobbsTime)
    }, 0)
    
    const maneuverProgress = lessonManeuvers.length > 0 ? 
      (scoredManeuvers.size / lessonManeuvers.length) * 100 : 0
    
    // Determine overall lesson status
    let status = "not_started"
    let statusColor = "bg-gray-200"
    let statusText = "Not Started"
    
    if (scheduledSessions.length > 0 && completedSessions.length === 0) {
      status = "scheduled"
      statusColor = "bg-yellow-500"
      statusText = "Scheduled"
    } else if (completedSessions.length > 0 && maneuverProgress < 100) {
      status = "in_progress"
      statusColor = "bg-blue-500"
      statusText = "In Progress"
    } else if (maneuverProgress === 100 && requiredManeuvers.length > 0) {
      status = "completed"
      statusColor = "bg-green-500"
      statusText = "Completed"
    } else if (completedSessions.length > 0) {
      status = "in_progress"
      statusColor = "bg-blue-500"
      statusText = "In Progress"
    }
    
    lessonProgressMap.set(lesson.id, {
      status,
      statusColor,
      statusText,
      completedSessions: completedSessions.length,
      scheduledSessions: scheduledSessions.length,
      totalFlightHours,
      maneuverProgress,
      totalManeuvers: lessonManeuvers.length,
      scoredManeuvers: scoredManeuvers.size
    })
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Training Syllabus</h1>
        <p className="text-muted-foreground">Track your progress through your training program</p>
      </div>

      {/* Enrollment Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {activeEnrollment.syllabus?.title}
              </CardTitle>
              <CardDescription>{activeEnrollment.syllabus?.faa_type}</CardDescription>
            </div>
            <Badge variant="outline">{activeEnrollment.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Instructor</p>
                <p className="text-sm text-muted-foreground">
                  {activeEnrollment.instructor?.first_name} {activeEnrollment.instructor?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Started</p>
                <p className="text-sm text-muted-foreground">{formatDate(activeEnrollment.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Target Completion</p>
                <p className="text-sm text-muted-foreground">
                  {activeEnrollment.target_completion_date
                    ? formatDate(activeEnrollment.target_completion_date)
                    : "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Progress</p>
                <Suspense fallback={<Skeleton className="h-4 w-16" />}>
                  <SyllabusProgress enrollmentId={activeEnrollment.id} compact />
                </Suspense>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
        <SyllabusProgress enrollmentId={activeEnrollment.id} />
      </Suspense>

      {/* Lessons */}
      <Card>
        <CardHeader>
          <CardTitle>Training Lessons</CardTitle>
          <CardDescription>
            Click on any lesson to view detailed objectives, maneuvers, and your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lessons.map((lesson) => {
              const progress = lessonProgressMap.get(lesson.id) || {
                status: "not_started",
                statusColor: "bg-gray-200",
                statusText: "Not Started",
                completedSessions: 0,
                scheduledSessions: 0,
                totalFlightHours: 0,
                maneuverProgress: 0,
                totalManeuvers: 0,
                scoredManeuvers: 0
              }

              return (
                <Link key={lesson.id} href={`/student/syllabus/${lesson.id}`}>
                  <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                          {lesson.order_index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{lesson.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {lesson.lesson_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>
                          
                          {/* Progress indicators */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {lesson.estimated_hours}h
                            </span>
                            {progress.totalManeuvers > 0 && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {progress.scoredManeuvers}/{progress.totalManeuvers} maneuvers
                              </span>
                            )}
                            {progress.completedSessions > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {progress.completedSessions} sessions ({progress.totalFlightHours.toFixed(1)}h)
                              </span>
                            )}
                            {progress.scheduledSessions > 0 && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {progress.scheduledSessions} scheduled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Maneuver Progress Bar */}
                        {progress.totalManeuvers > 0 && (
                          <div className="hidden md:flex flex-col items-end min-w-[120px]">
                            <div className="text-xs text-muted-foreground mb-1">
                              Proficiency: {Math.round(progress.maneuverProgress)}%
                            </div>
                            <Progress value={progress.maneuverProgress} className="h-2 w-full" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${progress.statusColor}`}></div>
                          <span className="text-sm font-medium min-w-[80px]">{progress.statusText}</span>
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
