import { NextRequest, NextResponse } from "next/server"
import { getStudentProgressReport } from "@/lib/report-service"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  const syllabusId = searchParams.get("syllabusId")
  if (!studentId) {
    return NextResponse.json({ error: "Missing studentId" }, { status: 400 })
  }
  try {
    const data = await getStudentProgressReport(studentId, syllabusId || undefined)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch report" }, { status: 500 })
  }
} 