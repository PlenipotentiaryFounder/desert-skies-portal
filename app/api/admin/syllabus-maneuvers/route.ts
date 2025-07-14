import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get("lessonId")
    
    if (lessonId) {
      // Get maneuvers for a specific lesson
      const { data, error } = await supabase
        .from("lesson_maneuvers")
        .select(`
          id,
          is_required,
          maneuver:maneuver_id (
            id,
            name,
            description,
            category,
            faa_reference
          )
        `)
        .eq("lesson_id", lessonId)
        .order("maneuver(name)")
      
      if (error) {
        console.error("Error fetching lesson maneuvers:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      // Format the response to match the expected structure
      const formattedData = data?.map(item => ({
        ...item.maneuver,
        is_required: item.is_required
      })) || []
      
      return NextResponse.json({ maneuvers: formattedData })
    } else {
      // Get all maneuvers
      const { data, error } = await supabase.from("maneuvers").select("*").order("name")
      if (error) {
        console.error("Error fetching maneuvers:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ maneuvers: data })
    }
  } catch (error) {
    console.error("Error in GET /api/admin/syllabus-maneuvers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Associate maneuvers with a lesson
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId, maneuvers } = await req.json()

    if (!lessonId || !Array.isArray(maneuvers)) {
      return NextResponse.json({ error: "Missing lessonId or maneuvers array" }, { status: 400 })
    }

    // First, delete existing associations for this lesson
    const { error: deleteError } = await supabase
      .from("lesson_maneuvers")
      .delete()
      .eq("lesson_id", lessonId)

    if (deleteError) {
      console.error("Error deleting existing lesson maneuvers:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Then, insert new associations
    if (maneuvers.length > 0) {
      const associations = maneuvers.map((maneuver: any) => ({
        lesson_id: lessonId,
        maneuver_id: maneuver.id,
        is_required: maneuver.is_required || true
      }))

      const { error: insertError } = await supabase
        .from("lesson_maneuvers")
        .insert(associations)

      if (insertError) {
        console.error("Error inserting lesson maneuvers:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Maneuvers associated successfully" })
  } catch (error) {
    console.error("Error in POST /api/admin/syllabus-maneuvers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Remove a specific maneuver association from a lesson
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get("lessonId")
    const maneuverId = searchParams.get("maneuverId")

    if (!lessonId || !maneuverId) {
      return NextResponse.json({ error: "Missing lessonId or maneuverId" }, { status: 400 })
    }

    const { error } = await supabase
      .from("lesson_maneuvers")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("maneuver_id", maneuverId)

    if (error) {
      console.error("Error deleting lesson maneuver:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Maneuver association removed successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/admin/syllabus-maneuvers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 