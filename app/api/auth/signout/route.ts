import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL))
  } catch (error) {
    console.error("Server error during sign out:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 