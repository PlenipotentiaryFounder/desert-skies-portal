import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getInstructorEnrollments } from "@/lib/enrollment-service"
import StudentManagementSystem from "./StudentManagementSystem"

export default async function StudentManagementSystemWrapper() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get enrollments for the current instructor
  const enrollments = await getInstructorEnrollments(user.id)

  // Transform enrollments to the format expected by StudentManagementSystem
  const students = enrollments.map((enrollment) => ({
    id: enrollment.student_id,
    first_name: enrollment.student?.first_name || '',
    last_name: enrollment.student?.last_name || '',
    email: enrollment.student?.email || '',
    phone_number: '',
    date_of_birth: '',
    status: enrollment.status,
    profile_image: enrollment.student?.avatar_url,
    enrollments: [{
      id: enrollment.id,
      syllabus_name: enrollment.syllabus?.name || 'Unknown Syllabus',
      start_date: enrollment.start_date,
      status: enrollment.status,
      progress: { completed: 0, total: 100 }
    }],
    recentSessions: [],
    nextSession: undefined,
    maneuverScores: [],
    acsProgress: [],
    totalFlightHours: 0,
    soloHours: 0,
    crossCountryHours: 0,
    nightHours: 0,
    instructorNotes: []
  }))

  return <StudentManagementSystem students={students} isLoading={false} />
} 