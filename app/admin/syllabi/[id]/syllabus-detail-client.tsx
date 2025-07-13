"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import { SyllabusDashboard } from "@/components/admin/syllabus-dashboard"
import { EnhancedLessonManager } from "@/components/admin/enhanced-lesson-manager"
import { useToast } from "@/hooks/use-toast"
import type { Syllabus, SyllabusLesson, SyllabusStatistics } from "@/lib/syllabus-service"

interface LessonWithManeuvers extends SyllabusLesson {
  maneuvers?: Array<{
    id: string
    name: string
    is_required: boolean
    instructor_notes?: string
  }>
  is_active?: boolean
}

interface SyllabusDetailClientProps {
  syllabus: Syllabus
  lessons: LessonWithManeuvers[]
  statistics: SyllabusStatistics
  syllabusId: string
}

export function SyllabusDetailClient({
  syllabus,
  lessons: initialLessons,
  statistics,
  syllabusId
}: SyllabusDetailClientProps) {
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false)
  const { toast } = useToast()

  // Client-side handlers that call server actions
  const handleLessonsReorder = async (updatedLessons: LessonWithManeuvers[]) => {
    try {
      const lessonUpdates = updatedLessons.map(lesson => ({
        id: lesson.id,
        order_index: lesson.order_index
      }))

      const response = await fetch(`/api/admin/syllabi/${syllabusId}/lessons/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonUpdates })
      })

      if (!response.ok) {
        throw new Error('Failed to reorder lessons')
      }

      toast({
        title: "Lessons reordered",
        description: "Lesson order has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder lessons. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleLessonUpdate = async (lessonId: string, updates: Partial<LessonWithManeuvers>) => {
    try {
      const response = await fetch(`/api/admin/syllabi/${syllabusId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update lesson')
      }

      toast({
        title: "Lesson updated",
        description: "Lesson has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lesson. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleLessonDuplicate = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/admin/syllabi/${syllabusId}/lessons/${lessonId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate lesson')
      }

      toast({
        title: "Lesson duplicated",
        description: "Lesson has been duplicated successfully.",
      })

      // Refresh the page to show the new lesson
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate lesson. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleLessonDelete = async (lessonId: string) => {
    try {
      const response = await fetch(`/api/admin/syllabi/${syllabusId}/lessons/${lessonId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete lesson')
      }

      toast({
        title: "Lesson deleted",
        description: "Lesson has been deleted successfully.",
      })

      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete lesson. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const handleLessonToggleActive = async (lessonId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/syllabi/${syllabusId}/lessons/${lessonId}/toggle-active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle lesson active status')
      }

      toast({
        title: isActive ? "Lesson activated" : "Lesson deactivated",
        description: `Lesson has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      })

      // Refresh the page to update the status
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lesson status. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <>
      {/* Enhanced Dashboard */}
      <SyllabusDashboard
        statistics={statistics}
        syllabusTitle={syllabus.title}
        faaType={syllabus.faa_type}
        isExpanded={isDashboardExpanded}
        onToggleExpanded={() => setIsDashboardExpanded(!isDashboardExpanded)}
      />

      {/* Enhanced Lesson Management */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold">Lesson Management</h2>
                <p className="text-gray-600">Drag to reorder, click to expand, and manage lesson details</p>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              {initialLessons.length} Lessons
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <EnhancedLessonManager
            lessons={initialLessons}
            syllabusId={syllabusId}
            onLessonsReorder={handleLessonsReorder}
            onLessonUpdate={handleLessonUpdate}
            onLessonDuplicate={handleLessonDuplicate}
            onLessonDelete={handleLessonDelete}
            onLessonToggleActive={handleLessonToggleActive}
          />
        </div>
      </div>
    </>
  )
} 