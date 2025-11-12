import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getEnhancedLessonById, getEnhancedSyllabusById } from "@/lib/enhanced-syllabus-service"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { LessonEditorTabs } from "./lesson-editor-tabs"

export async function generateMetadata({ params }: { params: { id: string; lessonId: string } }) {
  const lesson = await getEnhancedLessonById(params.lessonId)
  
  return {
    title: lesson ? `Edit ${lesson.title} | Admin` : 'Edit Lesson | Admin',
    description: 'Edit training lesson details, maneuvers, and standards'
  }
}

export default async function LessonEditPage({ 
  params 
}: { 
  params: { id: string; lessonId: string } 
}) {
  const [lesson, syllabus] = await Promise.all([
    getEnhancedLessonById(params.lessonId),
    getEnhancedSyllabusById(params.id)
  ])
  
  if (!lesson || !syllabus) {
    notFound()
  }

  // Verify lesson belongs to this syllabus
  if (lesson.syllabus_id !== params.id) {
    redirect(`/admin/syllabi/${lesson.syllabus_id}/lessons/${params.lessonId}/edit`)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/syllabi/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">Edit Lesson</h1>
            </div>
            <p className="text-muted-foreground">
              {syllabus.name} • Lesson {lesson.order_index + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <Suspense fallback={<EditorLoadingSkeleton />}>
        <LessonEditorTabs 
          lesson={lesson} 
          syllabusId={params.id}
          syllabus={syllabus}
        />
      </Suspense>
    </div>
  )
}

function EditorLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border-b">
        <div className="flex gap-4 mb-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
