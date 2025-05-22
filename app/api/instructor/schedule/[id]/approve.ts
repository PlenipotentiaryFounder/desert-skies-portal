import { NextRequest, NextResponse } from "next/server"
import { updateFlightSession } from "@/lib/flight-session-service"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { id } = params
  const {
    request_status, // "approved" | "denied"
    ...updateFields
  } = await req.json()

  // Get the current user (instructor)
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()
  if (sessionError || !session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // TODO: Optionally, check instructor permissions here

  // Update the session
  const result = await updateFlightSession(id, {
    ...updateFields,
    request_status
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ session: result.data }, { status: 200 })
} 