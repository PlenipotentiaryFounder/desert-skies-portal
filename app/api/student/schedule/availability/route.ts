import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

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
    const instructorId = searchParams.get("instructorId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!instructorId || !startDate || !endDate) {
      return NextResponse.json({ 
        error: "Missing required parameters: instructorId, startDate, endDate" 
      }, { status: 400 })
    }

    // Get student's enrollment to find their instructor
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("instructor_id")
      .eq("student_id", user.id)
      .eq("status", "active")
      .single()

    if (!enrollment) {
      return NextResponse.json({ 
        error: "No active enrollment found" 
      }, { status: 404 })
    }

    // If instructorId doesn't match student's instructor, return error
    if (enrollment.instructor_id !== instructorId) {
      return NextResponse.json({ 
        error: "Instructor not assigned to this student" 
      }, { status: 403 })
    }

    // Get instructor's existing sessions in the date range
    const { data: existingSessions, error: sessionsError } = await supabase
      .from("flight_sessions")
      .select(`
        id,
        date,
        start_time,
        end_time,
        status,
        request_status,
        lesson:lesson_id (
          title,
          lesson_type
        ),
        enrollment:enrollment_id (
          student:student_id (
            first_name,
            last_name
          )
        )
      `)
      .eq("instructor_id", instructorId)
      .gte("date", startDate)
      .lte("date", endDate)
      .in("status", ["scheduled", "completed"])
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (sessionsError) {
      console.error("Error fetching instructor sessions:", sessionsError)
      return NextResponse.json({ 
        error: "Failed to fetch instructor availability" 
      }, { status: 500 })
    }

    // Get instructor's working hours (for now, assume standard 8 AM - 6 PM)
    // In a real system, this would come from an instructor_schedules table
    const workingHours = {
      start: "08:00",
      end: "18:00",
      days: [1, 2, 3, 4, 5, 6, 0] // Monday through Sunday
    }

    // Generate available time slots
    const availableSlots = generateAvailableTimeSlots(
      startDate,
      endDate,
      workingHours,
      existingSessions || []
    )

    return NextResponse.json({
      instructorId,
      workingHours,
      existingSessions: existingSessions || [],
      availableSlots,
      dateRange: { startDate, endDate }
    })

  } catch (error) {
    console.error("Error in availability API:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

function generateAvailableTimeSlots(
  startDate: string,
  endDate: string,
  workingHours: { start: string; end: string; days: number[] },
  existingSessions: any[]
) {
  const slots: any[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Standard session durations (in minutes)
  const sessionDurations = [60, 90, 120, 180] // 1hr, 1.5hr, 2hr, 3hr
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay()
    
    // Skip if instructor doesn't work this day
    if (!workingHours.days.includes(dayOfWeek)) {
      continue
    }
    
    const dateStr = date.toISOString().split('T')[0]
    
    // Get existing sessions for this date
    const daySessions = existingSessions.filter(s => s.date === dateStr)
    
    // Generate time slots for this date
    const daySlots = generateDayTimeSlots(
      dateStr,
      workingHours,
      daySessions,
      sessionDurations
    )
    
    slots.push(...daySlots)
  }
  
  return slots
}

function generateDayTimeSlots(
  date: string,
  workingHours: { start: string; end: string },
  existingSessions: any[],
  durations: number[]
) {
  const slots: any[] = []
  const [startHour, startMin] = workingHours.start.split(':').map(Number)
  const [endHour, endMin] = workingHours.end.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  // Create occupied time ranges
  const occupiedRanges = existingSessions.map(session => ({
    start: timeToMinutes(session.start_time),
    end: timeToMinutes(session.end_time)
  })).sort((a, b) => a.start - b.start)
  
  // Generate available slots
  for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += 30) {
    for (const duration of durations) {
      const slotEnd = currentMinutes + duration
      
      // Skip if slot goes beyond working hours
      if (slotEnd > endMinutes) break
      
      // Check if this slot conflicts with existing sessions
      const conflicts = occupiedRanges.some(range => 
        (currentMinutes < range.end && slotEnd > range.start)
      )
      
      if (!conflicts) {
        slots.push({
          date,
          startTime: minutesToTime(currentMinutes),
          endTime: minutesToTime(slotEnd),
          duration,
          available: true
        })
      }
    }
  }
  
  return slots
}

function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

