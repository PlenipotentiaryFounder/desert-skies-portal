import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { calculateMissionEndTime } from "@/lib/mission-time-blocks"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      date,
      startTime,
      duration, // minutes
      missionType, // 'F', 'G', or 'S'
      studentId,
      instructorId,
      aircraftId
    } = body

    if (!date || !startTime || !duration || !missionType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const conflicts: Array<{
      type: 'student' | 'instructor' | 'aircraft'
      message: string
      mission?: any
    }> = []

    // Calculate end time based on mission type and duration
    const endTime = calculateMissionEndTime(
      missionType as 'F' | 'G' | 'S',
      startTime,
      duration
    )

    // Check student availability
    if (studentId) {
      const { data: studentMissions } = await supabase
        .from("missions")
        .select("*, lesson_template:syllabus_lessons!lesson_template_id(title)")
        .eq("student_id", studentId)
        .eq("scheduled_date", date)
        .in("status", ["scheduled", "in_progress"])

      if (studentMissions && studentMissions.length > 0) {
        for (const mission of studentMissions) {
          const missionStart = mission.scheduled_start_time || "00:00"
          const missionEnd = calculateMissionEndTime(
            mission.mission_type as 'F' | 'G' | 'S',
            missionStart,
            120 // default duration
          )

          // Check for time overlap
          if (
            (startTime >= missionStart && startTime < missionEnd) ||
            (endTime > missionStart && endTime <= missionEnd) ||
            (startTime <= missionStart && endTime >= missionEnd)
          ) {
            conflicts.push({
              type: 'student',
              message: `Student already has a mission scheduled from ${missionStart} to ${missionEnd}`,
              mission: {
                id: mission.id,
                code: mission.mission_code,
                title: mission.lesson_template?.title || "Mission"
              }
            })
          }
        }
      }
    }

    // Check instructor availability
    if (instructorId) {
      const { data: instructorMissions } = await supabase
        .from("missions")
        .select("*, student:profiles!student_id(first_name, last_name)")
        .eq("assigned_instructor_id", instructorId)
        .eq("scheduled_date", date)
        .in("status", ["scheduled", "in_progress"])

      if (instructorMissions && instructorMissions.length > 0) {
        for (const mission of instructorMissions) {
          const missionStart = mission.scheduled_start_time || "00:00"
          const missionEnd = calculateMissionEndTime(
            mission.mission_type as 'F' | 'G' | 'S',
            missionStart,
            120 // default duration
          )

          // Check for time overlap
          if (
            (startTime >= missionStart && startTime < missionEnd) ||
            (endTime > missionStart && endTime <= missionEnd) ||
            (startTime <= missionStart && endTime >= missionEnd)
          ) {
            const studentName = mission.student 
              ? `${mission.student.first_name} ${mission.student.last_name}`
              : "Unknown"

            conflicts.push({
              type: 'instructor',
              message: `Instructor already scheduled with ${studentName} from ${missionStart} to ${missionEnd}`,
              mission: {
                id: mission.id,
                code: mission.mission_code,
                studentName
              }
            })
          }
        }
      }

      // Check instructor availability settings
      const { data: availability } = await supabase
        .from("instructor_availability")
        .select("*")
        .eq("instructor_id", instructorId)
        .eq("date", date)
        .single()

      if (availability && availability.status === "not_available") {
        conflicts.push({
          type: 'instructor',
          message: `Instructor marked as not available on this date`
        })
      }
    }

    // Check aircraft availability (for flight missions only)
    if (missionType === 'F' && aircraftId) {
      const { data: aircraftMissions } = await supabase
        .from("missions")
        .select("*, student:profiles!student_id(first_name, last_name)")
        .eq("scheduled_aircraft_id", aircraftId)
        .eq("scheduled_date", date)
        .in("status", ["scheduled", "in_progress"])

      if (aircraftMissions && aircraftMissions.length > 0) {
        for (const mission of aircraftMissions) {
          const missionStart = mission.scheduled_start_time || "00:00"
          const missionEnd = calculateMissionEndTime(
            'F', // Aircraft missions are always flights
            missionStart,
            120 // default duration
          )

          // Check for time overlap
          if (
            (startTime >= missionStart && startTime < missionEnd) ||
            (endTime > missionStart && endTime <= missionEnd) ||
            (startTime <= missionStart && endTime >= missionEnd)
          ) {
            const studentName = mission.student 
              ? `${mission.student.first_name} ${mission.student.last_name}`
              : "Unknown"

            conflicts.push({
              type: 'aircraft',
              message: `Aircraft already scheduled with ${studentName} from ${missionStart} to ${missionEnd}`,
              mission: {
                id: mission.id,
                code: mission.mission_code,
                studentName
              }
            })
          }
        }
      }

      // Check aircraft maintenance schedule
      const { data: maintenance } = await supabase
        .from("maintenance_events")
        .select("*")
        .eq("aircraft_id", aircraftId)
        .eq("status", "scheduled")
        .lte("scheduled_start_date", date)
        .gte("scheduled_end_date", date)

      if (maintenance && maintenance.length > 0) {
        conflicts.push({
          type: 'aircraft',
          message: `Aircraft is scheduled for maintenance on this date`
        })
      }
    }

    return NextResponse.json({
      success: true,
      available: conflicts.length === 0,
      conflicts,
      endTime
    })
  } catch (error: any) {
    console.error("Error in POST /api/instructor/check-availability:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

