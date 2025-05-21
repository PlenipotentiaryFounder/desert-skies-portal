import { getSyllabusById } from "@/lib/syllabus-service"
import { SyllabusForm } from "../../syllabus-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"

interface EditSyllabusPageProps {
  params: {
    id: string
  }
}

export default async function EditSyllabusPage({ params }: EditSyllabusPageProps) {
  const syllabus = await getSyllabusById(params.id)

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

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Syllabus</h1>
        <SyllabusForm syllabus={syllabus} />
      </div>
    </div>
  )
}
