"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, BookOpen, BarChart3, Zap } from "lucide-react"
import { SyllabusForm } from "../../syllabus-form"
import { EnhancedLessonManager } from "@/components/admin/enhanced-lesson-manager"
import { useToast } from "@/hooks/use-toast"
import type { Syllabus, SyllabusLesson } from "@/lib/syllabus-service"

interface LessonWithManeuvers extends SyllabusLesson {
  maneuvers?: Array<{
    id: string
    name: string
    is_required: boolean
    instructor_notes?: string
  }>
  is_active?: boolean
}

interface SyllabusEditClientProps {
  syllabus: Syllabus
  lessons: LessonWithManeuvers[]
  syllabusId: string
}

export function SyllabusEditClient({
  syllabus,
  lessons: initialLessons,
  syllabusId
}: SyllabusEditClientProps) {
  const [activeTab, setActiveTab] = useState("settings")
  const router = useRouter()
  const { toast } = useToast()

  // Lesson management handlers (same as in detail page)
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
      console.log('[CLIENT] Updating lesson:', lessonId, 'with:', updates)
      
      const response = await fetch(`/api/admin/syllabi/${syllabusId}/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[CLIENT] Update failed:', errorData)
        throw new Error(errorData.error || 'Failed to update lesson')
      }

      const result = await response.json()
      console.log('[CLIENT] Update successful:', result)

      toast({
        title: "Lesson updated",
        description: "Lesson has been updated successfully.",
      })

      // Refresh the page data to show updated lesson
      router.refresh()
    } catch (error) {
      console.error('[CLIENT] Update error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update lesson. Please try again.",
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

  const totalFlightHours = initialLessons.reduce((sum, lesson) => 
    sum + (lesson.lesson_type === 'Flight' ? lesson.estimated_hours : 0), 0
  )
  const totalGroundHours = initialLessons.reduce((sum, lesson) => 
    sum + (lesson.lesson_type === 'Ground' ? lesson.estimated_hours : 0), 0
  )

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                <p className="text-2xl font-bold">{initialLessons.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flight Hours</p>
                <p className="text-2xl font-bold text-blue-600">{totalFlightHours}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">F</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ground Hours</p>
                <p className="text-2xl font-bold text-green-600">{totalGroundHours}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">G</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge variant={syllabus.is_active ? "default" : "secondary"}>
                  {syllabus.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Settings className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Edit Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Syllabus Settings
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Lesson Management
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Advanced Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic syllabus information and metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl">
                <SyllabusForm syllabus={syllabus} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Advanced Lesson Management
              </CardTitle>
              <CardDescription>
                Drag to reorder lessons, expand to edit details, and manage lesson structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedLessonManager
                lessons={initialLessons}
                syllabusId={syllabusId}
                onLessonsReorder={handleLessonsReorder}
                onLessonUpdate={handleLessonUpdate}
                onLessonDuplicate={handleLessonDuplicate}
                onLessonDelete={handleLessonDelete}
                onLessonToggleActive={handleLessonToggleActive}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Bulk Operations
                </CardTitle>
                <CardDescription>
                  Perform operations on multiple lessons at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Export Lessons
                    </Button>
                    <Button variant="outline" size="sm">
                      Import Lessons
                    </Button>
                    <Button variant="outline" size="sm">
                      Duplicate Syllabus
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Advanced operations for managing large syllabi and importing/exporting lesson data.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common actions for syllabus management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Activate All Lessons
                    </Button>
                    <Button variant="outline" size="sm">
                      Reset Lesson Order
                    </Button>
                    <Button variant="outline" size="sm">
                      Generate Report
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Quick actions to perform common syllabus management tasks.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Tools</CardTitle>
                <CardDescription>
                  Connect with external systems and tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Sync with LMS
                    </Button>
                    <Button variant="outline" size="sm">
                      Export to PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      Share Syllabus
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Integration tools for connecting with external learning management systems and sharing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 