import { createServerClient } from '@supabase/ssr'
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete({ name, ...options })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )

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

    // Update Thomas's profile to be active (no role or additional_roles update)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Assign admin and instructor roles using user_roles table
    // 1. Look up role_ids
    const { data: adminRole, error: adminRoleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .single()
    const { data: instructorRole, error: instructorRoleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "instructor")
      .single()
    if (adminRoleError || instructorRoleError || !adminRole || !instructorRole) {
      return NextResponse.json({ error: "Role lookup failed" }, { status: 500 })
    }
    // 2. Insert into user_roles (if not already assigned)
    await supabase.from("user_roles").upsert([
      { user_id: userId, role_id: adminRole.id },
      { user_id: userId, role_id: instructorRole.id },
    ], { onConflict: "user_id,role_id" })

    return NextResponse.json({ success: true, message: "Thomas's roles updated successfully" })
  } catch (error) {
    console.error("Error setting up Thomas's roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
