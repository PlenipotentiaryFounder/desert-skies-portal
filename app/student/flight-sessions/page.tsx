import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getStudentFlightSessions } from "@/lib/flight-session-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plane, 
  Clock, 
  User, 
  Calendar, 
  MapPin, 
  FileText,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  AlertCircle,
  Timer,
  Fuel,
  Navigation,
  TrendingUp,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { motion } from 'framer-motion'

export const metadata = {
  title: "Flight Sessions | Desert Skies Aviation",
  description: "View and manage your flight training sessions",
}

function FlightSessionCard({ session, index }: { session: any, index: number }) {
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

  const flightDuration = session.hobbs_end && session.hobbs_start 
    ? (session.hobbs_end - session.hobbs_start).toFixed(1)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Plane className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {session.lesson?.title || session.custom_lesson?.name || 'Flight Training Session'}
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(session.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(session.start_time)} - {formatTime(session.end_time)}
                  </span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(session.status)} className="flex items-center gap-1">
                {getStatusIcon(session.status)}
                {session.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Instructor:</span>
              <span className="font-medium">
                {session.instructor?.first_name} {session.instructor?.last_name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Plane className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Aircraft:</span>
              <span className="font-medium">
                {session.aircraft?.tail_number} ({session.aircraft?.make} {session.aircraft?.model})
              </span>
            </div>
            {flightDuration && (
              <div className="flex items-center gap-2 text-sm">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{flightDuration} hrs</span>
              </div>
            )}
          </div>

          {session.notes && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">Notes:</p>
              <p className="text-sm bg-muted/50 p-2 rounded">{session.notes}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/student/flight-sessions/${session.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Link>
            </Button>
            {session.status === 'scheduled' && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/student/schedule/${session.id}/edit`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function FlightStatsCard({ sessions }: { sessions: any[] }) {
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const totalHours = completedSessions.reduce((acc, session) => {
    if (session.hobbs_end && session.hobbs_start) {
      return acc + (session.hobbs_end - session.hobbs_start)
    }
    return acc
  }, 0)

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled')
  const recentSessions = completedSessions.slice(0, 5)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedSessions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold">{upcomingSessions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Flight Hours</p>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{sessions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function StudentFlightSessionsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const flightSessions = await getStudentFlightSessions(user.id)

  // Separate sessions by status
  const upcomingSessions = flightSessions.filter(s => s.status === 'scheduled')
  const completedSessions = flightSessions.filter(s => s.status === 'completed')
  const cancelledSessions = flightSessions.filter(s => ['cancelled', 'no_show'].includes(s.status))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flight Sessions</h1>
          <p className="text-muted-foreground">
            View and manage your flight training sessions
          </p>
        </div>
        <Button asChild>
          <Link href="/student/schedule/new">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Session
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <FlightStatsCard sessions={flightSessions} />

      {/* Sessions Content */}
      {flightSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Plane className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Flight Sessions Yet</h3>
            <p className="text-muted-foreground mb-6">
              Get started by scheduling your first flight training session.
            </p>
            <Button asChild>
              <Link href="/student/schedule/new">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Your First Session
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed ({completedSessions.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Cancelled ({cancelledSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingSessions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Upcoming Sessions</h3>
                  <p className="text-muted-foreground mb-4">
                    Schedule a session to continue your flight training.
                  </p>
                  <Button asChild>
                    <Link href="/student/schedule/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Session
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((session, index) => (
                  <FlightSessionCard key={session.id} session={session} index={index} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedSessions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Completed Sessions</h3>
                  <p className="text-muted-foreground">
                    Your completed flight sessions will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedSessions.map((session, index) => (
                  <FlightSessionCard key={session.id} session={session} index={index} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledSessions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Cancelled Sessions</h3>
                  <p className="text-muted-foreground">
                    Cancelled or no-show sessions will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {cancelledSessions.map((session, index) => (
                  <FlightSessionCard key={session.id} session={session} index={index} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
