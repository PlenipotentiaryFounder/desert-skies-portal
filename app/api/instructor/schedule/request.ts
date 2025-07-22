import { NextRequest, NextResponse } from "next/server"
import { createFlightSession } from "@/lib/flight-session-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { createNotification } from "@/lib/notification-service"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    enrollment_id,
    lesson_id,
    instructor_id,
    aircraft_id,
    date,
    start_time,
    end_time,
    hobbs_start,
    hobbs_end,
    notes,
    weather_conditions,
    session_type,
    prebrief_minutes,
    postbrief_minutes,
    location_id,
    recurrence_rule
  } = await req.json()

  // Get the current user (student)
  const {
    data: { user },
    error: sessionError
  } = await supabase.auth.getUser()
  if (sessionError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Create the session request
  const result = await createFlightSession({
    enrollment_id,
    lesson_id,
    instructor_id,
    aircraft_id,
    date,
    start_time,
    end_time,
    hobbs_start,
    hobbs_end,
    notes,
    weather_conditions,
    session_type,
    prebrief_minutes,
    postbrief_minutes,
    location_id,
    recurrence_rule,
    requested_by: user.id,
    request_status: "pending",
    status: "scheduled"
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  // Create a notification for the instructor
  await createNotification({
    userId: instructor_id,
    title: "New Session Request",
    message: "A student has requested a new session.",
    category: "system_announcement",
    link: "/instructor/schedule/requests",
    relatedEntityId: result.data.id,
    relatedEntityType: "flight_session"
  })

  return NextResponse.json({ session: result.data }, { status: 201 })
} 