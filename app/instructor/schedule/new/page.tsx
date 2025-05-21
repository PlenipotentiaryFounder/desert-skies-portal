import { getInstructorEnrollments } from "@/lib/enrollment-service"
import { getSyllabusLessons } from "@/lib/syllabus-service"
import { getManeuvers } from "@/lib/maneuver-service"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { MissionFormClient } from "@/components/instructor/mission-form-client"

export const metadata = {
  title: "Schedule New Mission | Desert Skies",
  description: "Schedule a new mission (flight session) for a student",
}

export default async function ScheduleNewMissionPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return <div>You must be logged in as an instructor.</div>

  // Fetch all enrollments for this instructor
  const enrollments = await getInstructorEnrollments(session.user.id)
  // For simplicity, fetch all lessons and maneuvers (could be filtered by selected enrollment/syllabus in a client component)
  const allLessonsRaw = (await Promise.all(enrollments.map((e) => getSyllabusLessons(e.syllabus_id)))).flat()
  const allLessons = Array.from(new Map(allLessonsRaw.map(l => [l.id, l])).values())
  const maneuvers = await getManeuvers()

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Schedule New Mission</h1>
      <MissionFormClient
        enrollments={enrollments}
        lessons={allLessons}
        maneuvers={maneuvers}
      />
    </div>
  )
}

// Server action to schedule a new mission
export async function scheduleMissionServerAction({ enrollmentId, lessonId, isCustom, customFields, maneuvers }: { enrollmentId: string, lessonId?: string, isCustom: boolean, customFields?: any, maneuvers?: string[] }) {
  // 1. If pre-created lesson, use lessonId; if custom, use customFields and maneuvers
  // 2. Create flight_session and lesson_brief as needed
  // TODO: Implement full logic
  return { success: true }
} 