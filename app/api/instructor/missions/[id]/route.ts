import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { 
  getMissionById, 
  updateMission, 
  cancelMission,
  completeMission 
} from "@/lib/mission-service"

/**
 * GET /api/instructor/missions/[id]
 * Get a specific mission by ID
 */
export async function GET(
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

    const mission = await getMissionById(id)

    if (!mission) {
      return NextResponse.json(
        { success: false, error: "Mission not found" },
        { status: 404 }
      )
    }

    // Verify instructor has access to this mission
    if (mission.assigned_instructor_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: mission,
    })
  } catch (error) {
    console.error("Error fetching mission:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/instructor/missions/[id]
 * Update a mission
 */
export async function PATCH(
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

    const updates = await req.json()

    // Verify instructor owns this mission
    const mission = await getMissionById(id)
    if (!mission || mission.assigned_instructor_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    const result = await updateMission(id, updates)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Mission updated successfully",
    })
  } catch (error) {
    console.error("Error updating mission:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/instructor/missions/[id]
 * Cancel a mission
 */
export async function DELETE(
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

    // Get cancellation reason from request body
    const body = await req.json().catch(() => ({}))
    const reason = body.reason || "Cancelled by instructor"

    // Verify instructor owns this mission
    const mission = await getMissionById(id)
    if (!mission || mission.assigned_instructor_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    const result = await cancelMission(id, user.id, reason)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Mission cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling mission:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

