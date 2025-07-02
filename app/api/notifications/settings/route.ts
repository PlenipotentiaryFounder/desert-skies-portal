import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getNotificationSettings, updateNotificationSettings } from "@/lib/notification-service"

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const settings = await getNotificationSettings(user.id)
  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 })
  }

  // Only return relevant fields to the client
  return NextResponse.json({
    emailEnabled: settings.emailEnabled,
    pushEnabled: settings.pushEnabled,
    inAppEnabled: settings.inAppEnabled,
    documentExpiration: settings.documentExpiration,
    flightReminders: settings.flightReminders,
    systemAnnouncements: settings.systemAnnouncements,
    newDocuments: settings.newDocuments,
    syllabusUpdates: settings.syllabusUpdates,
  })
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const body = await req.json()
  const success = await updateNotificationSettings({
    userId: user.id,
    ...body,
  })

  if (!success) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
} 