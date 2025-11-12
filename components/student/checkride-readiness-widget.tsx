import { getCheckrideReadinessReport } from "@/lib/maneuver-progress-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Trophy,
  CheckCircle,
  AlertCircle,
  Target,
  Info
} from "lucide-react"

interface CheckrideReadinessWidgetProps {
  studentId: string
}

export async function CheckrideReadinessWidget({ studentId }: CheckrideReadinessWidgetProps) {
  const report = await getCheckrideReadinessReport(studentId)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Checkride Readiness
            </CardTitle>
            <CardDescription>
              Assessment of your overall readiness for the practical exam
            </CardDescription>
          </div>
          {report.overall_ready && (
            <Badge variant="default" className="text-base px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-1" />
              Ready!
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Readiness</span>
            <span className="text-2xl font-bold">{report.ready_percentage}%</span>
          </div>
          <Progress value={report.ready_percentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {report.maneuvers_ready.length} of {report.maneuvers_ready.length + report.maneuvers_not_ready.length} maneuvers checkride ready
          </p>
        </div>

        {/* Overall Status Alert */}
        {report.overall_ready ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-sm">
              Congratulations! You're ready for your checkride. Maintain proficiency through regular practice.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Continue working with your instructor to achieve checkride readiness in all areas.
            </AlertDescription>
          </Alert>
        )}

        {/* Ready Maneuvers */}
        {report.maneuvers_ready.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Checkride Ready ({report.maneuvers_ready.length})
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {report.maneuvers_ready.slice(0, 5).map((maneuver, index) => (
                <div key={index} className="flex items-center justify-between p-2 border border-green-200 bg-green-50 dark:bg-green-950/20 rounded">
                  <span className="text-sm">{maneuver.name}</span>
                  <Badge variant="default" className="text-xs">
                    {maneuver.latest_score}/4
                  </Badge>
                </div>
              ))}
            </div>
            {report.maneuvers_ready.length > 5 && (
              <p className="text-xs text-muted-foreground">
                + {report.maneuvers_ready.length - 5} more ready maneuvers
              </p>
            )}
          </div>
        )}

        {/* Not Ready Maneuvers */}
        {report.maneuvers_not_ready.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-600" />
              Needs More Practice ({report.maneuvers_not_ready.length})
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {report.maneuvers_not_ready.slice(0, 5).map((maneuver, index) => (
                <div key={index} className="space-y-1 p-3 border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{maneuver.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {maneuver.attempts} attempt{maneuver.attempts > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {maneuver.recommendation && (
                    <p className="text-xs text-muted-foreground">
                      💡 {maneuver.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {report.maneuvers_not_ready.length > 5 && (
              <p className="text-xs text-muted-foreground">
                + {report.maneuvers_not_ready.length - 5} more maneuvers to practice
              </p>
            )}
          </div>
        )}

        {/* Recommended Focus Areas */}
        {report.recommended_focus_areas.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Recommended Focus Areas
            </h4>
            <ul className="space-y-1">
              {report.recommended_focus_areas.map((area, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}











