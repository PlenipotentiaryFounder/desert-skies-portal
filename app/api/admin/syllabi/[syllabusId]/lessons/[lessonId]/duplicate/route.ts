import { NextRequest, NextResponse } from "next/server"
import { duplicateLesson } from "@/lib/syllabus-service"

export async function POST(
  request: NextRequest,
  { params }: { params: { syllabusId: string; lessonId: string } }
) {
  try {
    const result = await duplicateLesson(params.lessonId, params.syllabusId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to duplicate lesson" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("Error duplicating lesson:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 