import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getFlightHoursReport, getStudentProgressReport } from "@/lib/report-service"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get("type")
    const timeframe = searchParams.get("timeframe") || "month"
    const syllabusId = searchParams.get("syllabusId")
    
    if (reportType === "progress") {
      // Student progress report
      const data = await getStudentProgressReport(user.id, syllabusId || undefined)
      return NextResponse.json(data)
    } else {
      // Default to flight hours report
      const data = await getFlightHoursReport(timeframe as any, { studentId: user.id })
      return NextResponse.json(data)
    }
  } catch (error: any) {
    console.error("Error in student reports API:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch report" }, { status: 500 })
  }
} 