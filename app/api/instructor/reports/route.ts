import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getInstructorPerformanceReport } from "@/lib/report-service"

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
    const timeframe = searchParams.get("timeframe") || "month"
    
    // For instructor route, use the authenticated user's ID
    const data = await getInstructorPerformanceReport(user.id, timeframe as any)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in instructor reports API:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch report" }, { status: 500 })
  }
} 