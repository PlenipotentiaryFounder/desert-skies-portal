import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(await cookies())
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if user is an instructor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'instructor') {
      return NextResponse.json(
        { error: "Only instructors can suggest edits" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { lesson_id, field_name, current_value, suggested_value, reason } = body

    // Validate required fields
    if (!lesson_id || !field_name || suggested_value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create the suggestion
    const { data: suggestion, error } = await supabase
      .from('lesson_edit_suggestions')
      .insert({
        lesson_id,
        instructor_id: user.id,
        field_name,
        current_value,
        suggested_value,
        reason,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating suggestion:", error)
      return NextResponse.json(
        { error: "Failed to create suggestion" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: suggestion })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

