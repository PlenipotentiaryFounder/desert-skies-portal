"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  TrendingUp, TrendingDown, Minus, Target, Calendar, 
  User, CheckCircle2, XCircle, AlertTriangle 
} from "lucide-react"
import { format } from "date-fns"

interface ManeuverHistoryNote {
  id: string
  scored_at: string
  instructor_notes: string | null
  performance_level: 'unsatisfactory' | 'progressing' | 'proficient' | 'exceptional'
  numeric_score: number
  areas_of_strength: string[] | null
  areas_for_improvement: string[] | null
  specific_observations: any
  acs_standard_met: boolean | null
  student_attempt_number: number | null
  mission: {
    id: string
    mission_code: string
    scheduled_date: string
  } | null
  instructor: {
    id: string
    first_name: string
    last_name: string
  } | null
}

interface ManeuverHistoryTimelineProps {
  notes: ManeuverHistoryNote[]
  maneuverName: string
}

export function ManeuverHistoryTimeline({ notes, maneuverName }: ManeuverHistoryTimelineProps) {
  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
          <p className="text-muted-foreground text-sm">
            This student hasn't been scored on {maneuverName} yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate trend
  const getTrendIcon = () => {
    if (notes.length < 2) return <Minus className="h-4 w-4" />
    const recent = notes[0].numeric_score
    const previous = notes[1].numeric_score
    if (recent > previous) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (recent < previous) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'exceptional':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
      case 'proficient':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
      case 'progressing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
      case 'unsatisfactory':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getScoreIcon = (score: number) => {
    if (score >= 3) return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (score >= 2) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {maneuverName} - Performance History
          </CardTitle>
          <CardDescription>
            {notes.length} attempt{notes.length !== 1 ? 's' : ''} logged
            {notes.length >= 2 && (
              <span className="ml-2 inline-flex items-center gap-1">
                • Trend: {getTrendIcon()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Latest Score</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{notes[0].numeric_score}</span>
                <span className="text-sm text-muted-foreground">/4</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Average</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {(notes.reduce((sum, n) => sum + n.numeric_score, 0) / notes.length).toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">/4</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Best Score</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {Math.max(...notes.map(n => n.numeric_score))}
                </span>
                <span className="text-sm text-muted-foreground">/4</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">ACS Met</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {notes.filter(n => n.acs_standard_met).length}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{notes.length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        {notes.map((note, index) => (
          <Card key={note.id} className={index === 0 ? 'border-2 border-primary/30' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">
                      {format(new Date(note.scored_at), 'MMMM d, yyyy')}
                    </span>
                    {note.mission && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {note.mission.mission_code}
                      </Badge>
                    )}
                    {index === 0 && (
                      <Badge variant="default" className="text-xs">Latest</Badge>
                    )}
                  </div>
                  {note.instructor && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>
                        {note.instructor.first_name} {note.instructor.last_name}
                      </span>
                      {note.student_attempt_number && (
                        <span className="ml-2">• Attempt #{note.student_attempt_number}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Score Badge */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    {getScoreIcon(note.numeric_score)}
                    <span className="text-2xl font-bold">{note.numeric_score}/4</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs capitalize ${getPerformanceColor(note.performance_level)}`}
                  >
                    {note.performance_level}
                  </Badge>
                  {note.acs_standard_met !== null && (
                    <Badge 
                      variant={note.acs_standard_met ? "default" : "destructive"}
                      className="text-xs"
                    >
                      ACS {note.acs_standard_met ? '✓' : '✗'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {/* Instructor Notes */}
              {note.instructor_notes && (
                <div>
                  <p className="text-xs font-semibold mb-1.5">Instructor Notes:</p>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                    {note.instructor_notes}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {note.areas_of_strength && note.areas_of_strength.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1.5 text-green-600">Strengths:</p>
                  <ul className="space-y-1">
                    {note.areas_of_strength.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-muted-foreground">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {note.areas_for_improvement && note.areas_for_improvement.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-1.5 text-orange-600">Areas for Improvement:</p>
                  <ul className="space-y-1">
                    {note.areas_for_improvement.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-orange-600 flex-shrink-0" />
                        <span className="text-muted-foreground">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show separator if not last item */}
              {index < notes.length - 1 && <Separator className="mt-4" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

