import { SyllabusForm } from "../syllabus-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NewSyllabusPage() {
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

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Syllabus</h1>
        <SyllabusForm />
      </div>
    </div>
  )
}
