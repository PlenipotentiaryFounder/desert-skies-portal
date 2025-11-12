"use client"

import { EnhancedLesson } from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Mail, Code2 } from "lucide-react"

interface EmailTemplatesTabProps {
  lesson: EnhancedLesson
  updateLesson: (updates: Partial<EnhancedLesson>) => void
}

export function EmailTemplatesTab({ lesson, updateLesson }: EmailTemplatesTabProps) {
  return (
    <div className="space-y-6">
      {/* Email Template Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Email Template
          </CardTitle>
          <CardDescription>
            Automated email sent to students when this lesson is scheduled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-subject">Email Subject</Label>
            <Input
              id="email-subject"
              value={lesson.email_subject || ""}
              onChange={(e) => updateLesson({ email_subject: e.target.value })}
              placeholder="Lesson Scheduled: {{lesson_title}} - {{date}}"
            />
            <p className="text-xs text-muted-foreground">
              This appears as the email subject line when the lesson is scheduled
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Email Body</Label>
            <Textarea
              id="email-body"
              value={lesson.email_body || ""}
              onChange={(e) => updateLesson({ email_body: e.target.value })}
              placeholder="Hi {{student_name}},

Your lesson has been scheduled for {{date}} at {{time}}.

Lesson: {{lesson_title}}
Instructor: {{instructor_name}}
Aircraft: {{aircraft}}

Please review the following before your lesson:
• {{prep_materials}}

We look forward to flying with you!

Best regards,
Desert Skies Aviation"
              rows={16}
              className="resize-y font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This is the email body sent to students. Use variables for dynamic content.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Variables Reference Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-purple-600" />
            Available Variables
          </CardTitle>
          <CardDescription>
            Use these variables in your email template - they'll be replaced with actual values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Badge variant="outline" className="font-mono">
                  {'{{student_name}}'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Student's full name</p>
              </div>

              <div>
                <Badge variant="outline" className="font-mono">
                  {'{{instructor_name}}'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Instructor's full name</p>
              </div>

              <div>
                <Badge variant="outline" className="font-mono">
                  {'{{lesson_title}}'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Lesson title</p>
              </div>

              <div>
                <Badge variant="outline" className="font-mono">
                  {'{{date}}'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Scheduled date</p>
              </div>

              <div>
                <Badge variant="outline" className="font-mono">
                  {'{{time}}'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Scheduled time</p>
              </div>

              <div>
                <Badge variant="outline" className="font-mono">
                  {'{{aircraft}}'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Aircraft tail number</p>
              </div>

              <div>
                <Badge variant="outline" className="font-mono">
                  {'{{duration}}'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Lesson duration</p>
              </div>

              <div>
                <Badge variant="outline" className="font-mono">
                  {'{{prep_materials}}'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Required study materials</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base">Email Example Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="bg-white border rounded-lg p-4 font-mono text-sm">
            <div className="border-b pb-2 mb-3">
              <p className="text-xs text-muted-foreground">Subject:</p>
              <p className="font-medium">
                {lesson.email_subject || "Lesson Scheduled: {{lesson_title}} - {{date}}"}
              </p>
            </div>
            <div className="whitespace-pre-wrap text-sm">
              {lesson.email_body || "No email body template set"}
            </div>
          </div>
          <p className="text-xs text-blue-800">
            This is how the email will appear to students (with variables replaced)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

