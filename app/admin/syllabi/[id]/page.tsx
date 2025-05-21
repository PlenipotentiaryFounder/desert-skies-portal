import { getSyllabusById, getSyllabusLessons } from "@/lib/syllabus-service"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, Pencil, PlusCircle, BookOpen } from "lucide-react"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { LessonList } from "./lesson-list"

interface SyllabusDetailPageProps {
  params: {
    id: string
  }
}

export default async function SyllabusDetailPage({ params }: SyllabusDetailPageProps) {
  const syllabus = await getSyllabusById(params.id)

  if (!syllabus) {
    notFound()
  }

  const lessons = await getSyllabusLessons(params.id)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/admin/syllabi">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Syllabi
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{syllabus.title}</h1>
            <div className="flex items-center mt-2 text-gray-500 text-sm">
              <span className="mr-4">Version: {syllabus.version}</span>
              <span className="mr-4">FAA Type: {syllabus.faa_type}</span>
              <span>Created: {formatDate(syllabus.created_at)}</span>
            </div>
          </div>
          <Link href={`/admin/syllabi/${params.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Syllabus
            </Button>
          </Link>
        </div>

        <div className="mb-4">
          <Badge variant={syllabus.is_active ? "default" : "outline"} className="mb-4">
            {syllabus.is_active ? "Active" : "Inactive"}
          </Badge>
          <p className="text-gray-700">{syllabus.description}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Lessons
          </h2>
          <Link href={`/admin/syllabi/${params.id}/lessons/new`}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Lesson
            </Button>
          </Link>
        </div>

        <LessonList lessons={lessons} syllabusId={params.id} />
      </div>
    </div>
  )
}
