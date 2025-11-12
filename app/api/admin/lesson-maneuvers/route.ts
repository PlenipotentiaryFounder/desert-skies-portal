import { NextRequest, NextResponse } from "next/server"
import { replaceLessonManeuvers } from "@/lib/maneuver-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * POST: Replace all maneuvers for a lesson
 * This handles bulk update of lesson maneuvers including FOI proficiency levels
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify user has admin or instructor role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin or Instructor access required" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { lessonId, maneuvers } = body

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      )
    }

    if (!Array.isArray(maneuvers)) {
      return NextResponse.json(
        { error: "maneuvers must be an array" },
        { status: 400 }
      )
    }

    console.log('[API] Replacing maneuvers for lesson:', lessonId)
    console.log('[API] Maneuvers count:', maneuvers.length)

    // Validate maneuver data
    for (const maneuver of maneuvers) {
      if (!maneuver.maneuver_id) {
        return NextResponse.json(
          { error: "Each maneuver must have a maneuver_id" },
          { status: 400 }
        )
      }

      // Validate target_proficiency is 1-4
      if (
        typeof maneuver.target_proficiency !== 'number' ||
        maneuver.target_proficiency < 1 ||
        maneuver.target_proficiency > 4
      ) {
        return NextResponse.json(
          { error: "target_proficiency must be a number between 1 and 4" },
          { status: 400 }
        )
      }

      // Validate emphasis_level
      const validEmphasisLevels = ['introduction', 'standard', 'proficiency', 'mastery']
      if (!validEmphasisLevels.includes(maneuver.emphasis_level)) {
        return NextResponse.json(
          { error: `emphasis_level must be one of: ${validEmphasisLevels.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Use the service function to replace maneuvers
    const result = await replaceLessonManeuvers(lessonId, maneuvers)

    if (!result.success) {
      console.error('[API] Failed to replace maneuvers:', result.error)
      return NextResponse.json(
        { error: result.error || "Failed to update maneuvers" },
        { status: 500 }
      )
    }

    console.log('[API] Successfully replaced maneuvers')
    return NextResponse.json({
      success: true,
      message: "Maneuvers updated successfully",
      data: result.data
    })

  } catch (error) {
    console.error("[API] Error in lesson-maneuvers POST:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * GET: Fetch all maneuvers for a lesson
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get("lessonId")

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId query parameter is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("lesson_maneuvers")
      .select(`
        *,
        maneuver:maneuvers (
          id,
          name,
          description,
          category,
          faa_reference,
          primary_acs_task_code,
          tolerances
        )
      `)
      .eq("lesson_id", lessonId)
      .order("display_order")

    if (error) {
      console.error("[API] Error fetching lesson maneuvers:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error("[API] Error in lesson-maneuvers GET:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Remove a specific maneuver from a lesson
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify user has admin or instructor role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json(
        { error: "Forbidden - Admin or Instructor access required" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get("lessonId")
    const maneuverId = searchParams.get("maneuverId")

    if (!lessonId || !maneuverId) {
      return NextResponse.json(
        { error: "lessonId and maneuverId query parameters are required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("lesson_maneuvers")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("maneuver_id", maneuverId)

    if (error) {
      console.error("[API] Error deleting lesson maneuver:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Maneuver removed from lesson successfully"
    })

  } catch (error) {
    console.error("[API] Error in lesson-maneuvers DELETE:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}



