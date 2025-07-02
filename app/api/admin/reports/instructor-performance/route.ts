import { NextRequest, NextResponse } from "next/server"
import { getInstructorPerformanceReport } from "@/lib/report-service"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const instructorId = searchParams.get("instructorId")
  const timeframe = searchParams.get("timeframe") || "month"
  if (!instructorId) {
    return NextResponse.json({ error: "Missing instructorId" }, { status: 400 })
  }
  try {
    const data = await getInstructorPerformanceReport(instructorId, timeframe)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch report" }, { status: 500 })
  }
} 