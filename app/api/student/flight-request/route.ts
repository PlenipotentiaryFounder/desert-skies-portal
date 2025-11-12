import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// POST - Create a flight request
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { date, notes } = body

    if (!date) {
      return NextResponse.json({ 
        error: "Missing required field: date" 
      }, { status: 400 })
    }

    // Get student's active enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("student_enrollments")
      .select("id, instructor_id")
      .eq("student_id", user.id)
      .eq("status", "active")
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ 
        error: "No active enrollment found" 
      }, { status: 404 })
    }

    // Create a flight session request
    // Note: This creates a pending session that the instructor needs to approve
    const { data: session, error: sessionError } = await supabase
      .from("flight_sessions")
      .insert({
        enrollment_id: enrollment.id,
        instructor_id: enrollment.instructor_id,
        date: date,
        status: 'pending',
        request_status: 'student_requested',
        student_notes: notes || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Error creating flight request:", sessionError)
      return NextResponse.json({ 
        error: "Failed to create flight request" 
      }, { status: 500 })
    }

    // TODO: Send notification to instructor
    // await sendInstructorNotification(enrollment.instructor_id, 'flight_request', session.id)

    return NextResponse.json({
      success: true,
      message: "Flight request sent to your instructor",
      sessionId: session.id
    })

  } catch (error) {
    console.error("Error in flight request API:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

// GET - Get flight requests
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student's enrollment
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("status", "active")
      .single()

    if (!enrollment) {
      return NextResponse.json({ requests: [] })
    }

    // Get pending flight requests
    const { data: requests, error } = await supabase
      .from("flight_sessions")
      .select(`
        *,
        instructor:instructor_id (
          first_name,
          last_name
        )
      `)
      .eq("enrollment_id", enrollment.id)
      .eq("request_status", "student_requested")
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching requests:", error)
      return NextResponse.json({ 
        error: "Failed to fetch requests" 
      }, { status: 500 })
    }

    return NextResponse.json({
      requests: requests || []
    })

  } catch (error) {
    console.error("Error in flight request API:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

