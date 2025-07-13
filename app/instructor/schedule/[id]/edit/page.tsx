// Edit Mission Page
// 1. Load current session and lesson brief data
// 2. Allow editing all fields and maneuvers
// 3. On submit, update DB 

import { notFound, redirect } from "next/navigation"
import { getFlightSessionById } from "@/lib/flight-session-service"
import { getInstructorEnrollments } from "@/lib/enrollment-service"
import { getSyllabusLessons } from "@/lib/syllabus-service"
import { getManeuvers } from "@/lib/maneuver-service"
import { MissionForm } from "@/components/instructor/mission-form"
import { updateFlightSession } from "@/lib/flight-session-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const metadata = {
  title: "Edit Mission | Desert Skies",
  description: "Edit a scheduled mission (flight session)",
}

export default async function EditMissionPage({ params }: { params: { id: string } }) {
  const session = await getFlightSessionById(params.id)
  if (!session) notFound()

  // Fetch all enrollments for this instructor (could be filtered by instructor_id)
  const enrollments = await getInstructorEnrollments(session.instructor_id)
  // Fetch all lessons for the relevant syllabi
  const allLessons = (await Promise.all(enrollments.map((e) => getSyllabusLessons(e.syllabus_id)))).flat()
  const maneuvers = await getManeuvers()

  // Handler for updating a mission (calls server action)
  async function handleUpdateMission(form: any) {
    "use server"
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    try {
      // Update the flight session
      const result = await updateFlightSession(params.id, {
        aircraft_id: form.aircraftId,
        date: form.date,
        start_time: form.startTime,
        end_time: form.endTime,
        notes: form.notes,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to update mission")
      }

      // Redirect to the schedule page on success
      redirect("/instructor/schedule")
    } catch (error) {
      console.error("Error updating mission:", error)
      throw error
    }
  }

  // Prefill MissionForm with session data
  const initialValues = {
    enrollmentId: session.enrollment_id,
    mode: session.lesson_id ? "precreated" : "custom",
    lessonId: session.lesson_id || "",
    custom: {
      title: session.lesson?.title || "",
      objective: session.lesson?.description || "",
      // Add other fields as needed from lesson/session/brief
      maneuvers: (session.maneuver_scores || []).map((ms: any) => ms.maneuver_id),
    },
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Edit Mission</h1>
      <MissionForm
        enrollments={enrollments}
        lessons={allLessons}
        maneuvers={maneuvers}
        onSubmit={handleUpdateMission}
        initialValues={initialValues}
      />
    </div>
  )
} 