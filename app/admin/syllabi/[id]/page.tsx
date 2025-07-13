import { getSyllabusById, getSyllabusLessons, getSyllabusStatistics } from "@/lib/syllabus-service"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, PlusCircle, Settings } from "lucide-react"
import { notFound } from "next/navigation"
import { SyllabusDetailClient } from "./syllabus-detail-client"

interface SyllabusDetailPageProps {
  params: {
    id: string
  }
}

export default async function SyllabusDetailPage({ params }: SyllabusDetailPageProps) {
  const { id } = await params
  const [syllabus, lessons, statistics] = await Promise.all([
    getSyllabusById(id),
    getSyllabusLessons(id),
    getSyllabusStatistics(id)
  ])

  if (!syllabus) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/syllabi">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Syllabi
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/admin/syllabi/${id}/lessons/new`}>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Lesson
            </Button>
          </Link>
          <Link href={`/admin/syllabi/${id}/edit`}>
            <Button size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Syllabus Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Enhanced Dashboard and Lesson Management */}
      <SyllabusDetailClient
        syllabus={syllabus}
        lessons={lessons}
        statistics={statistics}
        syllabusId={id}
      />
    </div>
  )
}
