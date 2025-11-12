"use client"

import { EnhancedLesson } from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Target, CheckCircle2, TrendingUp } from "lucide-react"

interface ObjectivesTabProps {
  lesson: EnhancedLesson
  updateLesson: (updates: Partial<EnhancedLesson>) => void
}

export function ObjectivesTab({ lesson, updateLesson }: ObjectivesTabProps) {
  return (
    <div className="space-y-6">
      {/* Learning Objective Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Learning Objective
          </CardTitle>
          <CardDescription>
            What should students learn and be able to do after this lesson?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="objective">Main Objective</Label>
            <Textarea
              id="objective"
              value={lesson.objective || ""}
              onChange={(e) => updateLesson({ objective: e.target.value })}
              placeholder="Example: The student will demonstrate the ability to perform normal takeoffs and landings while maintaining directional control and staying within the ACS standards for altitude, airspeed, and centerline alignment."
              rows={5}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              Write a clear, measurable objective that describes what the student will achieve
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">💡 Tips for writing objectives:</p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>Use action verbs: demonstrate, perform, identify, explain</li>
              <li>Be specific and measurable</li>
              <li>Focus on what the student will do, not what you'll teach</li>
              <li>Reference ACS standards when applicable</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Performance Standards Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Performance Standards
          </CardTitle>
          <CardDescription>
            How will you measure success? What are the criteria?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="standards">Performance Criteria</Label>
            <Textarea
              id="standards"
              value={lesson.performance_standards || ""}
              onChange={(e) => updateLesson({ performance_standards: e.target.value })}
              placeholder="Example:
• Maintain heading ±10° during pattern legs
• Maintain altitude ±100 feet on downwind
• Touch down within first 400 feet of runway
• Maintain centerline ±10 feet throughout
• Use proper radio communications at all times"
              rows={8}
              className="resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              List specific, measurable criteria that define proficiency. Use bullet points for clarity.
            </p>
          </div>

          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-900 font-medium mb-2">✓ ACS Alignment:</p>
            <p className="text-sm text-green-800">
              Performance standards should align with ACS tolerances. For example, Private Pilot 
              standards are typically more lenient than Commercial Pilot standards. Reference the 
              specific ACS tasks linked to this lesson.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Completion Standards Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
            Completion Standards
          </CardTitle>
          <CardDescription>
            What defines lesson completion? When can students move forward?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Completion Criteria</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Define what needs to be achieved for this lesson to be marked complete
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Maneuver Proficiency</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All required maneuvers scored at proficiency level {lesson.minimum_proficiency_required} or higher
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">ACS Standards Met</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Student performs within ACS tolerances for linked tasks
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Instructor Sign-off</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Instructor endorses lesson completion in debrief
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
            <p className="text-sm text-purple-900 font-medium mb-2">📊 Progress Tracking:</p>
            <p className="text-sm text-purple-800">
              Lesson completion is automatically tracked based on flight session debriefs. When all 
              completion criteria are met, the lesson status changes to "Completed" and the next 
              lesson becomes available.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

