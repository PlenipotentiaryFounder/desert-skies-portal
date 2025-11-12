import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { completeTrainingEvent } from "@/lib/training-event-service"

/**
 * POST /api/instructor/training-events/[id]/complete
 * Complete a training event (with billing calculation)
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

    const body = await req.json()
    
    const result = await completeTrainingEvent(id, {
      actual_duration_minutes: body.actual_duration_minutes,
      notes: body.notes,
      hobbs_start: body.hobbs_start,
      hobbs_end: body.hobbs_end,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Training event completed",
    })
  } catch (error) {
    console.error("Error completing training event:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

