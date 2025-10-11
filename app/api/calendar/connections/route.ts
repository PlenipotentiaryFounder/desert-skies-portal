import { NextRequest, NextResponse } from "next/server"
import { CalendarOAuthService } from "@/lib/calendar-oauth-service"
import { getUserFromApiRequest } from "@/lib/user-service"

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromApiRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get calendar connections for the user
    const connections = await CalendarOAuthService.getCalendarConnections(user.id)

    return NextResponse.json(connections)
  } catch (error) {
    console.error("Failed to fetch calendar connections:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar connections" },
      { status: 500 }
    )
  }
}
