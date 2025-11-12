import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * GET /api/enrollments/[id]/next-mission-number
 * Get the next mission number for an enrollment
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

    // Get the highest mission number for this enrollment
    const { data: missions, error } = await supabase
      .from("missions")
      .select("mission_number")
      .eq("enrollment_id", id)
      .order("mission_number", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching missions:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    const nextNumber = missions && missions.length > 0 
      ? missions[0].mission_number + 1 
      : 1

    return NextResponse.json({
      success: true,
      nextNumber,
    })
  } catch (error) {
    console.error("Error in GET /api/enrollments/[id]/next-mission-number:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

