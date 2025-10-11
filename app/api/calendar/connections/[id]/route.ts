import { NextRequest, NextResponse } from "next/server"
import { CalendarOAuthService } from "@/lib/calendar-oauth-service"
import { getUserFromApiRequest } from "@/lib/user-service"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const user = await getUserFromApiRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const connectionId = params.id

    // Verify the user owns this connection
    const cookieStore = await import("next/headers").then(m => m.cookies())
    const supabase = await import("@/lib/supabase/server").then(m => m.createClient(cookieStore))

    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('user_id')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection || connection.user_id !== user.id) {
      return NextResponse.json(
        { error: "Calendar connection not found or access denied" },
        { status: 404 }
      )
    }

    // Delete the calendar connection
    await CalendarOAuthService.deleteCalendarConnection(connectionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete calendar connection:", error)
    return NextResponse.json(
      { error: "Failed to delete calendar connection" },
      { status: 500 }
    )
  }
}
