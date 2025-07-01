import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const instructorId = searchParams.get("instructorId")
  if (!instructorId) return NextResponse.json({ error: "Missing instructorId" }, { status: 400 })
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from("flight_sessions")
    .select(`
      id,
      date,
      start_time,
      end_time,
      status,
      aircraft:aircraft_id (
        tail_number,
        make,
        model
      ),
      lesson:lesson_id (
        title
      ),
      enrollment:enrollment_id (
        student:student_id (
          first_name,
          last_name
        )
      )
    `)
    .eq("instructor_id", instructorId)
    .gte("start_time", new Date().toISOString())
    .lt("start_time", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("start_time", { ascending: true })
    .limit(5)
  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ sessions: data || [] })
} 