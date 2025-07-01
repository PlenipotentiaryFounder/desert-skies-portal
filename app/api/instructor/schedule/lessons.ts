import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const instructorId = searchParams.get("instructorId")
  const studentId = searchParams.get("studentId")
  const syllabusId = searchParams.get("syllabusId")
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  let query = supabase.from("lessons").select("id, title, syllabus_id")
  if (syllabusId) query = query.eq("syllabus_id", syllabusId)
  // Optionally filter by instructor or student if needed
  // (Assumes you have a way to relate lessons to instructors/students)
  const { data, error } = await query.order("title", { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lessons: data || [] })
} 