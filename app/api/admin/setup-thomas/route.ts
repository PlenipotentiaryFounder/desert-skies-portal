import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function POST() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Find Thomas's user ID
    const { data: userData, error: userError } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", "thomas@desertskiesaviationaz.com")
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = userData.id

    // Update Thomas's profile to be an admin with instructor in additional_roles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: "admin",
        status: "active",
        metadata: {
          additional_roles: ["instructor"],
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Thomas's roles updated successfully" })
  } catch (error) {
    console.error("Error setting up Thomas's roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
