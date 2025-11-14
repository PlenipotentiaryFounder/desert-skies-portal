"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, User, Users } from "lucide-react"
import { calculateMissionTimeBlocks, formatDuration } from "@/lib/mission-time-blocks"

interface TimeBlocksDisplayProps {
  missionType: 'F' | 'G' | 'S'
  startTime: string
  trainingDurationMinutes?: number
  className?: string
}

export function TimeBlocksDisplay({
  missionType,
  startTime,
  trainingDurationMinutes = 120, // Default 2 hours
  className
}: TimeBlocksDisplayProps) {
  const result = calculateMissionTimeBlocks(missionType, startTime, trainingDurationMinutes)
  
  const missionTypeLabels = {
    F: 'Flight',
    G: 'Ground',
    S: 'Simulator'
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Mission Timeline</CardTitle>
        <CardDescription className="text-sm">
          Complete schedule breakdown for this {missionTypeLabels[missionType]} mission
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time blocks list */}
        <div className="space-y-3">
          {result.blocks.map((block, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="text-2xl mt-0.5">{block.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{block.label}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3" />
                  {block.startTime} - {block.endTime}
                  <Badge variant="outline" className="ml-2">
                    {formatDuration(block.durationMinutes)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {block.participants.includes('student') && block.participants.includes('instructor') ? (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      Student + Instructor
                    </Badge>
                  ) : block.participants.includes('student') ? (
                    <Badge variant="secondary" className="text-xs">
                      <User className="h-3 w-3 mr-1" />
                      Student Only
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="pt-3 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground font-medium">Total Student Time</div>
              <div className="text-lg font-bold mt-1">
                {formatDuration(result.totalStudentTime)}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground font-medium">Instructor Time</div>
              <div className="text-lg font-bold mt-1">
                {formatDuration(result.totalInstructorTime)}
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground font-medium">End Time</div>
              <div className="text-lg font-bold mt-1">
                {result.endTime}
              </div>
            </div>
          </div>
        </div>
        
        {/* Info alert for flight missions */}
        {missionType === 'F' && (
          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              <strong>Note:</strong> The student conducts pre-flight inspection alone (30 min). 
              Instructor time starts at {result.instructorStartTime}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

