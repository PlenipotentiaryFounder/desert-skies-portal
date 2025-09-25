import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const instructorId = searchParams.get("instructorId")
  if (!instructorId) return NextResponse.json({ error: "Missing instructorId" }, { status: 400 })
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Total students
  const { count: totalStudents } = await supabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", instructorId)

  // Total sessions
  const { count: totalSessions } = await supabase
    .from("flight_sessions")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", instructorId)

  // Total endorsements
  const { count: totalEndorsements } = await supabase
    .from("endorsements")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", instructorId)

  return NextResponse.json({
    totalStudents: totalStudents || 0,
    totalSessions: totalSessions || 0,
    totalEndorsements: totalEndorsements || 0,
  })
} 
