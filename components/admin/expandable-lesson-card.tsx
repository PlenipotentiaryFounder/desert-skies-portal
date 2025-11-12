"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  MoreVertical,
  Save,
  X,
  Edit,
  Copy,
  Trash2,
  Clock,
  Target,
  CheckCircle2,
  BookOpen,
  FileText,
  Video,
  Plane
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SyllabusLesson } from "@/lib/syllabus-service"
import { ManeuverSelector } from "./maneuver-selector"
import { ResourceManager } from "./resource-manager"

interface ExpandableLessonCardProps {
  lesson: SyllabusLesson & {
    maneuvers?: any[]
    resources?: any[]
    is_active?: boolean
  }
  index: number
  onUpdate: (lessonId: string, updates: Partial<SyllabusLesson>) => Promise<void>
  onDuplicate: (lessonId: string) => Promise<void>
  onDelete: (lessonId: string) => Promise<void>
  dragHandleProps?: any
}

const LESSON_TYPES = [
  { value: "Flight", label: "Flight", icon: Plane },
  { value: "Ground", label: "Ground", icon: BookOpen },
  { value: "Simulator", label: "Simulator", icon: Target },
  { value: "Briefing", label: "Briefing", icon: FileText },
  { value: "Checkride", label: "Checkride", icon: CheckCircle2 },
]

export function ExpandableLessonCard({
  lesson,
  index,
  onUpdate,
  onDuplicate,
  onDelete,
  dragHandleProps
}: ExpandableLessonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLesson, setEditedLesson] = useState(lesson)
  const [isSaving, setIsSaving] = useState(false)
  const [lessonManeuvers, setLessonManeuvers] = useState(lesson.maneuvers || [])
  const [lessonResources, setLessonResources] = useState(lesson.resources || [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(lesson.id, editedLesson)
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save lesson:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedLesson(lesson)
    setIsEditing(false)
  }

  const getLessonTypeInfo = (type: string) => {
    return LESSON_TYPES.find(t => t.value === type) || LESSON_TYPES[0]
  }

  const typeInfo = getLessonTypeInfo(lesson.lesson_type)
  const IconComponent = typeInfo.icon

  return (
    <Card className={cn(
      "transition-all",
      isExpanded && "shadow-lg border-primary/30"
    )}>
      {/* Collapsed View - Drag Handle and Summary */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Lesson Number */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
            {index + 1}
          </div>

          {/* Lesson Info */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={editedLesson.title}
                onChange={(e) => setEditedLesson({ ...editedLesson, title: e.target.value })}
                className="font-semibold"
                placeholder="Lesson title"
              />
            ) : (
              <h3 className="font-semibold text-sm line-clamp-1 text-gray-900 dark:text-gray-100">{lesson.title}</h3>
            )}
            {!isEditing && (
              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1 mt-0.5">{lesson.description || 'No description'}</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <IconComponent className="h-3 w-3" />
              {typeInfo.label}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lesson.estimated_hours}h
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDuplicate(lesson.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(lesson.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Brief Description */}
        {isExpanded && isEditing && (
          <div className="mt-3 space-y-2">
            <Label>Description</Label>
            <Textarea
              value={editedLesson.description}
              onChange={(e) => setEditedLesson({ ...editedLesson, description: e.target.value })}
              placeholder="Lesson description"
              className="min-h-[60px]"
            />
          </div>
        )}
      </CardHeader>

      {/* Expanded View - All Editable Fields */}
      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5 text-xs">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="maneuvers">Maneuvers</TabsTrigger>
              <TabsTrigger value="briefing">Briefing</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Lesson Type</Label>
                  {isEditing ? (
                    <Select
                      value={editedLesson.lesson_type}
                      onValueChange={(value) => setEditedLesson({ ...editedLesson, lesson_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LESSON_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{typeInfo.label}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-gray-100">Estimated Hours</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.1"
                      value={editedLesson.estimated_hours}
                      onChange={(e) => setEditedLesson({ ...editedLesson, estimated_hours: parseFloat(e.target.value) })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{lesson.estimated_hours} hours</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-100">Order Index</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedLesson.order_index}
                    onChange={(e) => setEditedLesson({ ...editedLesson, order_index: parseInt(e.target.value) })}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/30">
                    <span className="text-sm text-gray-900 dark:text-gray-100">Position: {lesson.order_index}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Objectives Tab */}
            <TabsContent value="objectives" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Target className="h-4 w-4 text-blue-600" />
                  Learning Objectives
                </Label>
                {isEditing ? (
                  <Textarea
                    value={editedLesson.objective || ""}
                    onChange={(e) => setEditedLesson({ ...editedLesson, objective: e.target.value })}
                    placeholder="What students should learn in this lesson"
                    className="min-h-[120px]"
                  />
                ) : (
                  <div className="p-3 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {lesson.objective || "No objectives defined yet"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Performance Standards
                </Label>
                {isEditing ? (
                  <Textarea
                    value={editedLesson.performance_standards || ""}
                    onChange={(e) => setEditedLesson({ ...editedLesson, performance_standards: e.target.value })}
                    placeholder="Standards for successful lesson completion (one per line)"
                    className="min-h-[120px]"
                  />
                ) : (
                  <div className="space-y-1">
                    {lesson.performance_standards?.split(/\n+/).filter(Boolean).map((standard, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/30">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-900 dark:text-gray-100">{standard.replace(/^[-•*]\s*/, '')}</span>
                      </div>
                    )) || <p className="text-sm text-gray-700 dark:text-gray-300">No standards defined yet</p>}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Maneuvers Tab */}
            <TabsContent value="maneuvers" className="space-y-4 mt-4">
              <ManeuverSelector
                lessonId={lesson.id}
                selectedManeuvers={lessonManeuvers}
                onManeuversChange={setLessonManeuvers}
                onSave={async () => {
                  await onUpdate(lesson.id, { maneuvers: lessonManeuvers } as any)
                }}
              />
            </TabsContent>

            {/* Briefing Tab */}
            <TabsContent value="briefing" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-100">Pre-Brief Content</Label>
                {isEditing ? (
                  <Textarea
                    value={editedLesson.pre_brief_content || ""}
                    onChange={(e) => setEditedLesson({ ...editedLesson, pre_brief_content: e.target.value })}
                    placeholder="Information to cover before the flight/training session"
                    className="min-h-[120px]"
                  />
                ) : (
                  <div className="p-3 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {lesson.pre_brief_content || "No pre-brief content defined"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-100">Post-Brief Content</Label>
                {isEditing ? (
                  <Textarea
                    value={editedLesson.post_brief_content || ""}
                    onChange={(e) => setEditedLesson({ ...editedLesson, post_brief_content: e.target.value })}
                    placeholder="Key debrief points and areas to review after the session"
                    className="min-h-[120px]"
                  />
                ) : (
                  <div className="p-3 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {lesson.post_brief_content || "No post-brief content defined"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-gray-100">Instructor Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={editedLesson.instructor_notes || ""}
                    onChange={(e) => setEditedLesson({ ...editedLesson, instructor_notes: e.target.value })}
                    placeholder="Special considerations and teaching tips"
                    className="min-h-[100px]"
                  />
                ) : (
                  <div className="p-3 border rounded-md bg-muted/30 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {lesson.instructor_notes || "No instructor notes"}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4 mt-4">
              <ResourceManager
                lessonId={lesson.id}
                resources={lessonResources}
                onResourcesChange={setLessonResources}
                onSave={async () => {
                  await onUpdate(lesson.id, { resources: lessonResources } as any)
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Save Button at Bottom (when editing) */}
          {isEditing && (
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

