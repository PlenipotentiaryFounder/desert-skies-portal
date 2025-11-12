"use client"

import { EnhancedLesson, EnhancedSyllabus } from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface BasicInfoTabProps {
  lesson: EnhancedLesson
  updateLesson: (updates: Partial<EnhancedLesson>) => void
  syllabus: EnhancedSyllabus
}

export function BasicInfoTab({ lesson, updateLesson, syllabus }: BasicInfoTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Details Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Core lesson details and identification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Title *</Label>
              <Input
                id="title"
                value={lesson.title}
                onChange={(e) => updateLesson({ title: e.target.value })}
                placeholder="e.g., Normal Takeoffs and Landings"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-type">Lesson Type *</Label>
              <Select
                value={lesson.lesson_type}
                onValueChange={(value) => updateLesson({ lesson_type: value as any })}
              >
                <SelectTrigger id="lesson-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ground">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      Ground Instruction
                    </div>
                  </SelectItem>
                  <SelectItem value="Flight">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Flight Training
                    </div>
                  </SelectItem>
                  <SelectItem value="Simulator">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      Simulator
                    </div>
                  </SelectItem>
                  <SelectItem value="Solo">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      Solo Flight
                    </div>
                  </SelectItem>
                  <SelectItem value="Checkride">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Checkride
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={lesson.description}
              onChange={(e) => updateLesson({ description: e.target.value })}
              placeholder="Provide a clear description of what this lesson covers..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This appears in lesson lists and student previews
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="order">Order Index</Label>
              <Input
                id="order"
                type="number"
                value={lesson.order_index}
                onChange={(e) => updateLesson({ order_index: parseInt(e.target.value) })}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Position in syllabus sequence
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Estimated Hours *</Label>
              <Input
                id="hours"
                type="number"
                step="0.1"
                value={lesson.estimated_hours}
                onChange={(e) => updateLesson({ estimated_hours: parseFloat(e.target.value) })}
                min={0}
                max={99.9}
              />
              <p className="text-xs text-muted-foreground">
                Flight or ground hours
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proficiency">Min Proficiency Level</Label>
              <Select
                value={lesson.minimum_proficiency_required.toString()}
                onValueChange={(value) => updateLesson({ minimum_proficiency_required: parseInt(value) })}
              >
                <SelectTrigger id="proficiency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Introduction</SelectItem>
                  <SelectItem value="2">2 - Developing</SelectItem>
                  <SelectItem value="3">3 - Proficient</SelectItem>
                  <SelectItem value="4">4 - Mastery</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Required to complete lesson
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Requirements Card */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Requirements</CardTitle>
          <CardDescription>
            Lesson availability and prerequisites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is-active">Active Status</Label>
              <p className="text-xs text-muted-foreground">
                Make lesson available in syllabus
              </p>
            </div>
            <Switch
              id="is-active"
              checked={lesson.is_active}
              onCheckedChange={(checked) => updateLesson({ is_active: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is-required">Required Lesson</Label>
              <p className="text-xs text-muted-foreground">
                Must be completed for syllabus
              </p>
            </div>
            <Switch
              id="is-required"
              checked={lesson.is_required}
              onCheckedChange={(checked) => updateLesson({ is_required: checked })}
            />
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>Prerequisites</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Lessons that must be completed first
            </p>
            {lesson.prerequisite_lesson_ids && lesson.prerequisite_lesson_ids.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {lesson.prerequisite_lesson_ids.map((id) => (
                  <Badge key={id} variant="secondary">
                    Lesson ID: {id.substring(0, 8)}...
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No prerequisites set
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Note: Prerequisite management coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>
            Lesson tracking information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Syllabus:</span>
            <span className="font-medium">{syllabus.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">
              {new Date(lesson.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span className="font-medium">
              {new Date(lesson.updated_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lesson ID:</span>
            <span className="font-mono text-xs">{lesson.id.substring(0, 8)}...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

