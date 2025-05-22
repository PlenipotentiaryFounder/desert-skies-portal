import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()

  // Get the current user (instructor)
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()
  if (sessionError || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get all pending requests for this instructor
  const { data, error } = await supabase
    .from("flight_sessions")
    .select("*")
    .eq("instructor_id", session.user.id)
    .eq("request_status", "pending")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ requests: data }, { status: 200 })
} 