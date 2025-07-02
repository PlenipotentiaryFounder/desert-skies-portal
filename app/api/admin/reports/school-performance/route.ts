import { NextRequest, NextResponse } from "next/server"
import { getSchoolPerformanceReport } from "@/lib/report-service"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const timeframe = searchParams.get("timeframe") || "month"
  try {
    const data = await getSchoolPerformanceReport(timeframe)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch report" }, { status: 500 })
  }
} 