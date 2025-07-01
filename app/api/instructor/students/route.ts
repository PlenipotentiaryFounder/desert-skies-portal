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
    .from("student_enrollments")
    .select(`
      id,
      start_date,
      status,
      student_id,
      syllabus_id,
      syllabi:syllabus_id (
        title,
        faa_type
      ),
      students:student_id (
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        status
      )
    `)
    .eq("instructor_id", instructorId)
    .eq("status", "active")
    .order("start_date", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ students: data || [] })
} 