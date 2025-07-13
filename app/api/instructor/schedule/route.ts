import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getUserFromApiRequest } from "@/lib/user-service"
import { revalidatePath } from "next/cache"

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromApiRequest(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.json()
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

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
        return NextResponse.json({ error: "Failed to create custom lesson" }, { status: 500 })
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
      return NextResponse.json({ error: "Failed to schedule mission" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: flightSession })
  } catch (error) {
    console.error("Error in schedule POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}