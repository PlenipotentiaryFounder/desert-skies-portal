import { NextRequest, NextResponse } from "next/server"
import { CalendarSyncService } from "@/lib/calendar-sync-service"
import { getUserFromApiRequest } from "@/lib/user-service"

export async function POST(
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

    // Trigger manual sync
    const result = await CalendarSyncService.triggerManualSync(connectionId, user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to trigger manual sync:", error)
    return NextResponse.json(
      { error: "Failed to trigger manual sync" },
      { status: 500 }
    )
  }
}
