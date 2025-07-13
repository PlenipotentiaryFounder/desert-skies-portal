import { NextRequest, NextResponse } from "next/server"
import { updateLessonOrder } from "@/lib/syllabus-service"

export async function POST(
  request: NextRequest,
  { params }: { params: { syllabusId: string } }
) {
  try {
    const { lessonUpdates } = await request.json()

    if (!lessonUpdates || !Array.isArray(lessonUpdates)) {
      return NextResponse.json(
        { error: "Invalid lesson updates data" },
        { status: 400 }
      )
    }

    const result = await updateLessonOrder(params.syllabusId, lessonUpdates)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update lesson order" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering lessons:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 