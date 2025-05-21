import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getStudents } from "@/lib/user-service"
import { getInstructors } from "@/lib/user-service"
import { getSyllabi } from "@/lib/syllabus-service"
import { Button } from "@/components/ui/button"
import { EnrollmentForm } from "../enrollment-form"

export default async function NewEnrollmentPage() {
  const students = await getStudents()
  const instructors = await getInstructors()
  const syllabi = await getSyllabi()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/admin/enrollments">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Enrollments
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Enrollment</h1>
        <EnrollmentForm students={students} instructors={instructors} syllabi={syllabi} />
      </div>
    </div>
  )
}
