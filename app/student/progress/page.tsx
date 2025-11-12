import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { 
  getStudentManeuverProgress,
  getManeuverProgressSummary,
  getCheckrideReadinessReport,
  getManeuversByCategory,
  getRecentProgress
} from "@/lib/maneuver-progress-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  CheckCircle,
  AlertCircle,
  Trophy,
  BarChart3,
  Info,
  Rocket
} from "lucide-react"
import { ManeuverProgressChart } from "@/components/student/maneuver-progress-chart"
import { CheckrideReadinessWidget } from "@/components/student/checkride-readiness-widget"

export const metadata = {
  title: "My Progress | Desert Skies Aviation",
  description: "Track your training progress and maneuver proficiency",
}

async function ProgressSummaryCards({ studentId }: { studentId: string }) {
  const summary = await getManeuverProgressSummary(studentId)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Maneuvers</CardDescription>
          <CardTitle className="text-3xl">{summary.total_maneuvers}</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={(summary.proficient_maneuvers / summary.total_maneuvers) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {summary.proficient_maneuvers} proficient
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Checkride Ready</CardDescription>
          <CardTitle className="text-3xl">{summary.checkride_ready_maneuvers}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm">
            <Trophy className="w-4 h-4 mr-1 text-yellow-600" />
            <span className="text-muted-foreground">Consistently proficient</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Average Proficiency</CardDescription>
          <CardTitle className="text-3xl">{summary.average_proficiency.toFixed(1)}/4</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm">
            {summary.average_proficiency >= 3 && (
              <>
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                <span className="text-green-600">Proficient</span>
              </>
            )}
            {summary.average_proficiency >= 2 && summary.average_proficiency < 3 && (
              <>
                <AlertCircle className="w-4 h-4 mr-1 text-yellow-600" />
                <span className="text-yellow-600">Progressing</span>
              </>
            )}
            {summary.average_proficiency < 2 && (
              <>
                <AlertCircle className="w-4 h-4 mr-1 text-red-600" />
                <span className="text-red-600">Needs Work</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Recent Trend</CardDescription>
          <CardTitle className="text-3xl capitalize">{summary.recent_trend}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm">
            {summary.recent_trend === 'improving' && (
              <>
                <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                <span className="text-green-600">Keep it up!</span>
              </>
            )}
            {summary.recent_trend === 'declining' && (
              <>
                <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                <span className="text-red-600">Talk to instructor</span>
              </>
            )}
            {summary.recent_trend === 'stable' && (
              <>
                <BarChart3 className="w-4 h-4 mr-1 text-blue-600" />
                <span className="text-muted-foreground">Steady progress</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function ManeuversByCategoryDisplay({ studentId }: { studentId: string }) {
  const byCategory = await getManeuversByCategory(studentId)

  if (byCategory.size === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No maneuvers tracked yet</h3>
            <p className="text-muted-foreground">
              Complete your first mission to start tracking progress
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const categories = Array.from(byCategory.entries())

  return (
    <div className="space-y-6">
      {categories.map(([category, maneuvers]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {category}
            </CardTitle>
            <CardDescription>
              {maneuvers.length} maneuver{maneuvers.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maneuvers.map((progress) => {
                const proficiencyPercent = progress.average_score 
                  ? (progress.average_score / 4) * 100 
                  : 0

                const getTrendIcon = (trend: string | null) => {
                  switch (trend) {
                    case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />
                    case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />
                    case 'stable': return <BarChart3 className="w-4 h-4 text-blue-600" />
                    default: return null
                  }
                }

                return (
                  <div key={progress.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{progress.maneuver?.name}</span>
                        {progress.consistently_proficient && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Proficient
                          </Badge>
                        )}
                        {progress.checkride_ready && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Checkride Ready
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(progress.trend)}
                        <Badge variant="outline">
                          {progress.total_attempts} attempt{progress.total_attempts > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Proficiency</span>
                        <span className="font-medium">
                          {progress.average_score?.toFixed(1)}/4
                        </span>
                      </div>
                      <Progress value={proficiencyPercent} className="h-2" />
                    </div>

                    {progress.latest_instructor_notes && (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        💬 {progress.latest_instructor_notes}
                      </div>
                    )}

                    {progress.acs_standard_met === false && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription className="text-xs">
                          Not meeting ACS standards - additional practice needed
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function RecentProgressActivity({ studentId }: { studentId: string }) {
  const recentProgress = await getRecentProgress(studentId, 30)

  if (recentProgress.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          Recent Activity (Last 30 Days)
        </CardTitle>
        <CardDescription>
          Maneuvers you've been practicing recently
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentProgress.slice(0, 5).map((progress) => (
            <div key={progress.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div>
                  <div className="font-medium text-sm">{progress.maneuver?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Last practiced: {progress.last_attempt_date ? 
                      new Date(progress.last_attempt_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                  </div>
                </div>
              </div>
              <Badge variant={
                progress.latest_score && progress.latest_score >= 3 ? 'default' : 'secondary'
              }>
                {progress.latest_score}/4
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function StudentProgressPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Training Progress</h1>
        <p className="text-muted-foreground">
          Track your maneuver proficiency and checkride readiness
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          Your progress is tracked automatically after each debrief. Scores: 1=Unsatisfactory, 2=Progressing, 3=Proficient, 4=Exceptional
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <ProgressSummaryCards studentId={user.id} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Checkride Readiness */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <CheckrideReadinessWidget studentId={user.id} />
          </Suspense>

          {/* Maneuvers by Category */}
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ManeuversByCategoryDisplay studentId={user.id} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <RecentProgressActivity studentId={user.id} />
          </Suspense>

          {/* Progress Chart */}
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <ManeuverProgressChart studentId={user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}











