import { getInstructorEnrollments } from "@/lib/enrollment-service"
import { getSyllabusLessons } from "@/lib/syllabus-service"
import { getManeuvers } from "@/lib/maneuver-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { EnhancedMissionFormClient } from "@/components/instructor/enhanced-mission-form-client"

export const metadata = {
  title: "Create New Mission | Desert Skies",
  description: "Create a new training mission with integrated workflow",
}

export default async function NewMissionPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>
}) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div>You must be logged in as an instructor.</div>
  }

  const params = await searchParams
  const studentId = params.studentId

  // Fetch data for the form
  const enrollments = await getInstructorEnrollments(user.id)
  
  // Fetch all lessons from all syllabi
  const allLessonsRaw = (
    await Promise.all(
      enrollments.map((e) => getSyllabusLessons(e.syllabus_id))
    )
  ).flat()
  
  // Deduplicate lessons by ID
  const allLessons = Array.from(
    new Map(allLessonsRaw.map(l => [l.id, l])).values()
  )
  
  const maneuvers = await getManeuvers()

  // Find the enrollment for the student if studentId is provided
  const initialEnrollment = studentId 
    ? enrollments.find(e => e.student_id === studentId)
    : undefined

  const initialValues = initialEnrollment
    ? {
        enrollmentId: initialEnrollment.id,
        studentId: initialEnrollment.student_id,
      }
    : undefined

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Mission</h1>
        <p className="text-muted-foreground">
          Set up a comprehensive training mission with automatic Plan of Action generation
        </p>
      </div>

      <EnhancedMissionFormClient
        enrollments={enrollments}
        lessons={allLessons}
        initialValues={initialValues}
        maneuvers={maneuvers}
      />
    </div>
  )
}

