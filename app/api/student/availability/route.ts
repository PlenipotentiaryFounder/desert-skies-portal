import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// GET - Fetch student availability
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json({ 
        error: "Missing required parameters: startDate, endDate" 
      }, { status: 400 })
    }

    // Get student's availability
    const { data: availability, error } = await supabase
      .from("student_availability")
      .select("*")
      .eq("student_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })

    if (error) {
      console.error("Error fetching availability:", error)
      return NextResponse.json({ 
        error: "Failed to fetch availability" 
      }, { status: 500 })
    }

    return NextResponse.json({
      availability: availability || [],
      dateRange: { startDate, endDate }
    })

  } catch (error) {
    console.error("Error in availability API:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

// POST - Create/Update availability
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { date, status, notes, start_time, end_time } = body

    if (!date || !status) {
      return NextResponse.json({ 
        error: "Missing required fields: date, status" 
      }, { status: 400 })
    }

    if (!['available', 'not_available', 'tentative'].includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be: available, not_available, or tentative" 
      }, { status: 400 })
    }

    // Check if availability already exists for this date
    const { data: existing } = await supabase
      .from("student_availability")
      .select("id")
      .eq("student_id", user.id)
      .eq("date", date)
      .is("start_time", null)
      .is("end_time", null)
      .single()

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("student_availability")
        .update({
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("student_availability")
        .insert({
          student_id: user.id,
          date,
          status,
          notes,
          start_time,
          end_time
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({
      success: true,
      availability: result
    })

  } catch (error) {
    console.error("Error saving availability:", error)
    return NextResponse.json({ 
      error: "Failed to save availability" 
    }, { status: 500 })
  }
}

// DELETE - Remove availability
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ 
        error: "Missing required parameter: date" 
      }, { status: 400 })
    }

    // Delete availability for this date
    const { error } = await supabase
      .from("student_availability")
      .delete()
      .eq("student_id", user.id)
      .eq("date", date)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error deleting availability:", error)
    return NextResponse.json({ 
      error: "Failed to delete availability" 
    }, { status: 500 })
  }
}

