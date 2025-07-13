import { NextRequest, NextResponse } from "next/server"
import { toggleLessonActive } from "@/lib/syllabus-service"

export async function POST(
  request: NextRequest,
  { params }: { params: { syllabusId: string; lessonId: string } }
) {
  try {
    const { isActive } = await request.json()

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid isActive value" },
        { status: 400 }
      )
    }

    const result = await toggleLessonActive(params.lessonId, params.syllabusId, isActive)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to toggle lesson active status" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error toggling lesson active status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 