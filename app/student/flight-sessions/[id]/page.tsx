import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plane, 
  Clock, 
  User, 
  Calendar, 
  MapPin, 
  FileText,
  Edit,
  CheckCircle,
  AlertCircle,
  Timer,
  Fuel,
  Navigation,
  ArrowLeft,
  Download,
  Eye,
  BarChart3,
  Target,
  BookOpen
} from "lucide-react"
import Link from "next/link"

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Flight Session Details | Desert Skies Aviation`,
    description: `View details for flight session ${params.id}`,
  }
}

async function getFlightSession(sessionId: string, userId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data: session, error } = await supabase
    .from('flight_sessions')
    .select(`
      *,
      student_enrollments!inner(student_id),
      syllabus_lessons(id, title, description, objective),
      custom_lessons(id, name, description),
      profiles!flight_sessions_instructor_id_fkey(first_name, last_name, email),
      aircraft(tail_number, make, model, year),
      locations(name, address),
      maneuver_scores(
        id,
        score,
        notes,
        maneuver_id,
        maneuvers(name, description, category)
      ),
      lesson_feedback(
        id,
        instructor_notes,
        student_notes,
        created_at
      )
    `)
    .eq('id', sessionId)
    .eq('student_enrollments.student_id', userId)
    .single()

  if (error) {
    console.error('Error fetching flight session:', error)
    return null
  }

  return session
}

export default async function FlightSessionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const session = await getFlightSession(params.id, user.id)

  if (!session) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default'
      case 'scheduled': return 'secondary'
      case 'cancelled': return 'destructive'
      case 'no_show': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      case 'no_show': return <AlertCircle className="w-4 h-4" />
      default: return <Timer className="w-4 h-4" />
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

  const flightDuration = session.hobbs_end && session.hobbs_start 
    ? (session.hobbs_end - session.hobbs_start).toFixed(1)
    : null

  const lesson = session.syllabus_lessons || session.custom_lessons

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/flight-sessions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {lesson?.title || lesson?.name || 'Flight Training Session'}
            </h1>
            <p className="text-muted-foreground">
              Session details and performance data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(session.status)} className="flex items-center gap-1">
            {getStatusIcon(session.status)}
            {session.status}
          </Badge>
          {session.status === 'scheduled' && (
            <Button variant="outline" asChild>
              <Link href={`/student/schedule/${session.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Session
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Session Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDate(session.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Time:</span>
                    <span className="font-medium">
                      {formatTime(session.start_time)} - {formatTime(session.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Instructor:</span>
                    <span className="font-medium">
                      {session.profiles?.first_name} {session.profiles?.last_name}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Aircraft:</span>
                    <span className="font-medium">
                      {session.aircraft?.tail_number} ({session.aircraft?.make} {session.aircraft?.model})
                    </span>
                  </div>
                  {session.locations && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Location:</span>
                      <span className="font-medium">{session.locations.name}</span>
                    </div>
                  )}
                  {flightDuration && (
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Duration:</span>
                      <span className="font-medium">{flightDuration} hours</span>
                    </div>
                  )}
                </div>
              </div>

              {session.session_type && (
                <div className="pt-2">
                  <Badge variant="outline" className="capitalize">
                    {session.session_type.replace('_', ' ')}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lesson Information */}
          {lesson && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Lesson Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{lesson.title || lesson.name}</h3>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                  )}
                </div>
                {lesson.objective && (
                  <div>
                    <h4 className="font-medium text-sm">Objective:</h4>
                    <p className="text-sm text-muted-foreground">{lesson.objective}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Flight Data */}
          {session.status === 'completed' && (session.hobbs_start || session.hobbs_end) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Flight Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {session.hobbs_start && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Hobbs Start</p>
                      <p className="text-2xl font-bold">{session.hobbs_start}</p>
                    </div>
                  )}
                  {session.hobbs_end && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Hobbs End</p>
                      <p className="text-2xl font-bold">{session.hobbs_end}</p>
                    </div>
                  )}
                  {flightDuration && (
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Flight Time</p>
                      <p className="text-2xl font-bold text-primary">{flightDuration} hrs</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maneuver Scores */}
          {session.maneuver_scores && session.maneuver_scores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Maneuver Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {session.maneuver_scores.map((score: any) => (
                    <div key={score.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{score.maneuvers?.name}</h4>
                        {score.notes && (
                          <p className="text-sm text-muted-foreground">{score.notes}</p>
                        )}
                      </div>
                      <Badge variant={score.score >= 4 ? "default" : score.score >= 3 ? "secondary" : "destructive"}>
                        {score.score}/5
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes and Feedback */}
          {(session.notes || (session.lesson_feedback && session.lesson_feedback.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes & Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.notes && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Session Notes:</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{session.notes}</p>
                  </div>
                )}
                
                {session.lesson_feedback && session.lesson_feedback.map((feedback: any) => (
                  <div key={feedback.id} className="space-y-3">
                    <Separator />
                    {feedback.instructor_notes && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Instructor Feedback:</h4>
                        <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                          {feedback.instructor_notes}
                        </p>
                      </div>
                    )}
                    {feedback.student_notes && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Student Notes:</h4>
                        <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                          {feedback.student_notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {session.status === 'scheduled' && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/student/schedule/${session.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Session
                  </Link>
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/student/logbook">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Logbook
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/student/reports">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Weather Conditions */}
          {session.weather_conditions && (
            <Card>
              <CardHeader>
                <CardTitle>Weather Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {Object.entries(session.weather_conditions).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}:</span>
                      <span className="font-medium">{value as string}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
