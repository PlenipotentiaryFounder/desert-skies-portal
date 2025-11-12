import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { createDebrief } from "@/lib/debrief-service"
import { createLogbookEntriesFromMission, logbookEntriesExistForMission } from "@/lib/logbook-service"

/**
 * POST /api/instructor/debriefs
 * Create a new debrief for a mission
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
    if (!formData.mission_id || !formData.student_id || !formData.instructor_id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create the debrief
    const result = await createDebrief({
      mission_id: formData.mission_id,
      student_id: formData.student_id,
      instructor_id: formData.instructor_id,
      general_overview: formData.general_overview,
      key_takeaways: formData.key_takeaways,
      maneuver_details: formData.maneuver_details,
      next_lesson_plan: formData.next_lesson_plan,
      raw_transcript: formData.raw_transcript,
      transcript_duration_seconds: formData.transcript_duration_seconds,
    })

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create debrief" },
        { status: 500 }
      )
    }

    // ✅ NEW: Automatically create logbook entries after debrief
    // Check if logbook entries already exist to prevent duplicates
    const logbookExists = await logbookEntriesExistForMission(formData.mission_id)
    
    if (!logbookExists) {
      console.log(`Creating logbook entries for mission ${formData.mission_id}`)
      const logbookResult = await createLogbookEntriesFromMission(formData.mission_id)
      
      if (!logbookResult.success) {
        console.error('Failed to create logbook entries:', logbookResult.error)
        // Don't fail the debrief creation if logbook creation fails
        // Log the error and continue
      } else {
        console.log('Logbook entries created successfully:', {
          studentEntry: logbookResult.studentEntry?.id,
          instructorEntry: logbookResult.instructorEntry?.id
        })
      }
    } else {
      console.log(`Logbook entries already exist for mission ${formData.mission_id}`)
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Debrief created successfully",
    })
  } catch (error) {
    console.error("Error creating debrief:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

