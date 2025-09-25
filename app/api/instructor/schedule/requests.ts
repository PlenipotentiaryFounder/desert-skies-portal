import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  // Get the current user (instructor)
  const {
    data: { user },
    error: sessionError
  } = await supabase.auth.getUser()
  if (sessionError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get all pending requests for this instructor
  const { data, error } = await supabase
    .from("flight_sessions")
    .select("*")
    .eq("instructor_id", user.id)
    .eq("request_status", "pending")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ requests: data }, { status: 200 })
} 
