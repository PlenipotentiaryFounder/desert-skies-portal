"use client"

import { useState, useTransition } from "react"
import { EnhancedLesson } from "@/lib/enhanced-syllabus-service"
import { reorderLessons, duplicateLesson } from "@/lib/enhanced-syllabus-service"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import {
  GripVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  MoreVertical,
  Plane,
  BookOpen,
  MonitorPlay,
  PlayCircle,
  CheckCircle2,
  FileText,
  Target,
  Clock,
  AlertTriangle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface SyllabusLessonsListProps {
  lessons: EnhancedLesson[]
  syllabusId: string
}

export function SyllabusLessonsList({ lessons, syllabusId }: SyllabusLessonsListProps) {
  const [orderedLessons, setOrderedLessons] = useState(lessons)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newLessons = [...orderedLessons]
    const draggedLesson = newLessons[draggedIndex]
    newLessons.splice(draggedIndex, 1)
    newLessons.splice(index, 0, draggedLesson)

    setOrderedLessons(newLessons)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedIndex(null)

    // Update order indices and save
    const lessonOrders = orderedLessons.map((lesson, index) => ({
      id: lesson.id,
      order_index: index
    }))

    startTransition(async () => {
      const result = await reorderLessons(syllabusId, lessonOrders)
      if (result.success) {
        toast.success("Lesson order updated")
        router.refresh()
      } else {
        toast.error("Failed to update lesson order")
        // Revert to original order
        setOrderedLessons(lessons)
      }
    })
  }

  const handleDuplicateLesson = async (lessonId: string) => {
    startTransition(async () => {
      const result = await duplicateLesson(lessonId)
      if (result.success) {
        toast.success("Lesson duplicated successfully")
        router.refresh()
      } else {
        toast.error("Failed to duplicate lesson")
      }
    })
  }

  return (
    <div className="space-y-3">
      {orderedLessons.map((lesson, index) => (
        <div
          key={lesson.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            group relative border rounded-lg transition-all duration-200
            ${isDragging && draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
            ${isDragging ? 'cursor-move' : 'cursor-default'}
            hover:shadow-md hover:border-primary/50
          `}
        >
          <div className="flex items-center gap-4 p-4">
            {/* Drag Handle */}
            <div className="flex items-center gap-2">
              <GripVertical 
                className="h-5 w-5 text-muted-foreground group-hover:text-primary cursor-move" 
              />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {index + 1}
              </div>
            </div>

            {/* Lesson Type Icon */}
            <div className="flex-shrink-0">
              {getLessonTypeIcon(lesson.lesson_type)}
            </div>

            {/* Lesson Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link 
                  href={`/admin/syllabi/${syllabusId}/lessons/${lesson.id}`}
                  className="font-medium hover:text-primary transition-colors truncate"
                >
                  {lesson.title}
                </Link>
                <Badge variant="outline" className={getLessonTypeBadgeColor(lesson.lesson_type)}>
                  {lesson.lesson_type}
                </Badge>
                {!lesson.is_required && (
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {lesson.description}
              </p>

              {/* Meta Info */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lesson.estimated_hours}h
                </div>
                {lesson.maneuver_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {lesson.maneuver_count} maneuvers
                  </div>
                )}
                {lesson.acs_task_count > 0 && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {lesson.acs_task_count} ACS tasks
                  </div>
                )}
                {lesson.resource_count > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {lesson.resource_count} resources
                  </div>
                )}
                {lesson.prerequisite_lesson_ids && lesson.prerequisite_lesson_ids.length > 0 && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    Prerequisites
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/syllabi/${syllabusId}/lessons/${lesson.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/syllabi/${syllabusId}/lessons/${lesson.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/syllabi/${syllabusId}/lessons/${lesson.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/syllabi/${syllabusId}/lessons/${lesson.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Lesson
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDuplicateLesson(lesson.id)}
                    disabled={isPending}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    disabled
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function getLessonTypeIcon(type: string) {
  const iconClass = "h-8 w-8 p-1.5 rounded-full"
  switch (type) {
    case 'Ground':
      return (
        <div className={`${iconClass} bg-blue-100 text-blue-600`}>
          <BookOpen className="h-full w-full" />
        </div>
      )
    case 'Flight':
      return (
        <div className={`${iconClass} bg-green-100 text-green-600`}>
          <Plane className="h-full w-full" />
        </div>
      )
    case 'Simulator':
      return (
        <div className={`${iconClass} bg-purple-100 text-purple-600`}>
          <MonitorPlay className="h-full w-full" />
        </div>
      )
    case 'Solo':
      return (
        <div className={`${iconClass} bg-orange-100 text-orange-600`}>
          <PlayCircle className="h-full w-full" />
        </div>
      )
    case 'Checkride':
      return (
        <div className={`${iconClass} bg-red-100 text-red-600`}>
          <CheckCircle2 className="h-full w-full" />
        </div>
      )
    default:
      return (
        <div className={`${iconClass} bg-gray-100 text-gray-600`}>
          <FileText className="h-full w-full" />
        </div>
      )
  }
}

function getLessonTypeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    'Ground': 'border-blue-500 text-blue-700 bg-blue-50',
    'Flight': 'border-green-500 text-green-700 bg-green-50',
    'Simulator': 'border-purple-500 text-purple-700 bg-purple-50',
    'Solo': 'border-orange-500 text-orange-700 bg-orange-50',
    'Checkride': 'border-red-500 text-red-700 bg-red-50'
  }
  return colors[type] || 'border-gray-500 text-gray-700 bg-gray-50'
}

