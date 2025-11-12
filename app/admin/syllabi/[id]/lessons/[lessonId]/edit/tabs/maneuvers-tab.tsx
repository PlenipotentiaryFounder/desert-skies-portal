"use client"

import { EnhancedLesson } from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plane, Target, CheckCircle2, AlertCircle } from "lucide-react"

interface ManeuversTabProps {
  lesson: EnhancedLesson
  syllabusId: string
}

export function ManeuversTab({ lesson, syllabusId }: ManeuversTabProps) {
  return (
    <div className="space-y-6">
      {/* Current Maneuvers Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-green-600" />
            Lesson Maneuvers
          </CardTitle>
          <CardDescription>
            Maneuvers practiced in this lesson ({lesson.maneuver_count || 0} linked)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lesson.maneuvers && lesson.maneuvers.length > 0 ? (
            <div className="space-y-3">
              {lesson.maneuvers.map((maneuver) => (
                <div 
                  key={maneuver.id}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{maneuver.name}</h4>
                        {maneuver.is_required ? (
                          <Badge variant="default">Required</Badge>
                        ) : (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </div>
                      {maneuver.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {maneuver.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {maneuver.category && (
                          <span>Category: {maneuver.category}</span>
                        )}
                        {maneuver.faa_reference && (
                          <span className="font-mono">{maneuver.faa_reference}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No Maneuvers Linked</p>
              <p className="text-sm mt-1">
                Add maneuvers that students will practice in this lesson
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Maneuvers Card - Placeholder */}
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Maneuver Management</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Full maneuver selection interface coming soon. For now, maneuvers can be 
            managed through the existing lesson builder or via database.
          </p>
          <Button variant="outline" disabled>
            Add Maneuvers
          </Button>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-base">Maneuver Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-900">
          <p>
            <strong>Required vs Optional:</strong> Required maneuvers must be completed at 
            proficiency level before the lesson can be marked complete.
          </p>
          <p>
            <strong>ACS Linkage:</strong> Maneuvers are automatically linked to their 
            corresponding ACS tasks through the maneuver library.
          </p>
          <p>
            <strong>Debrief Integration:</strong> During post-flight debriefs, instructors 
            score each maneuver practiced (1-4 scale).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

