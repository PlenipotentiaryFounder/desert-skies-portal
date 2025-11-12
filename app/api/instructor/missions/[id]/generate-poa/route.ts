import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getMissionById } from "@/lib/mission-service"
import { generatePlanOfAction } from "@/lib/plan-of-action-service"

/**
 * POST /api/instructor/missions/[id]/generate-poa
 * Generate a Plan of Action for a mission
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // Get the mission
    const mission = await getMissionById(id)
    if (!mission) {
      return NextResponse.json(
        { success: false, error: "Mission not found" },
        { status: 404 }
      )
    }

    // Verify instructor owns this mission
    if (mission.assigned_instructor_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Generate POA
    const result = await generatePlanOfAction(
      id,
      mission.lesson_template_id,
      mission.student_id
    )

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to generate POA" },
        { status: 500 }
      )
    }

    // Link POA to mission
    await supabase
      .from("missions")
      .update({ plan_of_action_id: result.data.id })
      .eq("id", id)

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Plan of Action generated successfully",
    })
  } catch (error) {
    console.error("Error generating POA:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

