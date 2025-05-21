import { getSyllabusById, getSyllabusLessonById } from "@/lib/syllabus-service"
import { LessonForm } from "../../lesson-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"

interface EditLessonPageProps {
  params: {
    id: string
    lessonId: string
  }
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const syllabus = await getSyllabusById(params.id)
  const lesson = await getSyllabusLessonById(params.lessonId)

  if (!syllabus || !lesson) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href={`/admin/syllabi/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Syllabus
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Edit Lesson</h1>
        <p className="text-gray-500 mb-6">
          Editing lesson in: <span className="font-medium">{syllabus.title}</span>
        </p>
        <LessonForm syllabusId={params.id} lesson={lesson} />
      </div>
    </div>
  )
}
