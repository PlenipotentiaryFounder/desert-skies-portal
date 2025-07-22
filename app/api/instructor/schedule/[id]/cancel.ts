import { NextRequest, NextResponse } from "next/server"
import { updateFlightSession } from "@/lib/flight-session-service"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { id } = params

  // Get the current user
  const {
    data: { user },
    error: sessionError
  } = await supabase.auth.getUser()
  if (sessionError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // TODO: Optionally, check permissions (student or instructor)

  // Cancel the session
  const result = await updateFlightSession(id, {
    request_status: "cancelled",
    status: "canceled"
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ session: result.data }, { status: 200 })
} 