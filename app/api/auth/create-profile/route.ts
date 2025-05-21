import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { userId, email, firstName, lastName, role, status = "active" } = requestData

    // Create a Supabase client with the service role key
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Insert the profile with the appropriate status
    // Instructors start with "pending" status by default
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      status: role === "instructor" ? "pending" : status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Server profile creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If this is an instructor, create a notification for admins
    if (role === "instructor") {
      try {
        await supabase.from("notifications").insert({
          type: "instructor_approval",
          title: "New Instructor Registration",
          message: `${firstName} ${lastName} has registered as an instructor and is awaiting approval.`,
          user_id: null, // null means it's for all admins
          is_read: false,
          created_at: new Date().toISOString(),
          metadata: JSON.stringify({ instructor_id: userId }),
        })
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError)
        // Continue even if notification creation fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
