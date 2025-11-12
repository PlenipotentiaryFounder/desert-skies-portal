import { getManeuverProgressCharts } from "@/lib/maneuver-progress-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react"

interface ManeuverProgressChartProps {
  studentId: string
}

export async function ManeuverProgressChart({ studentId }: ManeuverProgressChartProps) {
  const charts = await getManeuverProgressCharts(studentId)

  // Get top 3 most practiced maneuvers
  const topManeuvers = charts
    .sort((a, b) => b.scores_history.length - a.scores_history.length)
    .slice(0, 3)

  if (topManeuvers.length === 0) {
    return null
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'stable': return <BarChart3 className="w-4 h-4 text-blue-600" />
      default: return null
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600'
      case 'declining': return 'text-red-600'
      case 'stable': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Top Maneuvers
        </CardTitle>
        <CardDescription>
          Your most practiced skills
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topManeuvers.map((maneuver) => {
          const latestScore = maneuver.scores_history.length > 0
            ? maneuver.scores_history[maneuver.scores_history.length - 1].score
            : 0

          return (
            <div key={maneuver.maneuver_id} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{maneuver.maneuver_name}</span>
                  {getTrendIcon(maneuver.trend)}
                </div>
                <Badge variant="outline" className="text-xs">
                  {maneuver.scores_history.length} attempt{maneuver.scores_history.length > 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Simple visual representation of scores */}
              <div className="flex items-center gap-1">
                {maneuver.scores_history.slice(-8).map((score, index) => {
                  const getScoreColor = (s: number) => {
                    if (s >= 4) return 'bg-green-600'
                    if (s >= 3) return 'bg-blue-600'
                    if (s >= 2) return 'bg-yellow-600'
                    return 'bg-red-600'
                  }

                  return (
                    <div
                      key={index}
                      className={`flex-1 h-8 rounded ${getScoreColor(score.score)}`}
                      style={{ height: `${(score.score / 4) * 32}px` }}
                      title={`${score.mission_code}: ${score.score}/4`}
                    />
                  )
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Latest: {latestScore}/4</span>
                <span className={getTrendColor(maneuver.trend)}>
                  {maneuver.trend.charAt(0).toUpperCase() + maneuver.trend.slice(1)}
                </span>
              </div>
            </div>
          )
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Bars show score progression over recent attempts
        </p>
      </CardContent>
    </Card>
  )
}











