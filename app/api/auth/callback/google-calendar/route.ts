import { NextRequest, NextResponse } from "next/server"
import { CalendarOAuthService } from "@/lib/calendar-oauth-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_failed&provider=google`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code&provider=google`
      )
    }

    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=not_authenticated`
      )
    }

    // Exchange code for tokens
    const tokenResponse = await CalendarOAuthService.exchangeCodeForToken("google", code)

    // Get user profile for account identification
    const profile = await CalendarOAuthService.getProviderProfile("google", tokenResponse.access_token)

    // Save connection to database
    await CalendarOAuthService.saveCalendarConnection(user.id, "google", tokenResponse, profile)

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=google_connected`
    )

  } catch (error) {
    console.error("Google Calendar OAuth callback error:", error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_callback_failed&provider=google`
    )
  }
}
