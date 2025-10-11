import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiRouteClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const instructorId = searchParams.get('instructor_id')

    if (!studentId || !instructorId) {
      return NextResponse.json({ error: "Missing student_id or instructor_id" }, { status: 400 })
    }

    // Get custom rate for this student-instructor pair
    const { data: customRate, error } = await supabase
      .from('student_instructor_rates')
      .select('flight_instruction_rate, ground_instruction_rate')
      .eq('student_id', studentId)
      .eq('instructor_id', instructorId)
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching rates:', error)
      throw new Error('Failed to fetch rates')
    }

    // Return custom rates if found, otherwise return default rates
    const rates = customRate || {
      flight_instruction_rate: 75.00,
      ground_instruction_rate: 75.00
    }

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error in rates API:', error)
    return NextResponse.json(
      { error: "Failed to fetch rates" },
      { status: 500 }
    )
  }
}
