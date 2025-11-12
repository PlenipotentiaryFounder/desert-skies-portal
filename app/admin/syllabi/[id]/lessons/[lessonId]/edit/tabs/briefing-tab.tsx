"use client"

import { EnhancedLesson } from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileEdit, ClipboardList, MessageSquare } from "lucide-react"

interface BriefingTabProps {
  lesson: EnhancedLesson
  updateLesson: (updates: Partial<EnhancedLesson>) => void
}

export function BriefingTab({ lesson, updateLesson }: BriefingTabProps) {
  return (
    <div className="space-y-6">
      {/* Pre-Flight Briefing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Pre-Flight Briefing
          </CardTitle>
          <CardDescription>
            Talking points and preparation for instructors before the lesson
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pre-briefing">Pre-Flight Briefing Content</Label>
            <Textarea
              id="pre-briefing"
              value={lesson.pre_flight_briefing || ""}
              onChange={(e) => updateLesson({ pre_flight_briefing: e.target.value })}
              placeholder="What should be covered before the flight:
• Weather briefing requirements
• Aircraft preflight items to emphasize
• Maneuver setup and procedures
• Common mistakes to watch for
• Safety considerations
• Questions to ask the student"
              rows={12}
              className="resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This appears in the instructor's pre-brief view and can be used for Plan of Action generation
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">💡 Pre-Brief Tips:</p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>Cover safety items and special considerations</li>
              <li>Review ACS standards and tolerances</li>
              <li>Discuss scenario setup and flow</li>
              <li>Set expectations for student performance</li>
              <li>Identify decision points and abort criteria</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Post-Flight Briefing Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Post-Flight Briefing
          </CardTitle>
          <CardDescription>
            Debrief structure and key discussion points after the lesson
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-briefing">Post-Flight Briefing Content</Label>
            <Textarea
              id="post-briefing"
              value={lesson.post_flight_briefing || ""}
              onChange={(e) => updateLesson({ post_flight_briefing: e.target.value })}
              placeholder="What to cover in the debrief:
• Review each maneuver performed
• Discuss what went well (strengths)
• Identify areas for improvement
• Connect performance to ACS standards
• Answer student questions
• Preview next lesson
• Assign study materials"
              rows={12}
              className="resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This guides the instructor during debriefing and helps structure feedback
            </p>
          </div>

          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-900 font-medium mb-2">✓ Debrief Best Practices:</p>
            <ul className="text-sm text-green-800 space-y-1 ml-4 list-disc">
              <li>Start with what the student did well</li>
              <li>Use specific examples from the flight</li>
              <li>Reference ACS standards objectively</li>
              <li>Focus on actionable improvements</li>
              <li>End with clear goals for next time</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Instructor Notes Card (Private - For Instructors Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-orange-600" />
            Instructor Notes (Private)
          </CardTitle>
          <CardDescription>
            Teaching tips, tolerances, grading standards, and common student errors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructor-notes">Instructor-Only Notes</Label>
            <Textarea
              id="instructor-notes"
              value={lesson.instructor_notes || ""}
              onChange={(e) => updateLesson({ instructor_notes: e.target.value })}
              placeholder="Private instructor notes:
• Teaching tips and techniques
• Common student errors to watch for
• Grading standards and tolerances (e.g., Altitude: ±150 feet)
• Safety emphasis items
• Lesson-specific considerations
• Prerequisites and preparation requirements"
              rows={12}
              className="resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              These notes are ONLY visible to instructors - students cannot see this content
            </p>
          </div>

          <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
            <p className="text-sm text-orange-900 font-medium mb-2">🎓 Instructor Guidance:</p>
            <ul className="text-sm text-orange-800 space-y-1 ml-4 list-disc">
              <li>Include specific tolerances and grading criteria</li>
              <li>Document common mistakes and how to correct them</li>
              <li>Note safety emphasis areas for this lesson</li>
              <li>List any prerequisites or special considerations</li>
              <li>Reference ACS proficiency targets and expectations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Student Prep Materials Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-purple-600" />
            Student Preparation Notes
          </CardTitle>
          <CardDescription>
            Additional notes displayed to students when preparing for this lesson
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Student Prep Information</Label>
            <Textarea
              id="notes"
              value={lesson.notes || ""}
              onChange={(e) => updateLesson({ notes: e.target.value })}
              placeholder="Additional information for students:
• Recommended study time: X hours
• Key concepts to review before flight
• Documents to bring
• Items to prepare
• Questions to think about"
              rows={8}
              className="resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              These notes appear in the student's lesson preview page
            </p>
          </div>

          <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
            <p className="text-sm text-purple-900 font-medium mb-2">📚 Student Preparation:</p>
            <p className="text-sm text-purple-800">
              Help students prepare effectively by providing clear guidance on what they should 
              study, practice, or bring to the lesson. Link this with the resources you've added 
              in the Resources tab.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

