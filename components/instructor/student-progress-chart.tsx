"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  BarChart3,
  Calendar,
  Plane,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface StudentProgressChartProps {
  studentData: {
    enrollment: {
      progress_percentage: number
      start_date: string
      target_completion_date?: string
    }
    flightData: {
      totalHours: number
      soloHours: number
      crossCountryHours: number
      nightHours: number
      instrumentHours: number
    }
    acsProgress: Array<{
      area: string
      task: string
      proficiency: number
      status: 'not_started' | 'in_progress' | 'completed'
    }>
    maneuverScores: Array<{
      maneuver: string
      category: string
      latest_score: number
      average_score: number
      meets_standard: boolean
    }>
  }
}

export function StudentProgressChart({ studentData }: StudentProgressChartProps) {
  const { enrollment, flightData, acsProgress, maneuverScores } = studentData

  // Calculate completion stats
  const completedAcsTasks = acsProgress.filter(item => item.status === 'completed').length
  const totalAcsTasks = acsProgress.length
  const acsCompletionRate = totalAcsTasks > 0 ? (completedAcsTasks / totalAcsTasks) * 100 : 0

  const proficientManeuvers = maneuverScores.filter(maneuver => maneuver.meets_standard).length
  const totalManeuvers = maneuverScores.length
  const maneuverProficiencyRate = totalManeuvers > 0 ? (proficientManeuvers / totalManeuvers) * 100 : 0

  // Calculate estimated completion
  const startDate = new Date(enrollment.start_date)
  const targetDate = enrollment.target_completion_date ? new Date(enrollment.target_completion_date) : null
  const currentDate = new Date()
  const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = targetDate ? Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null
  const timeProgress = totalDays ? (daysSinceStart / totalDays) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Overall Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Progress
          </CardTitle>
          <CardDescription>Student's comprehensive training progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Syllabus Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Syllabus Progress</span>
                <span className="text-sm text-muted-foreground">{enrollment.progress_percentage}%</span>
              </div>
              <Progress value={enrollment.progress_percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Started {formatDate(enrollment.start_date)}
              </p>
            </div>

            {/* ACS Standards */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">ACS Standards</span>
                <span className="text-sm text-muted-foreground">{acsCompletionRate.toFixed(0)}%</span>
              </div>
              <Progress value={acsCompletionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {completedAcsTasks} of {totalAcsTasks} tasks completed
              </p>
            </div>

            {/* Maneuver Proficiency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Maneuver Proficiency</span>
                <span className="text-sm text-muted-foreground">{maneuverProficiencyRate.toFixed(0)}%</span>
              </div>
              <Progress value={maneuverProficiencyRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {proficientManeuvers} of {totalManeuvers} maneuvers proficient
              </p>
            </div>

            {/* Time Progress */}
            {targetDate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Time Progress</span>
                  <span className="text-sm text-muted-foreground">{timeProgress.toFixed(0)}%</span>
                </div>
                <Progress value={timeProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Target: {formatDate(enrollment.target_completion_date!)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flight Hours Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Hours Breakdown
          </CardTitle>
          <CardDescription>Detailed flight time accumulation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{flightData.totalHours.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Total Hours</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{flightData.soloHours.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Solo Hours</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{flightData.crossCountryHours.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Cross Country</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{flightData.nightHours.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Night Hours</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{flightData.instrumentHours.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Instrument Hours</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ACS Standards Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            ACS Standards Progress
          </CardTitle>
          <CardDescription>Airman Certification Standards proficiency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {acsProgress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.area}</p>
                    <p className="text-sm text-muted-foreground">{item.task}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      item.status === 'completed' ? 'default' :
                      item.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-sm font-medium">{item.proficiency}/5</div>
                  </div>
                </div>
                <Progress value={(item.proficiency / 5) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maneuver Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Maneuver Performance
          </CardTitle>
          <CardDescription>Latest scores and proficiency levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maneuverScores.map((maneuver, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {maneuver.meets_standard ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : maneuver.latest_score >= 2 ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{maneuver.maneuver}</p>
                    <p className="text-sm text-muted-foreground">{maneuver.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{maneuver.latest_score}/5</div>
                  <div className="text-sm text-muted-foreground">
                    Avg: {maneuver.average_score.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Strengths</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {maneuverScores.filter(m => m.meets_standard).length > 0 && (
                  <li>• {maneuverScores.filter(m => m.meets_standard).length} maneuvers meeting standards</li>
                )}
                {flightData.soloHours > 0 && (
                  <li>• {flightData.soloHours.toFixed(1)} solo hours completed</li>
                )}
                {completedAcsTasks > 0 && (
                  <li>• {completedAcsTasks} ACS tasks completed</li>
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Areas for Improvement</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {maneuverScores.filter(m => !m.meets_standard && m.latest_score < 3).length > 0 && (
                  <li>• {maneuverScores.filter(m => !m.meets_standard && m.latest_score < 3).length} maneuvers need work</li>
                )}
                {acsProgress.filter(a => a.status === 'not_started').length > 0 && (
                  <li>• {acsProgress.filter(a => a.status === 'not_started').length} ACS tasks not started</li>
                )}
                {flightData.nightHours < 3 && (
                  <li>• Night flying requirements pending</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}










