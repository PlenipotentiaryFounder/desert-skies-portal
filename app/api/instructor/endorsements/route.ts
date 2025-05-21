import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const instructorId = searchParams.get("instructorId")
  if (!instructorId) return NextResponse.json({ error: "Missing instructorId" }, { status: 400 })
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("endorsements")
    .select(`
      id,
      created_at,
      endorsement_type,
      status,
      student_id,
      student:student_id (
        first_name,
        last_name
      )
    `)
    .eq("instructor_id", instructorId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ endorsements: data || [] })
} 