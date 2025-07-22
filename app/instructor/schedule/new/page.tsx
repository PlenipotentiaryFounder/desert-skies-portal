import { getInstructorEnrollments } from "@/lib/enrollment-service"
import { getSyllabusLessons } from "@/lib/syllabus-service"
import { getManeuvers } from "@/lib/maneuver-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { MissionFormClient } from "@/components/instructor/mission-form-client"
import { revalidatePath } from "next/cache"

export const metadata = {
  title: "Schedule New Mission | Desert Skies",
  description: "Schedule a new mission (flight session) for a student",
}

export default async function ScheduleNewMissionPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>You must be logged in as an instructor.</div>

  // Fetch all enrollments for this instructor
  const enrollments = await getInstructorEnrollments(user.id)
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
export async function scheduleMissionServerAction(formData: any) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
      if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    let lessonId = formData.lessonId
    
    // If custom mission, create a custom lesson first
    if (formData.mode === "custom" && formData.custom) {
      const { data: customLesson, error: lessonError } = await supabase
        .from("lessons")
        .insert({
          title: formData.custom.title,
          description: formData.custom.objective || "",
          lesson_type: "flight",
          syllabus_id: null, // Custom lessons don't belong to a syllabus
          lesson_order: 999, // Put custom lessons at the end
          duration_minutes: 60, // Default duration
          ground_time_minutes: 30,
          is_solo: false,
          is_stage_check: false,
          objectives: formData.custom.objective || "",
          topics: formData.custom.topics || "",
          standards: formData.custom.standards || "",
          prep_work: formData.custom.prep || "",
          skills: formData.custom.skills || "",
          common_errors: formData.custom.errors || "",
          instructor_role: formData.custom.role || "",
          student_materials: formData.custom.whatToBring || "",
          notes: formData.custom.notes || "",
          created_by: user.id,
        })
        .select()
        .single()

      if (lessonError) {
        console.error("Error creating custom lesson:", lessonError)
        return { success: false, error: "Failed to create custom lesson" }
      }

      lessonId = customLesson.id

      // If custom maneuvers were selected, associate them with the lesson
      if (formData.custom.maneuvers && formData.custom.maneuvers.length > 0) {
        const lessonManeuvers = formData.custom.maneuvers.map((maneuverId: string) => ({
          lesson_id: lessonId,
          maneuver_id: maneuverId,
          is_required: true,
        }))

        const { error: maneuverError } = await supabase
          .from("lesson_maneuvers")
          .insert(lessonManeuvers)

        if (maneuverError) {
          console.error("Error associating maneuvers with lesson:", maneuverError)
          // Don't fail the whole operation for this
        }
      }
    }

    // Create the flight session
    const { data: flightSession, error: sessionError } = await supabase
      .from("flight_sessions")
      .insert({
        enrollment_id: formData.enrollmentId,
        lesson_id: lessonId,
        instructor_id: user.id,
        aircraft_id: formData.aircraftId,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        hobbs_start: 0, // Will be filled in during the session
        hobbs_end: 0,
        status: "scheduled",
        notes: formData.notes || null,
        session_type: "mission",
        prebrief_minutes: 30,
        postbrief_minutes: 30,
        request_status: "approved", // Instructor scheduling is auto-approved
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Error creating flight session:", sessionError)
      return { success: false, error: "Failed to schedule mission" }
    }

    // Revalidate relevant paths
    revalidatePath("/instructor/schedule")
    revalidatePath("/student/schedule")
    revalidatePath("/admin/schedule")

    return { success: true, data: flightSession }
  } catch (error) {
    console.error("Error in scheduleMissionServerAction:", error)
    return { success: false, error: "Internal server error" }
  }
} 