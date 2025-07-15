import { createClient } from '@supabase/supabase-js'
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

export async function POST(request: Request) {
  try {
    const requestData = await request.json()
    const { userId, email, firstName, lastName, role, status = "active" } = requestData

    console.log("Creating profile for user:", { userId, email, firstName, lastName, role, status })

    // Validate required fields
    if (!userId || !email || !firstName || !lastName || !role) {
      console.error("Missing required fields:", { userId, email, firstName, lastName, role })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create a Supabase client with the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert the profile with the appropriate status
    // Instructors start with "pending" status by default
    const profileData = {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      status: role === "instructor" ? "pending" : status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Inserting profile:", profileData)

    const { data: profileResult, error: profileError } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single()

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json({ error: `Profile creation failed: ${profileError.message}` }, { status: 500 })
    }

    console.log("Profile created successfully:", profileResult)

    // Assign user role in user_roles table
    // 1. Look up the role_id from the roles table
    const { data: roleRow, error: roleLookupError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", role)
      .single()

    if (roleLookupError || !roleRow) {
      console.error("Role lookup error:", roleLookupError)
      return NextResponse.json({ error: `Role lookup failed: ${roleLookupError?.message || 'Role not found'}` }, { status: 500 })
    }

    // 2. Insert into user_roles
    const { error: userRoleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role_id: roleRow.id })

    if (userRoleError) {
      console.error("User role assignment error:", userRoleError)
      return NextResponse.json({ error: `User role assignment failed: ${userRoleError.message}` }, { status: 500 })
    }

    // If this is an instructor, create a notification for admins
    if (role === "instructor") {
      try {
        console.log("Creating instructor notification...")
        const { error: notificationError } = await supabase.from("notifications").insert({
          type: "instructor_approval",
          title: "New Instructor Registration",
          message: `${firstName} ${lastName} has registered as an instructor and is awaiting approval.`,
          user_id: null, // null means it's for all admins
          is_read: false,
          created_at: new Date().toISOString(),
          metadata: JSON.stringify({ instructor_id: userId }),
        })

        if (notificationError) {
          console.error("Notification creation error:", notificationError)
        } else {
          console.log("Instructor notification created successfully")
        }
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError)
        // Continue even if notification creation fails
      }
    }

    // If this is a student, create an onboarding record
    if (role === "student") {
      try {
        console.log("Creating student onboarding record...")
        const onboardingData = {
          user_id: userId,
          current_step: 'welcome',
          step_number: 1,
          completed_steps: {},
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        }

        const { error: onboardingError } = await supabase
          .from("student_onboarding")
          .insert(onboardingData)

        if (onboardingError) {
          console.error("Onboarding record creation error:", onboardingError)
        } else {
          console.log("Student onboarding record created successfully")
        }
      } catch (onboardingError) {
        console.error("Error creating onboarding record:", onboardingError)
        // Continue even if onboarding creation fails
      }
    }

    return NextResponse.json({ success: true, profile: profileResult })
  } catch (error) {
    console.error("Error creating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
