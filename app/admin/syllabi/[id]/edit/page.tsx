import { getSyllabusById, getSyllabusLessons } from "@/lib/syllabus-service"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"
import { SyllabusEditClient } from "./syllabus-edit-client"

interface EditSyllabusPageProps {
  params: {
    id: string
  }
}

export default async function EditSyllabusPage({ params }: EditSyllabusPageProps) {
  const [syllabus, lessons] = await Promise.all([
    getSyllabusById(params.id),
    getSyllabusLessons(params.id)
  ])

  if (!syllabus) {
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

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Syllabus</h1>
          <p className="text-gray-600">
            Configure syllabus settings and manage lesson structure
          </p>
        </div>

        <SyllabusEditClient
          syllabus={syllabus}
          lessons={lessons}
          syllabusId={params.id}
        />
      </div>
    </div>
  )
}
