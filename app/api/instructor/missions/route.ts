import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { createMissionFromTemplate } from "@/lib/mission-service"
import { generatePlanOfAction } from "@/lib/plan-of-action-service"

/**
 * POST /api/instructor/missions
 * Create a new mission with training events
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await req.json()

    // Validate required fields
    if (!formData.enrollmentId || !formData.studentId || !formData.date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create mission using our service
    const result = await createMissionFromTemplate({
      enrollment_id: formData.enrollmentId,
      assigned_instructor_id: user.id,
      student_id: formData.studentId,
      lesson_template_id: formData.mode === "precreated" ? formData.lessonId : null,
      scheduled_date: formData.date,
      scheduled_start_time: formData.startTime || null,
      scheduled_aircraft_id: formData.aircraftId || null,
      mission_type: formData.missionType || "F", // F = Flight, G = Ground, S = Simulator
      customizations: formData.mode === "custom" ? formData.custom : null,
    })

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create mission" },
        { status: 500 }
      )
    }

    const mission = result.data

    // Generate Plan of Action if requested
    if (formData.generatePOA && mission.id) {
      const poaResult = await generatePlanOfAction(
        mission.id,
        formData.lessonId || null,
        formData.studentId
      )

      if (poaResult.success && poaResult.data) {
        // POA created successfully, link it to the mission
        await supabase
          .from("missions")
          .update({ plan_of_action_id: poaResult.data.id })
          .eq("id", mission.id)
      }
    }

    return NextResponse.json({
      success: true,
      data: mission,
      message: "Mission created successfully",
    })
  } catch (error) {
    console.error("Error creating mission:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/instructor/missions
 * Get missions for the instructor
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const studentId = searchParams.get("studentId")

    let query = supabase
      .from("missions")
      .select(`
        *,
        student:student_id (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        ),
        instructor:assigned_instructor_id (
          id,
          first_name,
          last_name,
          email
        ),
        aircraft:scheduled_aircraft_id (
          id,
          tail_number,
          make,
          model
        ),
        lesson_template:lesson_template_id (
          id,
          title,
          description,
          lesson_type
        )
      `)
      .eq("assigned_instructor_id", user.id)
      .order("scheduled_date", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (studentId) {
      query = query.eq("student_id", studentId)
    }

    const { data: missions, error } = await query

    if (error) {
      console.error("Error fetching missions:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: missions,
    })
  } catch (error) {
    console.error("Error in GET /api/instructor/missions:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

