import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient(await cookies())
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    // Get missions scheduled for this instructor
    let query = supabase
      .from('missions')
      .select(`
        id,
        mission_code,
        mission_type,
        scheduled_date,
        scheduled_start_time,
        status,
        student:student_id (
          first_name,
          last_name
        ),
        lesson_template:lesson_template_id (
          title
        )
      `)
      .eq('assigned_instructor_id', user.id)
      .in('status', ['scheduled', 'in_progress'])

    if (start) {
      query = query.gte('scheduled_date', start)
    }
    if (end) {
      query = query.lte('scheduled_date', end)
    }

    const { data: missions, error } = await query.order('scheduled_date', { ascending: true })

    if (error) {
      console.error("Error fetching schedule:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform missions into events
    const events = missions?.map(mission => ({
      id: mission.id,
      title: mission.lesson_template?.title || `Mission ${mission.mission_code}`,
      date: mission.scheduled_date,
      start_time: mission.scheduled_start_time || '09:00',
      type: mission.mission_type,
      student_name: mission.student 
        ? `${mission.student.first_name} ${mission.student.last_name}`
        : undefined
    })) || []

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error("Error in schedule API:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedule" },
      { status: 500 }
    )
  }
}
