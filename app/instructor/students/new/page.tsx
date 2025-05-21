// New Student Enrollment Page
// 1. Multi-step form: email, name, syllabus, etc.
// 2. On submit, call server action to create user, profile, enrollment, and send email
// 3. Show progress and errors 

import { getSyllabi } from "@/lib/syllabus-service"
import { createUser } from "@/lib/user-service"
import { createEnrollment } from "@/lib/enrollment-service"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Enroll New Student | Desert Skies",
  description: "Enroll a new student in a training program",
}

export default async function EnrollNewStudentPage() {
  const syllabi = await getSyllabi()
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return <div>You must be logged in as an instructor.</div>

  // Render a multi-step form (pseudo-code, you can replace with your UI framework)
  // 1. Student Info (email, first/last name)
  // 2. Select Syllabus
  // 3. Confirm & Enroll
  // On submit, call enrollStudentServerAction

  // Placeholder UI:
  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Enroll New Student</h1>
      {/* TODO: Replace with real multi-step form UI */}
      <p>Multi-step form coming soon. Steps:</p>
      <ol className="list-decimal ml-6 mb-4">
        <li>Enter student info (email, name)</li>
        <li>Select syllabus</li>
        <li>Confirm and enroll</li>
      </ol>
      <p>On submit, this will create the Auth user, profile, enrollment, and send a login email.</p>
    </div>
  )
}

// Server action to enroll a new student
export async function enrollStudentServerAction({ email, firstName, lastName, syllabusId, instructorId }: { email: string, firstName: string, lastName: string, syllabusId: string, instructorId: string }) {
  // 1. Create Auth user
  const password = Math.random().toString(36).slice(-8) + "!Aa1"
  const userResult = await createUser({
    email,
    first_name: firstName,
    last_name: lastName,
    role: "student",
    status: "active",
    password,
  })
  if (!userResult.success || !userResult.userId) {
    return { success: false, error: userResult.error || "Failed to create user" }
  }
  // 2. Create enrollment
  const enrollmentResult = await createEnrollment({
    student_id: userResult.userId, // Use the returned user id
    syllabus_id: syllabusId,
    instructor_id: instructorId,
    start_date: new Date().toISOString().split("T")[0],
    status: "active",
  })
  if (!enrollmentResult.success) {
    return { success: false, error: enrollmentResult.error || "Failed to create enrollment" }
  }
  // 3. Send login email (Supabase magic link)
  // TODO: Implement email sending (magic link or invite)
  return { success: true }
} 